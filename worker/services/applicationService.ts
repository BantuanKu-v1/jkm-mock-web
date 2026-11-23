import { D1Database } from "@cloudflare/workers-types";
import {
  type CreateApplicationPayload,
  type DbApplication,
  type JkmApplicationStatus,
} from "../types/application";

// Normalize database timestamps to ISO 8601 UTC
export function normalizeApplicationTimestamp(
    value: string
): string {
  const timestamp = value.trim();

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(timestamp)
      ? `${timestamp.replace(" ", "T")}Z`
      : timestamp;

  const date = new Date(normalized);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid application timestamp");
  }

  return date.toISOString();
}

// Retrieve an application using its external application ID
export async function getApplicationByExternalId(
    db: D1Database,
    clientId: string,
    externalApplicationId: string
): Promise<DbApplication | null> {
  return db
      .prepare(`
        SELECT *
        FROM jkm_applications
        WHERE source_system = ?
          AND external_reference = ?
      `)
      .bind(clientId, externalApplicationId)
      .first<DbApplication>();
}

// Retrieve an application using its internal ID
export async function getApplicationById(
    db: D1Database,
    clientId: string,
    applicationId: string
): Promise<DbApplication | null> {
  return db
      .prepare(`
        SELECT *
        FROM jkm_applications
        WHERE source_system = ?
          AND id = ?
      `)
      .bind(clientId, applicationId)
      .first<DbApplication>();
}

// Retrieve an active JKM program by code
export async function getProgramByCode(
    db: D1Database,
    programCode: string
): Promise<{ id: string; code: string } | null> {
  return db
      .prepare(`
        SELECT id, code
        FROM jkm_programs
        WHERE code = ?
          AND is_active = 1
      `)
      .bind(programCode)
      .first<{ id: string; code: string }>();
}

// Retrieve a JKM program regardless of its active status
export async function getProgramById(
    db: D1Database,
    programId: string
): Promise<{ id: string; code: string } | null> {
  return db
      .prepare(`
        SELECT id, code
        FROM jkm_programs
        WHERE id = ?
      `)
      .bind(programId)
      .first<{ id: string; code: string }>();
}

// Create a new JKM application
export async function createApplication(
    db: D1Database,
    clientId: string,
    data: CreateApplicationPayload
): Promise<DbApplication> {
  const program = await getProgramByCode(
      db,
      data.programCode
  );

  if (!program) {
    throw new Error("JKM program not found or inactive");
  }

  const id = crypto.randomUUID();
  const year = new Date().getUTCFullYear();

  const referenceNo = `JKM-${data.programCode}-${year}-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}`;

  const applicationData = JSON.stringify(
      data.applicationData
  );

  const historyId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await db.batch([
    db.prepare(`
      INSERT INTO jkm_applications (
        id,
        program_id,
        external_reference,
        source_system,
        reference_no,
        applicant_name,
        applicant_identification_no,
        application_data,
        status,
        submitted_at,
        updated_at
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1
        FROM jkm_programs
        WHERE id = ?
          AND is_active = 1
      )
      ON CONFLICT (source_system, external_reference)
      DO NOTHING
    `).bind(
        id,
        program.id,
        data.externalApplicationId,
        clientId,
        referenceNo,
        data.applicantName,
        data.applicantIdentificationNo ?? null,
        applicationData,
        "submitted",
        timestamp,
        timestamp,
        program.id
    ),

    db.prepare(`
      INSERT INTO jkm_application_status_history (
        id,
        application_id,
        previous_status,
        new_status,
        changed_by,
        remarks,
        changed_at
      )
      SELECT ?, id, ?, ?, ?, ?, ?
      FROM jkm_applications
      WHERE id = ?
        AND source_system = ?
    `).bind(
        historyId,
        null,
        "submitted",
        clientId,
        "Application submitted",
        timestamp,
        id,
        clientId
    ),
  ]);

  // Retrieve the application created by this request
  const application = await getApplicationById(
      db,
      clientId,
      id
  );

  if (application) {
    return application;
  }

  // Another request may have created the same application
  const existing = await getApplicationByExternalId(
      db,
      clientId,
      data.externalApplicationId
  );

  if (existing) {
    return existing;
  }

  throw new Error("Failed to create or retrieve application");
}

// Retrieve all submitted JKM applications for the admin dashboard
export async function getAllApplications(
    db: D1Database
): Promise<DbApplication[]> {
  const result = await db
      .prepare(`
        SELECT
            a.*,
            p.code AS program_code
        FROM jkm_applications a
        JOIN jkm_programs p ON a.program_id = p.id
        ORDER BY julianday(a.submitted_at) DESC, a.id DESC
      `)
      .all<DbApplication>();

  return result.results;
}

// Retrieve an application by its internal ID (admin access)
export async function getAdminApplicationById(
    db: D1Database,
    applicationId: string
): Promise<DbApplication | null> {
  return db
      .prepare(`
        SELECT *
        FROM jkm_applications
        WHERE id = ?
      `)
      .bind(applicationId)
      .first<DbApplication>();
}

// Update an application's processing status
export async function updateApplicationStatus(
    db: D1Database,
    applicationId: string,
    status: JkmApplicationStatus
): Promise<DbApplication | null> {
  const timestamp = new Date().toISOString();
  const historyId = crypto.randomUUID();

  await db.batch([
    // Record the current status before updating the application
    db.prepare(`
      INSERT INTO jkm_application_status_history (
        id,
        application_id,
        previous_status,
        new_status,
        changed_by,
        remarks,
        changed_at
      )
      SELECT
        ?,
        id,
        status,
        ?,
        ?,
        ?,
        ?
      FROM jkm_applications
      WHERE id = ?
        AND status <> ?
    `).bind(
        historyId,
        status,
        "admin",
        null,
        timestamp,
        applicationId,
        status
    ),

    // Update only when the application status changes
    db.prepare(`
      UPDATE jkm_applications
      SET status = ?,
          updated_at = ?
      WHERE id = ?
        AND status <> ?
    `).bind(
        status,
        timestamp,
        applicationId,
        status
    ),
  ]);

  return getAdminApplicationById(
      db,
      applicationId
  );
}

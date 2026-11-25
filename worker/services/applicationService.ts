import { D1Database } from "@cloudflare/workers-types";
import {
  type CreateApplicationPayload,
  type DbApplication,
  type DbAdminApplication,
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
): Promise<DbAdminApplication[]> {
  const result = await db
      .prepare(`
        SELECT
            a.*,
            p.code AS program_code
        FROM jkm_applications a
        JOIN jkm_programs p ON a.program_id = p.id
        ORDER BY julianday(a.submitted_at) DESC, a.id DESC
      `)
      .all<DbAdminApplication>();

  return result.results;
}

// Retrieve an application by its internal ID (admin access)
export async function getAdminApplicationById(
    db: D1Database,
    applicationId: string
): Promise<DbAdminApplication | null> {
  return db
      .prepare(`
          SELECT
              a.*,
              p.code AS program_code
          FROM jkm_applications a
                   JOIN jkm_programs p ON a.program_id = p.id
          WHERE a.id = ?
      `)
      .bind(applicationId)
      .first<DbAdminApplication>();
}

// Update an application's processing status
export async function updateApplicationStatus(
    db: D1Database,
    applicationId: string,
    expectedStatus: JkmApplicationStatus,
    status: JkmApplicationStatus,
    expectedUpdatedAt: string
): Promise<DbAdminApplication | null> {
  // Prevent unnecessary status updates
  if (expectedStatus === status) {
    return null;
  }

  // Ensure each status change has a strictly newer timestamp
  const previousTimestamp = Date.parse(
      normalizeApplicationTimestamp(expectedUpdatedAt)
  );

  const timestamp = new Date(
      Math.max(
          Date.now(),
          previousTimestamp + 1
      )
  ).toISOString();

  const historyId = crypto.randomUUID();

  const results = await db.batch([
    // Record the current status only if the application still matches the previously retrieved record
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
        AND status = ?
        AND updated_at = ?
    `).bind(
        historyId,
        status,
        "admin",
        null,
        timestamp,
        applicationId,
        expectedStatus,
        expectedUpdatedAt
    ),

    // Update only if the application has not changed since its status transition was validated
    db.prepare(`
      UPDATE jkm_applications
      SET status = ?,
          updated_at = ?
      WHERE id = ?
        AND status = ?
        AND updated_at = ?
    `).bind(
        status,
        timestamp,
        applicationId,
        expectedStatus,
        expectedUpdatedAt
    ),

    // Retrieve the updated application within the same batch
    db.prepare(`
      SELECT
          a.*,
          p.code AS program_code
      FROM jkm_applications a
      JOIN jkm_programs p ON a.program_id = p.id
      WHERE a.id = ?
    `).bind(applicationId),
  ]);

  const updateResult = results[1];

  // The application may have changed before the update
  if (updateResult.meta.changes !== 1) {
    return null;
  }

  const updatedApplication =
      results[2].results[0] as DbAdminApplication | undefined;

  if (!updatedApplication) {
    throw new Error("Failed to retrieve updated application");
  }

  return updatedApplication;
}

import { Hono } from "hono";
import { z } from "zod";
import { AppEnv } from "../types";
import { apiKeyAuth } from "../middleware/auth";
import { createApplicationSchema } from "../schemas/applicationSchema";
import {
  createApplication,
  getApplicationByExternalId,
  getApplicationById,
  getProgramByCode,
  getProgramById,
  normalizeApplicationTimestamp,
} from "../services/applicationService";
import type {
  CreateApplicationPayload,
  CreateApplicationResponse,
  ApplicationStatusResponse,
  ApplicationRecoveryResponse,
  DbApplication,
} from "../types/application";

function normalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJson);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
        Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, normalizeJson(entry)])
    );
  }

  return value;
}

function isSameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeJson(a)) === JSON.stringify(normalizeJson(b));
}

// Compare an existing application with the incoming request
function isSameApplication(
    application: DbApplication,
    programCode: string,
    data: CreateApplicationPayload
): boolean {
  return (
      programCode === data.programCode &&
      application.external_reference === data.externalApplicationId &&
      application.applicant_name === data.applicantName &&
      application.applicant_identification_no ===
      (data.applicantIdentificationNo ?? null) &&
      isSameJson(
          JSON.parse(application.application_data),
          data.applicationData
      )
  );
}

// Ensure the application has a valid reference number
function requireReferenceNo(
    application: DbApplication
): string {
  const referenceNo = application.reference_no;

  if (
      typeof referenceNo !== "string" ||
      referenceNo.trim().length === 0
  ) {
    throw new Error("Application reference number is missing");
  }

  return referenceNo;
}

// Build a consistent application submission response
function toCreateApplicationResponse(
    application: DbApplication,
    programCode: string
): CreateApplicationResponse {
  return {
    id: application.id,
    referenceNo: requireReferenceNo(application),
    programCode,
    status: application.status,
    submittedAt: normalizeApplicationTimestamp(
        application.submitted_at
    ),
  };
}

// Build a consistent application status response
function toApplicationStatusResponse(
    application: DbApplication,
    programCode: string
): ApplicationStatusResponse {
  return {
    id: application.id,
    referenceNo: requireReferenceNo(application),
    programCode,
    status: application.status,
    updatedAt: normalizeApplicationTimestamp(
        application.updated_at
    ),
  };
}

// Build an application recovery response
function toApplicationRecoveryResponse(
    application: DbApplication,
    programCode: string
): ApplicationRecoveryResponse {
  return {
    ...toCreateApplicationResponse(
        application,
        programCode
    ),
    externalApplicationId: application.external_reference,
    updatedAt: normalizeApplicationTimestamp(
        application.updated_at
    ),
  };
}

const applications = new Hono<AppEnv>();

applications.use("*", apiKeyAuth);

// Submit a new JKM application
applications.post("/", async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        400
    );
  }

  const validation = createApplicationSchema.safeParse(body);

  if (!validation.success) {
    return c.json(
        {
          success: false,
          message: "Invalid application data",
          errors: z.treeifyError(validation.error),
        },
        400
    );
  }

  const data = validation.data;
  const clientId = c.get("clientId");
  const db = c.env.jkm_mock_db;

  try {
    const existing = await getApplicationByExternalId(
        db,
        clientId,
        data.externalApplicationId
    );

    // Handle an application that has already been submitted
    if (existing) {
      const program = await getProgramById(
          db,
          existing.program_id
      );

      if (!program) {
        throw new Error("Existing application program not found");
      }

      if (
          !isSameApplication(
              existing,
              program.code,
              data
          )
      ) {
        return c.json(
            {
              success: false,
              message: "External application ID is already in use",
            },
            409
        );
      }

      return c.json(
          {
            success: true,
            message: "Application already exists",
            data: toCreateApplicationResponse(
                existing,
                program.code
            ),
          },
          200
      );
    }

    // Only active programs can accept new applications
    const program = await getProgramByCode(
        db,
        data.programCode
    );

    if (!program) {
      return c.json(
          {
            success: false,
            message: "JKM program not found or inactive",
          },
          404
      );
    }

    const application = await createApplication(
        db,
        clientId,
        data
    );

    // The service may return an application created concurrently
    const applicationProgram = await getProgramById(
        db,
        application.program_id
    );

    if (!applicationProgram) {
      throw new Error("Application program not found");
    }

    // Verify the returned application belongs to this client
    if (application.source_system !== clientId) {
      throw new Error("Application source system does not match");
    }

    // Validate the returned payload before confirming submission
    if (
        !isSameApplication(
            application,
            applicationProgram.code,
            data
        )
    ) {
      return c.json(
          {
            success: false,
            message: "External application ID is already in use",
          },
          409
      );
    }

    return c.json(
        {
          success: true,
          message: "Application submitted successfully",
          data: toCreateApplicationResponse(
              application,
              applicationProgram.code
          ),
        },
        201
    );
  } catch (error) {
    console.error("Application submission failed:", error);

    return c.json(
        {
          success: false,
          message: "Failed to submit application",
        },
        500
    );
  }
});

// Recover an application using its external application ID
applications.get("/external/:externalApplicationId", async (c) => {
  const externalApplicationId = c.req.param(
      "externalApplicationId"
  );

  const clientId = c.get("clientId");
  const db = c.env.jkm_mock_db;

  if (
      externalApplicationId.trim().length === 0 ||
      externalApplicationId.length > 100
  ) {
    return c.json(
        {
          success: false,
          message: "Invalid external application ID",
        },
        400
    );
  }

  try {
    const application = await getApplicationByExternalId(
        db,
        clientId,
        externalApplicationId
    );

    if (!application) {
      return c.json(
          {
            success: false,
            message: "Application not found",
          },
          404
      );
    }

    const program = await getProgramById(
        db,
        application.program_id
    );

    if (!program) {
      throw new Error("Application program not found");
    }

    return c.json(
        {
          success: true,
          data: toApplicationRecoveryResponse(
              application,
              program.code
          ),
        },
        200
    );
  } catch (error) {
    console.error("Application recovery failed:", error);

    return c.json(
        {
          success: false,
          message: "Failed to recover application",
        },
        500
    );
  }
});

// Retrieve an application's current processing status
applications.get("/:id/status", async (c) => {
  const applicationId = c.req.param("id");
  const clientId = c.get("clientId");
  const db = c.env.jkm_mock_db;

  try {
    const application = await getApplicationById(
        db,
        clientId,
        applicationId
    );

    if (!application) {
      return c.json(
          {
            success: false,
            message: "Application not found",
          },
          404
      );
    }

    const program = await getProgramById(
        db,
        application.program_id
    );

    if (!program) {
      throw new Error("Application program not found");
    }

    return c.json(
        {
          success: true,
          data: toApplicationStatusResponse(
              application,
              program.code
          ),
        },
        200
    );
  } catch (error) {
    console.error("Failed to retrieve application status:", error);

    return c.json(
        {
          success: false,
          message: "Failed to retrieve application status",
        },
        500
    );
  }
});

export default applications;

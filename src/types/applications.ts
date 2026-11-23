import {
  baApplicationDataSchema,
} from "../../worker/schemas/applications/baSchema";

import {
  batApplicationDataSchema,
} from "../../worker/schemas/applications/batSchema";

import {
  bptApplicationDataSchema,
} from "../../worker/schemas/applications/bptSchema";

import {
  bweApplicationDataSchema,
} from "../../worker/schemas/applications/bweSchema";

import type {
  BaApplicationData,
} from "../../worker/schemas/applications/baSchema";

import type {
  BatApplicationData,
} from "../../worker/schemas/applications/batSchema";

import type {
  BptApplicationData,
} from "../../worker/schemas/applications/bptSchema";

import type {
  BweApplicationData,
} from "../../worker/schemas/applications/bweSchema";

export type ApplicationStatus =
    | "submitted"
    | "under_review"
    | "additional_information_required"
    | "approved"
    | "rejected"
    | "cancelled";

export type ProgramCode = "BWE" | "BA" | "BAT" | "BPT";

export type Application = {
  id: string;
  program_id: string;
  program_code: ProgramCode;
  reference_no: string | null;
  external_reference: string;
  source_system: string;
  applicant_name: string;
  applicant_identification_no: string | null;
  application_data: string;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
};

export type ApplicationDetails = Application;

// Programme-specific application data
export type {
  BaApplicationData,
  BatApplicationData,
  BptApplicationData,
  BweApplicationData,
};

// Application data mapped to its corresponding programme
export type ApplicationDataByProgram = {
  BA: BaApplicationData;
  BAT: BatApplicationData;
  BPT: BptApplicationData;
  BWE: BweApplicationData;
};

// Validated application data with programme discrimination
export type ParsedApplicationData = {
  [Code in ProgramCode]: {
    programCode: Code;
    data: ApplicationDataByProgram[Code];
  };
}[ProgramCode];

// Application details navigation tabs
export type ApplicationDetailsTab =
    | "personal"
    | "residence"
    | "household"
    | "health"
    | "programme"
    | "documents"
    | "eligibility";

// Preliminary eligibility assessment status
export type PreliminaryEligibilityStatus =
    | "potentially_eligible"
    | "potentially_ineligible"
    | "insufficient_information"
    | "manual_verification";

export const allowedStatusTransitions: Record<
    ApplicationStatus,
    ApplicationStatus[]
> = {
  submitted: ["under_review", "cancelled"],
  under_review: [
    "additional_information_required",
    "approved",
    "rejected",
    "cancelled",
  ],
  additional_information_required: [
    "under_review",
    "cancelled",
  ],
  approved: [],
  rejected: [],
  cancelled: [],
};

export const applicationStatusLabels: Record<
    ApplicationStatus,
    string
> = {
  submitted: "Submitted",
  under_review: "Under Review",
  additional_information_required: "Additional Information Required",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const programLabels: Record<ProgramCode, string> = {
  BWE: "BWE",
  BA: "BA",
  BAT: "BAT",
  BPT: "BPT",
};

// Full programme names for the application details interface
export const programNames: Record<ProgramCode, string> = {
  BWE: "Bantuan Warga Emas",
  BA: "Bantuan Am",
  BAT: "Bantuan Alat Tiruan / Alat Sokongan",
  BPT: "Bantuan Penjagaan OKU Terlantar / Pesakit Kronik Terlantar / Pesakit Kronik Tidak Terlantar",
};

// Application details tab labels
export const applicationDetailsTabLabels: Record<
    ApplicationDetailsTab,
    string
> = {
  personal: "Personal",
  residence: "Residence",
  household: "Household",
  health: "Health",
  programme: "Programme",
  documents: "Documents",
  eligibility: "Eligibility",
};

// Preliminary eligibility assessment labels
export const preliminaryEligibilityStatusLabels: Record<
    PreliminaryEligibilityStatus,
    string
> = {
  potentially_eligible: "Potentially Eligible",
  potentially_ineligible: "Potentially Ineligible",
  insufficient_information: "Insufficient Information",
  manual_verification: "Manual Verification Required",
};

// Parse and validate stored application data using the
// corresponding programme application schema.
export function parseApplicationData(
    application: Application
): ParsedApplicationData | null {
  if (!application.application_data) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(
        application.application_data
    );

    switch (application.program_code) {
      case "BA": {
        const result =
            baApplicationDataSchema.safeParse(parsed);

        return result.success
            ? {
              programCode: "BA",
              data: result.data,
            }
            : null;
      }

      case "BAT": {
        const result =
            batApplicationDataSchema.safeParse(parsed);

        return result.success
            ? {
              programCode: "BAT",
              data: result.data,
            }
            : null;
      }

      case "BPT": {
        const result =
            bptApplicationDataSchema.safeParse(parsed);

        return result.success
            ? {
              programCode: "BPT",
              data: result.data,
            }
            : null;
      }

      case "BWE": {
        const result =
            bweApplicationDataSchema.safeParse(parsed);

        return result.success
            ? {
              programCode: "BWE",
              data: result.data,
            }
            : null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

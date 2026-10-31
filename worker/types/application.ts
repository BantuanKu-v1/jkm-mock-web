import type { CreateApplicationInput } from "../schemas/applicationSchema";

export type JkmApplicationStatus =
    | "submitted"
    | "under_review"
    | "additional_information_required"
    | "approved"
    | "rejected"
    | "cancelled";

export type CreateApplicationRequest = CreateApplicationInput;

export interface JkmApplication {
  id: string;
  sourceSystem: string;
  externalApplicationId: string;
  referenceNo: string;
  programCode: string;
  applicantName: string;
  applicantIdentificationNo: string | null;
  applicationData: Record<string, unknown>;
  status: JkmApplicationStatus;
  submittedAt: string;
  updatedAt: string;
}

export interface CreateApplicationResponse {
  id: string;
  referenceNo: string;
  programCode: string;
  status: JkmApplicationStatus;
  submittedAt: string;
}

export interface ApplicationStatusResponse {
  id: string;
  referenceNo: string;
  programCode: string;
  status: JkmApplicationStatus;
  updatedAt: string;
}

export interface DbApplication {
  id: string;
  program_id: string;
  external_reference: string;
  source_system: string;
  reference_no: string | null;
  applicant_name: string;
  applicant_identification_no: string | null;
  application_data: string;
  status: JkmApplicationStatus;
  submitted_at: string;
  updated_at: string;
}

export type CreateApplicationPayload = CreateApplicationRequest;
export type CreateApplicationResult = DbApplication;
export type ApplicationStatus = JkmApplicationStatus;

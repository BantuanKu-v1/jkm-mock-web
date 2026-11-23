import { z } from "zod";
import {
  commonApplicationDataSchema,
  caregiverSchema,
  healthSchema,
  nullableBoolean,
  nullableDate,
  nullableText,
} from "./commonSchema";

export const bptApplicationPathwaySchema = z.enum([
    "caregiver",
    "non_bedridden_patient",
    "bedridden_patient_without_eligible_caregiver",
]);

export const bptPatientSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(150),
  identificationNo: nullableText(12),
  citizenship: nullableText(50),
  relationshipToApplicant: nullableText(50),
  isOku: nullableBoolean,
  okuRegistered: nullableBoolean,
  hasChronicIllness: nullableBoolean,
  chronicIllnessDetails: nullableText(2000),
  isBedridden: nullableBoolean,
  requiresContinuousTreatment: nullableBoolean,
  treatmentStartDate: nullableDate,
});

export const bptMedicalConfirmationSchema = z.strictObject({
  medicalConfirmationAvailable: nullableBoolean,
  medicalInstitution: nullableText(150),
  medicalOfficerName: nullableText(150),
  diagnosisDetails: nullableText(3000),
  treatmentDetails: nullableText(3000),
  specialistDetails: nullableText(2000),
});

export const bptProgramDataSchema = z.strictObject({
  applicationPathway: bptApplicationPathwaySchema,
  patient: bptPatientSchema,
  caregiver: caregiverSchema.nullable(),
  medicalConfirmation: bptMedicalConfirmationSchema,
  reasonForSelfApplication: z
      .enum(["no_caregiver", "non_malaysian_caregiver"])
      .nullable(),
  additionalRemarks: nullableText(3000),
});

export const bptApplicationDataSchema = commonApplicationDataSchema
    .extend({
      health: healthSchema,
      programSpecificData: bptProgramDataSchema,
    })
    .superRefine((data, ctx) => {
      const programData = data.programSpecificData;
      const applicant = data.applicant;
      const pathway = programData.applicationPathway;
      const patient = programData.patient;
      const caregiver = programData.caregiver;

      // Validate the identity of the patient for self-applications
      if (
          pathway === "non_bedridden_patient" ||
          pathway === "bedridden_patient_without_eligible_caregiver"
      ) {
        if (patient.fullName !== applicant.fullName) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "fullName"],
            message: "The patient name must match the applicant name for self-applications",
          });
        }

        if (
            patient.identificationNo !== null &&
            patient.identificationNo !== applicant.identificationNo
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "identificationNo"],
            message: "The patient identification number must match the applicant identification number for self-applications",
          });
        }
      }

      // Ensure the patient and caregiver are different individuals
      if (
          caregiver !== null &&
          caregiver.identificationNo !== null &&
          patient.identificationNo !== null &&
          caregiver.identificationNo === patient.identificationNo
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["programSpecificData", "caregiver", "identificationNo"],
          message: "The patient and caregiver must not have the same identification number",
        });
      }

      if (pathway === "caregiver") {
        if (caregiver === null) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "caregiver"],
            message: "Caregiver information is required for caregiver applications",
          });
        } else {
          if (caregiver.providesIntensiveCare !== true) {
            ctx.addIssue({
              code: "custom",
              path: ["programSpecificData", "caregiver", "providesIntensiveCare"],
              message: "The caregiver must provide intensive care for this applicant pathway",
            });
          }

          if (caregiver.fullName !== applicant.fullName) {
            ctx.addIssue({
              code: "custom",
              path: ["programSpecificData", "caregiver", "fullName"],
              message: "The caregiver name must match the applicant name for caregiver applications",
            });
          }

          if (
              caregiver.identificationNo !== null &&
              caregiver.identificationNo !== applicant.identificationNo
          ) {
            ctx.addIssue({
              code: "custom",
              path: ["programSpecificData", "caregiver", "identificationNo"],
              message: "The caregiver identification number must match the applicant identification number",
            });
          }
        }

        if (
            patient.identificationNo !== null &&
            patient.identificationNo === applicant.identificationNo
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "identificationNo"],
            message: "The patient must not have the same identification number as the caregiver applicant",
          });
        }

        if (!patient.relationshipToApplicant?.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "relationshipToApplicant"],
            message: "The patient relationship to the applicant is required for caregiver applications",
          });
        }

        if (patient.isBedridden !== true) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "isBedridden"],
            message: "The patient must be bedridden for the caregiver application pathway",
          });
        }
      }

      if (pathway === "non_bedridden_patient") {
        if (patient.isBedridden !== false) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "isBedridden"],
            message: "The patient must be non-bedridden for this application pathway",
          });
        }

        if (patient.hasChronicIllness !== true) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "hasChronicIllness"],
            message: "A chronic illness must be indicated for this application pathway",
          });
        }

        if (patient.requiresContinuousTreatment !== true) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "requiresContinuousTreatment"],
            message: "Continuous treatment must be indicated for this application pathway",
          });
        }

        if (patient.treatmentStartDate === null) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "treatmentStartDate"],
            message: "The treatment start date is required for this application pathway",
          });
        }
      }

      if (pathway === "bedridden_patient_without_eligible_caregiver") {
        if (patient.isBedridden !== true) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "patient", "isBedridden"],
            message: "The patient must be bedridden for this application pathway",
          });
        }

        if (programData.reasonForSelfApplication === null) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "reasonForSelfApplication"],
            message: "A reason for self-application is required",
          });
        }

        if (
            programData.reasonForSelfApplication === "non_malaysian_caregiver" &&
            caregiver === null
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "caregiver"],
            message: "Caregiver information is required when the caregiver is not Malaysian",
          });
        }

        if (
            programData.reasonForSelfApplication === "no_caregiver" &&
            caregiver !== null
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["programSpecificData", "caregiver"],
            message: "Caregiver information must be null when the patient has no caregiver",
          });
        }
      }

      // The reason for self-application only applies to the bedridden patient without an eligible caregiver pathway
      if (
          pathway !== "bedridden_patient_without_eligible_caregiver" &&
          programData.reasonForSelfApplication !== null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["programSpecificData", "reasonForSelfApplication"],
          message: "A reason for self-application is not applicable to this application pathway",
        });
      }
    });

export type BptApplicationPathway = z.infer<typeof bptApplicationPathwaySchema>;
export type BptPatientData = z.infer<typeof bptPatientSchema>;
export type BptMedicalConfirmationData = z.infer<typeof bptMedicalConfirmationSchema>;
export type BptProgramSpecificData = z.infer<typeof bptProgramDataSchema>;
export type BptApplicationData = z.infer<typeof bptApplicationDataSchema>;

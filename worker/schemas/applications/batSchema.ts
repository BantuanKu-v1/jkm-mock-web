import { z } from "zod";
import {
  commonApplicationDataSchema,
  householdSchema,
  healthSchema,
  nullableBoolean,
  nullableMoney,
  nullableText,
} from "./commonSchema";

export const batEquipmentSchema = z.strictObject({
  equipmentType: z.string().trim().min(1).max(150),
  equipmentDescription: z.string().trim().min(1).max(3000),
  purpose: z.string().trim().min(1).max(3000),
  estimatedCost: nullableMoney,
  supplierName: nullableText(200),
  quotationAvailable: nullableBoolean,
});

export const batRecommendationSchema = z.strictObject({
  recommendationAvailable: nullableBoolean,
  recommendingAuthority: z.enum([
      "medical_officer",
      "jkm_officer",
      "other",
  ]).nullable(),
  recommendationOfficerName: nullableText(150),
  recommendationInstitution: nullableText(200),
  recommendationDetails: nullableText(3000),
});

export const batProgramDataSchema = z.strictObject({
  functionalLimitationDescription: nullableText(3000),
  equipment: batEquipmentSchema,
  recommendation: batRecommendationSchema,
  additionalJustification: nullableText(3000),
});

export const batApplicationDataSchema = commonApplicationDataSchema
    .extend({
      household: householdSchema,
      health: healthSchema,
      programSpecificData: batProgramDataSchema,
    })
    .superRefine((data, ctx) => {
      const programData = data.programSpecificData;
      const equipment = programData.equipment;
      const recommendation = programData.recommendation;

      if (
          recommendation.recommendationAvailable === true &&
          recommendation.recommendingAuthority === null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["programSpecificData", "recommendation", "recommendingAuthority"],
          message: "The recommending authority is required when a recommendation is availble",
        });
      }

      if (
          recommendation.recommendingAuthority === "other" &&
          !recommendation.recommendationDetails?.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["programSpecificData", "recommendation", "recommendationDetails"],
          message: "Recommendation details are required for other recommending authorities",
        });
      }

      if (
          equipment.estimatedCost !== null &&
          equipment.estimatedCost > 20000 &&
          !programData.additionalJustification?.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["programSpecificData", "additionalJustification"],
          message: "Additional justification is required for equipment exceeding RM20,000",
        });
      }
    });

export type BatEquipmentData = z.infer<typeof batEquipmentSchema>;
export type BatRecommendationData = z.infer<typeof batRecommendationSchema>;
export type BatProgramSpecificData = z.infer<typeof batProgramDataSchema>;
export type BatApplicationData = z.infer<typeof batApplicationDataSchema>;

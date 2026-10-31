import { z } from "zod";
import {
  commonApplicationDataSchema,
  householdSchema,
  livingArrangementSchema,
  nullableBoolean,
  nullableMoney,
  nullableText,
} from "./commonSchema";

export const bweProgramDataSchema = z.strictObject({
  hasChildren: nullableBoolean, // Identifies applicants without children for BWE-002
  dependsOnFamilyOrCaregiver: nullableBoolean, // Identifies dependency on family or caregivers
  familyOrCaregiverMonthlyIncome: nullableMoney, // Captures relevant family/caregiver income
  incomeDeclarationDetails: nullableText(3000), // Additional income declaration information
  specialConsiderationRequested: z.boolean(), // Whether special consideration is requested
  specialConsiderationReason: nullableText(3000), // Required when special consideration is requested
});

export const bweApplicationDataSchema = commonApplicationDataSchema
    .extend({
      household: householdSchema,
      livingArrangement: livingArrangementSchema,
      programSpecificData: bweProgramDataSchema,
    })
    .superRefine((data, ctx) => {
      if (
          data.programSpecificData.specialConsiderationRequested &&
          !data.programSpecificData.specialConsiderationReason?.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["programSpecificData", "specialConsiderationReason"],
          message: "A reason is required when special consideration is requested",
        });
      }
    });

export type BweProgramSpecificData = z.infer<typeof bweProgramDataSchema>;
export type BweApplicationData = z.infer<typeof bweApplicationDataSchema>;

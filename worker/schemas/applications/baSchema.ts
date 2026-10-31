import { z } from "zod";
import {
  commonApplicationDataSchema,
  householdSchema,
  nullableBoolean,
  nullableText,
  welfareAssistanceSchema,
} from "./commonSchema";

export const baAdditionalCircumstancesSchema = z.strictObject({
  economicHardship: nullableBoolean, // Records economic circumstances
  healthRelatedNeeds: nullableBoolean, // Records health-related financial needs
  dependentRelatedNeeds: nullableBoolean, // Records dependent-related circumstances
  otherCircumstances: nullableBoolean, // Indicates other relevant circumstances
  description: nullableText(3000), // Provides additional explanation
});

export const baProgramDataSchema = z.strictObject({
  receivesOtherJkmMonthlyAssistance: nullableBoolean, // Identifies existing JKM monthly assistance
  currentJkmAssistanceProgram: nullableText(200), // Names the existing JKM assistance program
  additionalCircumstances: baAdditionalCircumstancesSchema,
});

export const baApplicationDataSchema = commonApplicationDataSchema
  .extend({
    household: householdSchema,
    welfareAssistance: z.array(welfareAssistanceSchema).max(100),
    programSpecificData: baProgramDataSchema,
  })
  .superRefine((data, ctx) => {
    const programData = data.programSpecificData;
    const circumstances = programData.additionalCircumstances;

    if (
        programData.receivesOtherJkmMonthlyAssistance === true &&
        !programData.currentJkmAssistanceProgram?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["programSpecificData", "currentJkmAssistanceProgram"],
        message: "The current JKM assistance program is required when receiving other JKM monthly assistance",
      });
    }

    if (
        circumstances.otherCircumstances === true &&
        !circumstances.description?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["programSpecificData", "additionalCircumstances", "description"],
        message: "A description is required when other circumstances are indicated",
      });
    }
  });

export type BaAdditionalCircumstance = z.infer<typeof baAdditionalCircumstancesSchema>;
export type BaProgramSpecificData = z.infer<typeof baProgramDataSchema>;
export type BaApplicationData = z.infer<typeof baApplicationDataSchema>;

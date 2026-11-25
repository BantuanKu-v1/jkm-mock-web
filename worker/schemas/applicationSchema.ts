import { z } from "zod";
import { bweApplicationDataSchema } from "./applications/bweSchema";
import { baApplicationDataSchema } from "./applications/baSchema";
import { batApplicationDataSchema } from "./applications/batSchema";
import { bptApplicationDataSchema } from "./applications/bptSchema";

const baseApplicationSchema = z.strictObject({
  externalApplicationId: z.string().trim().min(1).max(100),
  applicantName: z.string().trim().min(1).max(150),
  applicantIdentificationNo: z.string().trim().min(1).max(12).optional(),
});

export const createApplicationSchema = z.discriminatedUnion("programCode", [
  baseApplicationSchema.extend({
    programCode: z.literal("BWE"),
    applicationData: bweApplicationDataSchema,
  }),
  baseApplicationSchema.extend({
    programCode: z.literal("BA"),
    applicationData: baApplicationDataSchema,
  }),
  baseApplicationSchema.extend({
    programCode: z.literal("BAT"),
    applicationData: batApplicationDataSchema,
  }),
  baseApplicationSchema.extend({
    programCode: z.literal("BPT"),
    applicationData: bptApplicationDataSchema,
  }),
]).superRefine((data, ctx) => {
  const applicant = data.applicationData.applicant;

  if (data.applicantName !== applicant.fullName) {
    ctx.addIssue({
      code: "custom",
      path: ["applicantName"],
      message: "The applicant name must match the name in the application data",
    });
  }

  if (
      data.applicantIdentificationNo !== undefined &&
      data.applicantIdentificationNo !== applicant.identificationNo
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["applicantIdentificationNo"],
      message: "The applicant identification number must match the identification number in the application data",
    });
  }
});

export const updateApplicationStatusSchema = z.strictObject({
  status: z.enum([
      "submitted",
      "under_review",
      "additional_information_required",
      "approved",
      "rejected",
      "cancelled",
  ]),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

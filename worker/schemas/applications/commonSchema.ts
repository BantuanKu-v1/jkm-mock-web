import { z } from "zod";

export const nullableText = (maxLength: number) => z.string().trim().max(maxLength).nullable();
export const nullableBoolean = z.boolean().nullable();
export const nullableMoney = z.number().nonnegative().nullable();
export const nullableInteger = z.number().int().nonnegative().nullable();
export const dateSchema = z.iso.date();
export const nullableDate = dateSchema.nullable();

export const applicantSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(150),
  identificationNo: z.string().trim().min(1).max(12),
  dateOfBirth: dateSchema,
  gender: nullableText(30),
  citizenship: z.string().trim().min(1).max(50),
  maritalStatus: nullableText(50),
});

export const contactSchema = z.strictObject({
  mobilePhone: nullableText(30),
  homePhone: nullableText(30),
  email: z.email().nullable(),
});

export const addressSchema = z.strictObject({
  addressLine1: z.string().trim().min(1).max(255),
  addressLine2: nullableText(255),
  postcode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(100),
  stateTerritory: z.string().trim().min(1).max(100),
  countryCode: z.string().trim().min(2).max(20),
});

export const employmentSchema = z.strictObject({
  occupation: nullableText(150),
  employmentStatus: nullableText(50),
  isStudent: nullableBoolean,
  studyMode: nullableText(50),
  institutionType: nullableText(100),
});

export const financialSchema = z.strictObject({
  monthlyPersonalIncome: nullableMoney,
  monthlyHouseholdIncome: nullableMoney,
  incomeSource: nullableText(100),
});

export const householdMemberSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(150),
  identificationNo: nullableText(12),
  relationship: z.string().trim().min(1).max(50),
  dateOfBirth: nullableDate,
  gender: nullableText(30),
  citizenship: nullableText(50),
  isDependent: nullableBoolean,
  employmentStatus: nullableText(50),
  occupation: nullableText(50),
  monthlyIncome: nullableMoney,
  isStudent: nullableBoolean,
  studyMode: nullableText(50),
  institutionType: nullableText(100),
  isOku: nullableBoolean,
  okuRegistered: nullableBoolean,
});

export const householdSchema = z.strictObject({
  members: z.array(householdMemberSchema).max(100),
});

export const healthSchema = z.strictObject({
  isOku: nullableBoolean,
  okuRegistered: nullableBoolean,
  disabilityDescription: nullableText(2000),
  hasChronicIllness: nullableBoolean,
  chronicIllnessDetails: nullableText(2000),
  isBedridden: nullableBoolean,
  requiresContinuousTreatment: nullableBoolean,
  treatmentStartDate: nullableDate,
});

export const livingArrangementSchema = z.strictObject({
  arrangementType: nullableText(100),
  livesWithFamily: nullableBoolean,
  dependsOnFamily: nullableBoolean,
  dependsOnCaregiver: nullableBoolean,
  isInInstitution: nullableBoolean,
  institutionName: nullableText(200),
  institutionType: nullableText(100),
  receivesFreeServices: nullableBoolean,
  receivesRationGrant: nullableBoolean,
});

export const caregiverSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(150),
  identificationNo: nullableText(12),
  citizenship: nullableText(50),
  relationship: nullableText(50),
  providesIntensiveCare: nullableBoolean,
  eligiblePersonsCaredFor: nullableInteger,
});

export const welfareAssistanceSchema = z.strictObject({
  programName: z.string().trim().min(1).max(200),
  agency: nullableText(150),
  assistanceType: nullableText(100),
  monthlyAmount: nullableMoney,
  isActive: nullableBoolean,
  startDate: nullableDate,
  endDate: nullableDate,
});

export const supportingDocumentSchema = z.strictObject({
  documentId: z.uuid(),
  requirementType: z.string().trim().min(1).max(100),
  documentType: z.string().trim().min(1).max(100),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  fileSizeBytes: nullableInteger,
  issuedAt: nullableDate,
  expiresAt: nullableDate,
});

export const preliminaryEligibilityStatusSchema = z.enum([
    "potentially_eligible",
    "potentially_ineligible",
    "insufficient_information",
    "manual_verification",
]);

export const preliminaryEligibilitySchema = z.strictObject({
  status: preliminaryEligibilityStatusSchema,
  criteriaVersion: z.number().int().positive(),
  assessedAt: z.iso.datetime(),
});

export const commonApplicationDataSchema = z.strictObject({
  schemaVersion: z.literal(1),
  applicant: applicantSchema,
  contact: contactSchema,
  address: addressSchema,
  financial: financialSchema,
  household: householdSchema.optional(),
  employment: employmentSchema.optional(),
  health: healthSchema.optional(),
  livingArrangement: livingArrangementSchema.optional(),
  caregivers: z.array(caregiverSchema).max(100).optional(),
  welfareAssistance: z.array(welfareAssistanceSchema).max(100).optional(),
  supportingDocuments: z.array(supportingDocumentSchema).max(100).optional(),
  preliminaryEligibility: preliminaryEligibilitySchema.optional(),
});

export type CommonApplicationData = z.infer<typeof commonApplicationDataSchema>;
export type ApplicantData = z.infer<typeof applicantSchema>;
export type ContactData = z.infer<typeof contactSchema>;
export type AddressData = z.infer<typeof addressSchema>;
export type EmploymentData = z.infer<typeof employmentSchema>;
export type FinancialData = z.infer<typeof financialSchema>;
export type HouseholdData = z.infer<typeof householdSchema>;
export type HouseholdMemberData = z.infer<typeof householdMemberSchema>;
export type HealthData = z.infer<typeof healthSchema>;
export type LivingArrangementData = z.infer<typeof livingArrangementSchema>;
export type CaregiverData = z.infer<typeof caregiverSchema>;
export type WelfareAssistanceData = z.infer<typeof welfareAssistanceSchema>;
export type SupportingDocumentData = z.infer<typeof supportingDocumentSchema>;
export type PreliminaryEligibilityData = z.infer<typeof preliminaryEligibilitySchema>;

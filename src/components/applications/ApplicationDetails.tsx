import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type {
  Application,
  ApplicationDetailsTab,
  ParsedApplicationData,
} from "../../types/applications";

import {
  allowedStatusTransitions,
  applicationStatusLabels,
  applicationDetailsTabLabels,
  preliminaryEligibilityStatusLabels,
  programNames,
  parseApplicationData,
} from "../../types/applications";

type ApplicationDetailsProps = {
  application: Application;
  onBack: () => void;
  onUpdateStatus: (application: Application) => void;
};

type SectionCardProps = {
  title: string;
  description: string;
  count?: string;
  children: ReactNode;
};

type RecordListProps = {
  records: Record<string, unknown>[] | undefined;
  titleKey: string;
  subtitleKey?: string;
  recordLabel: string;
  emptyMessage: string;
};

const monetaryFields = new Set([
  "monthlyPersonalIncome",
  "monthlyHouseholdIncome",
  "monthlyIncome",
  "monthlyAmount",
  "estimatedCost",
  "familyOrCaregiverMonthlyIncome",
]);

const dateFields = new Set([
  "dateOfBirth",
  "treatmentStartDate",
  "startDate",
  "endDate",
  "issuedAt",
  "expiresAt",
]);

const dateTimeFields = new Set([
  "assessedAt",
  "submittedAt",
  "updatedAt",
]);

const enumFields = new Set([
  "status",
  "gender",
  "maritalStatus",
  "employmentStatus",
  "studyMode",
  "institutionType",
  "incomeSource",
  "relationship",
  "relationshipToApplicant",
  "arrangementType",
  "assistanceType",
  "applicationPathway",
  "reasonForSelfApplication",
  "recommendingAuthority",
  "type",
  "requirementType",
  "documentType",
]);

const fieldLabels: Record<string, string> = {
  // Personal information
  fullName: "Full Name",
  identificationNo: "Identification Number",
  dateOfBirth: "Date of Birth",
  maritalStatus: "Marital Status",

  // Contact information
  mobilePhone: "Mobile Phone",
  homePhone: "Home Phone",
  email: "Email Address",

  // Address
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  stateTerritory: "State / Territory",
  countryCode: "Country Code",

  // Employment and education
  employmentStatus: "Employment Status",
  isStudent: "Student",
  studyMode: "Study Mode",
  institutionType: "Institution Type",

  // Financial information
  monthlyPersonalIncome: "Monthly Personal Income",
  monthlyHouseholdIncome: "Monthly Household Income",
  monthlyIncome: "Monthly Income",
  incomeSource: "Income Source",
  monthlyAmount: "Monthly Assistance Amount",
  familyOrCaregiverMonthlyIncome:
      "Family / Caregiver Monthly Income",

  // Household information
  isDependent: "Dependent",
  relationshipToApplicant: "Relationship to Applicant",

  // Health information
  isOku: "Person with Disabilities (OKU)",
  okuRegistered: "Registered OKU",
  disabilityDescription: "Disability Description",
  hasChronicIllness: "Has Chronic Illness",
  chronicIllnessDetails: "Chronic Illness Details",
  isBedridden: "Bedridden",
  requiresContinuousTreatment:
      "Requires Continuous Treatment",
  treatmentStartDate: "Treatment Start Date",

  // Living arrangements
  arrangementType: "Living Arrangement",
  livesWithFamily: "Lives with Family",
  dependsOnFamily: "Depends on Family",
  dependsOnCaregiver: "Depends on Caregiver",
  isInInstitution: "Resides in an Institution",
  institutionName: "Institution Name",
  receivesFreeServices: "Receives Free Services",
  receivesRationGrant: "Receives Ration Grant",

  // Caregiver information
  providesIntensiveCare: "Provides Intensive Care",
  eligiblePersonsCaredFor:
      "Number of Eligible Persons Cared For",

  // Welfare assistance
  programName: "Assistance Programme",
  agency: "Responsible Agency",
  assistanceType: "Assistance Type",
  isActive: "Currently Active",
  startDate: "Start Date",
  endDate: "End Date",

  // BA
  receivesOtherJkmMonthlyAssistance:
      "Receives Other JKM Monthly Assistance",
  currentJkmAssistanceProgram:
      "Current JKM Assistance Programme",
  economicHardship: "Economic Hardship",
  healthRelatedNeeds: "Health-related Needs",
  dependentRelatedNeeds: "Dependent-related Needs",
  otherCircumstances: "Other Circumstances",
  description: "Description",

  // BAT
  type: "Beneficiary Type",
  functionalLimitationDescription:
      "Functional Limitation Description",
  equipmentType: "Equipment Type",
  equipmentDescription: "Equipment Description",
  purpose: "Purpose of Equipment",
  estimatedCost: "Estimated Equipment Cost",
  supplierName: "Supplier Name",
  quotationAvailable: "Quotation Available",
  recommendationAvailable: "Recommendation Available",
  recommendingAuthority: "Recommending Authority",
  recommendationOfficerName: "Recommending Officer",
  recommendationInstitution: "Recommending Institution",
  recommendationDetails: "Recommendation Details",
  additionalJustification: "Additional Justification",

  // BPT
  applicationPathway: "Application Pathway",
  medicalConfirmationAvailable:
      "Medical Confirmation Available",
  medicalInstitution: "Medical Institution",
  medicalOfficerName: "Medical Officer Name",
  diagnosisDetails: "Diagnosis Details",
  treatmentDetails: "Treatment Details",
  specialistDetails: "Specialist Details",
  reasonForSelfApplication: "Reason for Self-application",
  additionalRemarks: "Additional Remarks",

  // BWE
  hasChildren: "Has Children",
  dependsOnFamilyOrCaregiver:
      "Depends on Family or Caregiver",
  incomeDeclarationDetails: "Income Declaration Details",
  specialConsiderationRequested:
      "Special Consideration Requested",
  specialConsiderationReason:
      "Reason for Special Consideration",

  // Supporting documents
  documentId: "Document ID",
  requirementType: "Requirement Type",
  documentType: "Document Type",
  originalFilename: "Original Filename",
  mimeType: "File Type",
  fileSizeBytes: "File Size",
  issuedAt: "Issue Date",
  expiresAt: "Expiry Date",

  // Preliminary eligibility
  criteriaVersion: "Criteria Version",
  assessedAt: "Assessment Date",
};

const enumValueLabels: Record<string, string> = {
  applicant: "Applicant",
  dependent: "Dependent",

  caregiver: "Caregiver",
  non_bedridden_patient: "Non-bedridden Patient",
  bedridden_patient_without_eligible_caregiver:
      "Bedridden Patient without an Eligible Caregiver",

  no_caregiver: "No Caregiver Available",
  non_malaysian_caregiver: "Non-Malaysian Caregiver",

  medical_officer: "Medical Officer",
  jkm_officer: "JKM Officer",

  private_residence: "Private Residence",
  full_time: "Full-time",
  part_time: "Part-time",
  self_employed: "Self-employed",
};

function formatStatus(status: string): string {
  return status
      .split("_")
      .map(
          (word) =>
              word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
}

function formatDate(
    dateString: string,
    includeTime = false
): string {
  if (!dateString) return "Not provided";

  const normalizedDate =
      /^\d{4}-\d{2}-\d{2}$/.test(dateString)
          ? `${dateString}T00:00:00Z`
          : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(
              dateString
          )
              ? dateString.replace(" ", "T") + "Z"
              : dateString;

  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  if (includeTime) {
    return date.toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(key: string): string {
  return (
      fieldLabels[key] ??
      key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (character) =>
              character.toUpperCase()
          )
  );
}

function isMissingValue(value: unknown): boolean {
  return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
  );
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Not provided";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatValue(key: string, value: unknown): string {
  if (isMissingValue(value)) {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    if (monetaryFields.has(key)) {
      return `RM ${value.toLocaleString("en-MY", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (key === "fileSizeBytes") {
      return formatFileSize(value);
    }

    return value.toLocaleString("en-MY");
  }

  if (typeof value === "string") {
    if (dateFields.has(key)) {
      return formatDate(value);
    }

    if (dateTimeFields.has(key)) {
      return formatDate(value, true);
    }

    if (enumFields.has(key)) {
      return (
          enumValueLabels[value] ??
          formatStatus(value)
      );
    }

    return value;
  }

  return "Not provided";
}

function EmptyState({
                      title,
                      message,
                    }: {
  title?: string;
  message: string;
}) {
  return (
      <div className="application-details__empty-state">
        {title && <h3>{title}</h3>}

        <p>{message}</p>
      </div>
  );
}

function SectionCard({
  title,
  description,
  count,
  children
}: SectionCardProps) {
  return (
      <div className="application-details__section-card">
        <div className="application-details__section-heading">
          <div>
            <h3>{title}</h3>

            <p>{description}</p>
          </div>

          {count !== undefined && (
              <span className="application-details__count">
                        {count}
                    </span>
          )}
        </div>

        {children}
      </div>
  );
}

function renderFields(
    data: Record<string, unknown> | null | undefined
): ReactNode {
  if (!data || Object.keys(data).length === 0) {
    return (
        <EmptyState
            message="No information was provided."
        />
    );
  }

  return (
      <div className="application-details__grid">
        {Object.entries(data).map(([key, value]) => {
          const isMissing = isMissingValue(value);
          const isBoolean = typeof value === "boolean";
          const isMonetary = monetaryFields.has(key);

          return (
              <div
                  key={key}
                  className={`application-details__field-card ${
                      isMonetary && !isMissing
                          ? "application-details__field-card--income"
                          : ""
                  }`}
              >
                        <span className="application-details__field-label">
                            {formatLabel(key)}
                        </span>

                {isBoolean ? (
                    <span
                        className={`application-details__value-badge ${
                            value
                                ? "application-details__value-badge--yes"
                                : "application-details__value-badge--no"
                        }`}
                    >
                                {formatValue(key, value)}
                            </span>
                ) : (
                    <strong
                        className={`application-details__field-value ${
                            isMissing
                                ? "application-details__field-value--missing"
                                : ""
                        }`}
                    >
                      {formatValue(key, value)}
                    </strong>
                )}
              </div>
          );
        })}
      </div>
  );
}

function RecordList({
  records,
  titleKey,
  subtitleKey,
  recordLabel,
  emptyMessage
}: RecordListProps) {
  if (!records) {
    return (
        <EmptyState
            message="This information was not submitted."
        />
    );
  }

  if (records.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
      <div className="application-details__records">
        {records.map((record, index) => {
          const title = record[titleKey];

          const subtitle = subtitleKey
              ? record[subtitleKey]
              : undefined;

          return (
              <div
                  key={index}
                  className="application-details__record"
              >
                <div className="application-details__record-heading">
                  <div className="application-details__record-avatar">
                    {index + 1}
                  </div>

                  <div>
                    <h4>
                      {isMissingValue(title)
                          ? `${recordLabel} ${index + 1}`
                          : formatValue(titleKey, title)}
                    </h4>

                    {subtitleKey && (
                        <p>
                          {formatValue(
                              subtitleKey,
                              subtitle
                          )}
                        </p>
                    )}
                  </div>
                </div>

                {renderFields(record)}
              </div>
          );
        })}
      </div>
  );
}

// Personal information shared by all JKM programs
function PersonalTab({
    applicationData
}: {
  applicationData: ParsedApplicationData;
}) {
  const { data } = applicationData;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Personal Information"
            description="Applicant identity and demographic details."
        >
          {renderFields(data.applicant)}
        </SectionCard>

        <SectionCard
            title="Contact Information"
            description="Contact details provided by the applicant."
        >
          {renderFields(data.contact)}
        </SectionCard>

        <SectionCard
            title="Employment Information"
            description="Employment and education-related details."
        >
          {renderFields(data.employment)}
        </SectionCard>
      </div>
  );
}

// Residential address and living arrangements
function ResidenceTab({
    applicationData
}: {
  applicationData: ParsedApplicationData;
}) {
  const { data } = applicationData;

  const fullAddress = [
    data.address.addressLine1,
    data.address.addressLine2,
    data.address.postcode,
    data.address.city,
    data.address.stateTerritory,
    data.address.countryCode,
  ]
      .filter(Boolean)
      .join(", ");

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Registered Address"
            description="Residential address submitted with this application."
        >
          <div className="application-details__address">
            <span>Full Address</span>

            <strong>
              {fullAddress || "Not provided"}
            </strong>
          </div>

          {renderFields(data.address)}
        </SectionCard>

        <SectionCard
            title="Living Arrangements"
            description="Residential circumstances and living support information."
        >
          {renderFields(data.livingArrangement)}
        </SectionCard>
      </div>
  );
}

// Financial, household and welfare assistance information
function HouseholdTab({
    applicationData
}: {
  applicationData: ParsedApplicationData;
}) {
  const { data } = applicationData;

  const householdMembers = data.household?.members;
  const caregivers = data.caregivers;
  const welfareAssistance = data.welfareAssistance;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Financial Information"
            description="Declared personal and household financial information."
        >
          {renderFields(data.financial)}
        </SectionCard>

        <SectionCard
            title="Household Members"
            description="Individuals recorded in the applicant's household."
            count={
              householdMembers
                  ? `${householdMembers.length} Members`
                  : undefined
            }
        >
          <RecordList
              records={householdMembers}
              titleKey="fullName"
              subtitleKey="relationship"
              recordLabel="Household Member"
              emptyMessage="No household members recorded."
          />
        </SectionCard>

        <SectionCard
            title="Caregiver Information"
            description="Caregivers recorded in the submitted application."
            count={
              caregivers
                  ? `${caregivers.length} Caregivers`
                  : undefined
            }
        >
          <RecordList
              records={caregivers}
              titleKey="fullName"
              subtitleKey="relationship"
              recordLabel="Caregiver"
              emptyMessage="No caregivers recorded."
          />
        </SectionCard>

        <SectionCard
            title="Existing Welfare Assistance"
            description="Other welfare assistance declared by the applicant."
            count={
              welfareAssistance
                  ? `${welfareAssistance.length} Records`
                  : undefined
            }
        >
          <RecordList
              records={welfareAssistance}
              titleKey="programName"
              subtitleKey="agency"
              recordLabel="Welfare Assistance"
              emptyMessage="No existing welfare assistance recorded."
          />
        </SectionCard>
      </div>
  );
}

// Applicant health information, separate from the program-specific beneficiary or patient information
function HealthTab({
    applicationData
}: {
  applicationData: ParsedApplicationData;
}) {
  const { data } = applicationData;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Applicant Health Information"
            description="Disability, chronic illness and treatment information relating to the applicant."
        >
          {renderFields(data.health)}
        </SectionCard>
      </div>
  );
}

// BA program-specific information
function BaProgrammeTab({
    applicationData
}: {
  applicationData: Extract<
      ParsedApplicationData,
      { programCode: "BA" }
  >;
}) {
  const programmeData =
      applicationData.data.programSpecificData;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Existing JKM Assistance"
            description="Information about other monthly assistance received from JKM."
        >
          {renderFields({
            receivesOtherJkmMonthlyAssistance:
            programmeData.receivesOtherJkmMonthlyAssistance,

            currentJkmAssistanceProgram:
            programmeData.currentJkmAssistanceProgram,
          })}
        </SectionCard>

        <SectionCard
            title="Additional Circumstances"
            description="Financial hardship, health-related needs and other circumstances supporting the application."
        >
          {renderFields(
              programmeData.additionalCircumstances
          )}
        </SectionCard>
      </div>
  );
}

// BAT program-specific information
function BatProgrammeTab({
    applicationData
}: {
  applicationData: Extract<
      ParsedApplicationData,
      { programCode: "BAT" }
  >;
}) {
  const programmeData =
      applicationData.data.programSpecificData;

  const { beneficiary } = programmeData;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Beneficiary Information"
            description="Details of the individual requiring assistive equipment."
        >
          {renderFields({
            type: beneficiary.type,
            fullName: beneficiary.fullName,
            identificationNo:
            beneficiary.identificationNo,
            relationshipToApplicant:
            beneficiary.relationshipToApplicant,
          })}
        </SectionCard>

        <SectionCard
            title="Beneficiary Health Information"
            description="Health and disability information relating specifically to the equipment beneficiary."
        >
          {renderFields(beneficiary.health)}
        </SectionCard>

        <SectionCard
            title="Functional Limitations"
            description="Functional difficulties supporting the request for assistive equipment."
        >
          {renderFields({
            functionalLimitationDescription:
            programmeData.functionalLimitationDescription,
          })}
        </SectionCard>

        <SectionCard
            title="Equipment Information"
            description="Requested equipment, purpose, estimated cost and supplier information."
        >
          {renderFields(programmeData.equipment)}
        </SectionCard>

        <SectionCard
            title="Professional Recommendation"
            description="Recommendation information provided by a medical officer, JKM officer or other authority."
        >
          {renderFields(programmeData.recommendation)}
        </SectionCard>

        <SectionCard
            title="Additional Justification"
            description="Additional information supporting the equipment assistance request."
        >
          {renderFields({
            additionalJustification:
            programmeData.additionalJustification,
          })}
        </SectionCard>
      </div>
  );
}

// BPT program-specific information
function BptProgrammeTab({
    applicationData
}: {
  applicationData: Extract<
      ParsedApplicationData,
      { programCode: "BPT" }
  >;
}) {
  const programmeData =
      applicationData.data.programSpecificData;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Application Pathway"
            description="The application category and circumstances under which assistance is requested."
        >
          {renderFields({
            applicationPathway:
            programmeData.applicationPathway,
          })}
        </SectionCard>

        <SectionCard
            title="Patient Information"
            description="Identity, health condition and treatment information relating to the patient."
        >
          {renderFields(programmeData.patient)}
        </SectionCard>

        <SectionCard
            title="Caregiver Information"
            description="Information about the caregiver associated with this BPT application."
        >
          {programmeData.caregiver ? (
              renderFields(programmeData.caregiver)
          ) : (
              <EmptyState
                  message="No programme-specific caregiver was provided."
              />
          )}
        </SectionCard>

        <SectionCard
            title="Medical Confirmation"
            description="Medical confirmation, diagnosis and treatment information submitted for officer review."
        >
          {renderFields(
              programmeData.medicalConfirmation
          )}
        </SectionCard>

        {programmeData.applicationPathway ===
            "bedridden_patient_without_eligible_caregiver" && (
                <SectionCard
                    title="Self-application Information"
                    description="Circumstances supporting an application submitted by a bedridden patient without an eligible caregiver."
                >
                  {renderFields({
                    reasonForSelfApplication:
                    programmeData.reasonForSelfApplication,
                  })}
                </SectionCard>
            )}

        <SectionCard
            title="Additional Remarks"
            description="Other information supporting the BPT application."
        >
          {renderFields({
            additionalRemarks:
            programmeData.additionalRemarks,
          })}
        </SectionCard>
      </div>
  );
}

// BWE program-specific information
function BweProgrammeTab({
    applicationData
}: {
  applicationData: Extract<
      ParsedApplicationData,
      { programCode: "BWE" }
  >;
}) {
  const programmeData =
      applicationData.data.programSpecificData;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Family and Caregiver Support"
            description="Information about family members and financial support received by the applicant."
        >
          {renderFields({
            hasChildren: programmeData.hasChildren,

            dependsOnFamilyOrCaregiver:
            programmeData.dependsOnFamilyOrCaregiver,

            familyOrCaregiverMonthlyIncome:
            programmeData.familyOrCaregiverMonthlyIncome,
          })}
        </SectionCard>

        <SectionCard
            title="Income Declaration"
            description="Additional information concerning the applicant's financial circumstances."
        >
          {renderFields({
            incomeDeclarationDetails:
            programmeData.incomeDeclarationDetails,
          })}
        </SectionCard>

        <SectionCard
            title="Special Consideration"
            description="Requests for additional consideration based on the applicant's circumstances."
        >
          {renderFields({
            specialConsiderationRequested:
            programmeData.specialConsiderationRequested,

            specialConsiderationReason:
            programmeData.specialConsiderationReason,
          })}
        </SectionCard>
      </div>
  );
}

// Select the appropriate programme-specific component
function ProgrammeTab({
    applicationData
}: {
  applicationData: ParsedApplicationData;
}) {
  switch (applicationData.programCode) {
    case "BA":
      return (
          <BaProgrammeTab
              applicationData={applicationData}
          />
      );

    case "BAT":
      return (
          <BatProgrammeTab
              applicationData={applicationData}
          />
      );

    case "BPT":
      return (
          <BptProgrammeTab
              applicationData={applicationData}
          />
      );

    case "BWE":
      return (
          <BweProgrammeTab
              applicationData={applicationData}
          />
      );

    default:
      return (
          <EmptyState
              title="Programme Information Unavailable"
              message="The application programme is not supported."
          />
      );
  }
}

// Supporting document metadata
function DocumentsTab({
    applicationData
}: {
  applicationData: ParsedApplicationData;
}) {
  const documents =
      applicationData.data.supportingDocuments;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Supporting Documents"
            description="Supporting document information submitted with the application."
            count={
              documents
                  ? `${documents.length} Documents`
                  : undefined
            }
        >
          <p className="application-details__notice">
            Only supporting document metadata is
            available in the JKM Mock System.
            Original document files are not stored
            in this system.
          </p>

          <RecordList
              records={documents}
              titleKey="originalFilename"
              subtitleKey="documentType"
              recordLabel="Supporting Document"
              emptyMessage="No supporting documents recorded."
          />
        </SectionCard>
      </div>
  );
}

// Preliminary eligibility assessment from BantuanKu
function EligibilityTab({
    applicationData
}: {
  applicationData: ParsedApplicationData;
}) {
  const assessment =
      applicationData.data.preliminaryEligibility;

  return (
      <div className="application-details__sections">
        <SectionCard
            title="Preliminary Eligibility Assessment"
            description="Screening information submitted by BantuanKu."
        >
          {assessment ? (
              <>
                <div
                    className={`application-details__eligibility-result application-details__eligibility-result--${assessment.status}`}
                >
                            <span>
                                Preliminary Assessment Result
                            </span>

                  <strong>
                    {
                      preliminaryEligibilityStatusLabels[
                          assessment.status
                          ]
                    }
                  </strong>

                  <p>
                    This result is provided for
                    officer review and is not a
                    final JKM approval decision.
                  </p>
                </div>

                <p className="application-details__notice">
                  The preliminary eligibility
                  assessment is separate from the
                  official JKM application
                  processing status.
                </p>

                {renderFields({
                  criteriaVersion:
                  assessment.criteriaVersion,

                  assessedAt:
                  assessment.assessedAt,
                })}
              </>
          ) : (
              <EmptyState
                  title="No Assessment Available"
                  message="No preliminary eligibility assessment was submitted with this application."
              />
          )}
        </SectionCard>
      </div>
  );
}

export default function ApplicationDetails({
  application,
  onBack,
  onUpdateStatus
}: ApplicationDetailsProps) {
  const [activeTab, setActiveTab] =
      useState<ApplicationDetailsTab>("personal");

  const applicationData = useMemo(
      () => parseApplicationData(application),
      [application]
  );

  const canUpdateStatus =
      allowedStatusTransitions[application.status].length > 0;

  const showHealthTab =
      application.program_code === "BAT" ||
      application.program_code === "BPT" ||
      Boolean(applicationData?.data.health);

  const tabs: ApplicationDetailsTab[] = [
    "personal",
    "residence",
    "household",
    ...(showHealthTab
        ? (["health"] as const)
        : []),
    "programme",
    "documents",
    "eligibility",
  ];

  const selectedTab = tabs.includes(activeTab)
      ? activeTab
      : "personal";

  const renderActiveTab = () => {
    if (!applicationData) {
      return (
          <EmptyState
              title="Application Information Unavailable"
              message="The submitted application data is unavailable or does not match the supported JKM application schema."
          />
      );
    }

    switch (selectedTab) {
      case "personal":
        return (
            <PersonalTab
                applicationData={applicationData}
            />
        );

      case "residence":
        return (
            <ResidenceTab
                applicationData={applicationData}
            />
        );

      case "household":
        return (
            <HouseholdTab
                applicationData={applicationData}
            />
        );

      case "health":
        return (
            <HealthTab
                applicationData={applicationData}
            />
        );

      case "programme":
        return (
            <ProgrammeTab
                applicationData={applicationData}
            />
        );

      case "documents":
        return (
            <DocumentsTab
                applicationData={applicationData}
            />
        );

      case "eligibility":
        return (
            <EligibilityTab
                applicationData={applicationData}
            />
        );

      default:
        return null;
    }
  };

  return (
      <div className="application-details">
        <div className="application-details__header">
          <div>
            <h2>Application Details</h2>

            <p className="application-details__reference">
              {application.reference_no || "-"}
            </p>
          </div>

          <span
              className={`application-details__status application-details__status--${application.status}`}
          >
                    {
                      applicationStatusLabels[
                          application.status
                          ]
                    }
                </span>
        </div>

        <div className="application-details__overview">
          <div className="application-details__grid">
            <div className="application-details__field">
              <span>Applicant</span>

              <strong>
                {application.applicant_name}
              </strong>
            </div>

            <div className="application-details__field">
              <span>Submitted</span>

              <strong>
                {formatDate(
                    application.submitted_at,
                    true
                )}
              </strong>
            </div>

            <div className="application-details__field">
              <span>Application Type</span>

              <strong>
                {
                  programNames[
                      application.program_code
                      ]
                }{" "}
                ({application.program_code})
              </strong>
            </div>

            <div className="application-details__field">
              <span>Status</span>

              <strong>
                {
                  applicationStatusLabels[
                      application.status
                      ]
                }
              </strong>
            </div>
          </div>
        </div>

        <div className="application-details__content">
          <div
              className="application-details__tabs"
              role="tablist"
              aria-label="Application information"
          >
            {tabs.map((tab) => (
                <button
                    key={tab}
                    id={`application-details-tab-${tab}`}
                    type="button"
                    role="tab"
                    aria-selected={selectedTab === tab}
                    aria-controls={`application-details-panel-${tab}`}
                    className={`application-details__tab ${
                        selectedTab === tab
                            ? "application-details__tab--active"
                            : ""
                    }`}
                    onClick={() => setActiveTab(tab)}
                >
                  {
                    applicationDetailsTabLabels[
                        tab
                        ]
                  }
                </button>
            ))}
          </div>

          <div
              key={`${application.id}-${selectedTab}`}
              id={`application-details-panel-${selectedTab}`}
              className="application-details__panel"
              role="tabpanel"
              aria-labelledby={`application-details-tab-${selectedTab}`}
              tabIndex={0}
          >
            {renderActiveTab()}
          </div>
        </div>

        <div className="application-details__footer">
          {!canUpdateStatus && (
              <p className="application-details__final-status">
                This application has reached its
                final processing status.
              </p>
          )}

          <button
              type="button"
              className="application-details__back"
              onClick={onBack}
          >
            Back to Overview
          </button>

          <button
              type="button"
              className="application-details__update"
              onClick={() =>
                  onUpdateStatus(application)
              }
              disabled={!canUpdateStatus}
          >
            Update Status
          </button>
        </div>
      </div>
  );
}

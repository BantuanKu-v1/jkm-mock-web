import {
    createApplicant,
    createFinancial,
    createHousehold,
    createHouseholdMember,
    createHealth,
    createCaregiver,
    createCommonApplicationData,
    createApplicationPayload,
} from "./common.mjs";

export function createBptPatient(overrides = {}) {
    return {
        fullName: "Test BPT Patient",
        identificationNo: "600101140031",
        citizenship: "Malaysian",
        relationshipToApplicant: "mother",
        isOku: true,
        okuRegistered: true,
        hasChronicIllness: true,
        chronicIllnessDetails: "Chronic neurological condition",
        isBedridden: true,
        requiresContinuousTreatment: true,
        treatmentStartDate: "2026-01-01",
        ...overrides,
    };
}

export function createBptMedicalConfirmation(overrides = {}) {
    return {
        medicalConfirmationAvailable: true,
        medicalInstitution: "Test Medical Institution",
        medicalOfficerName: "Test Medical Officer",
        diagnosisDetails: "Chronic condition requiring ongoing medical care.",
        treatmentDetails: "Continuous treatment and regular medical follow-up.",
        specialistDetails: null,
        ...overrides,
    };
}

export function createBptProgramSpecificData(
    patient,
    caregiver,
    overrides = {}
) {
    return {
        applicationPathway: "caregiver",
        patient,
        caregiver,
        medicalConfirmation: createBptMedicalConfirmation(),
        reasonForSelfApplication: null,
        additionalRemarks: null,
        ...overrides,
    };
}

export function createBptCaregiverApplicationData(overrides = {}) {
    const applicant = overrides.applicant ?? createApplicant({
        fullName: "Test BPT Caregiver Applicant",
        identificationNo: "850101140032",
        dateOfBirth: "1985-01-01",
    });

    const health = overrides.health ?? createHealth({
        isOku: false,
        okuRegistered: false,
        hasChronicIllness: false,
        isBedridden: false,
        requiresContinuousTreatment: false,
    });

    const patient = createBptPatient();

    const caregiver = createCaregiver({
        fullName: applicant.fullName,
        identificationNo: applicant.identificationNo,
        citizenship: applicant.citizenship,
        relationship: "self",
        providesIntensiveCare: true,
        eligiblePersonsCaredFor: 1,
    });

    return createCommonApplicationData({
        applicant,
        financial: createFinancial({
            monthlyPersonalIncome: 1500,
            monthlyHouseholdIncome: 1500,
        }),
        household: createHousehold([
            createHouseholdMember({
                fullName: patient.fullName,
                identificationNo: patient.identificationNo,
                dateOfBirth: "1960-01-01",
                relationship: "mother",
                citizenship: patient.citizenship,
                isDependent: true,
                employmentStatus: "unemployed",
                occupation: null,
                monthlyIncome: 0,
                isOku: patient.isOku,
                okuRegistered: patient.okuRegistered,
            }),
        ]),
        health,
        caregivers: [caregiver],
        programSpecificData: createBptProgramSpecificData(
            patient,
            caregiver
        ),
        ...overrides,
    });
}

export function createBptNonBedriddenApplicationData(overrides = {}) {
    const applicant = overrides.applicant ?? createApplicant({
        fullName: "Test BPT Non-Bedridden Applicant",
        identificationNo: "750101140033",
        dateOfBirth: "1975-01-01",
    });

    const health = overrides.health ?? createHealth({
        isOku: false,
        okuRegistered: false,
        hasChronicIllness: true,
        chronicIllnessDetails: "Chronic kidney disease",
        isBedridden: false,
        requiresContinuousTreatment: true,
        treatmentStartDate: "2026-01-01",
    });

    const patient = createBptPatient({
        fullName: applicant.fullName,
        identificationNo: applicant.identificationNo,
        citizenship: applicant.citizenship,
        relationshipToApplicant: "self",
        isOku: health.isOku,
        okuRegistered: health.okuRegistered,
        hasChronicIllness: health.hasChronicIllness,
        chronicIllnessDetails: health.chronicIllnessDetails,
        isBedridden: health.isBedridden,
        requiresContinuousTreatment: health.requiresContinuousTreatment,
        treatmentStartDate: health.treatmentStartDate,
    });

    return createCommonApplicationData({
        applicant,
        financial: createFinancial({
            monthlyPersonalIncome: 800,
            monthlyHouseholdIncome: 800,
        }),
        household: createHousehold(),
        health,
        caregivers: [],
        programSpecificData: createBptProgramSpecificData(
            patient,
            null,
            {
                applicationPathway: "non_bedridden_patient",
            }
        ),
        ...overrides,
    });
}

export function createBptBedriddenApplicationData(overrides = {}) {
    const applicant = overrides.applicant ?? createApplicant({
        fullName: "Test BPT Bedridden Applicant",
        identificationNo: "550101140034",
        dateOfBirth: "1955-01-01",
    });

    const health = overrides.health ?? createHealth({
        isOku: true,
        okuRegistered: true,
        disabilityDescription: "Severe mobility impairment",
        hasChronicIllness: true,
        chronicIllnessDetails: "Chronic neurological condition",
        isBedridden: true,
        requiresContinuousTreatment: true,
        treatmentStartDate: "2026-01-01",
    });

    const patient = createBptPatient({
        fullName: applicant.fullName,
        identificationNo: applicant.identificationNo,
        citizenship: applicant.citizenship,
        relationshipToApplicant: "self",
        isOku: health.isOku,
        okuRegistered: health.okuRegistered,
        hasChronicIllness: health.hasChronicIllness,
        chronicIllnessDetails: health.chronicIllnessDetails,
        isBedridden: health.isBedridden,
        requiresContinuousTreatment: health.requiresContinuousTreatment,
        treatmentStartDate: health.treatmentStartDate,
    });

    return createCommonApplicationData({
        applicant,
        financial: createFinancial({
            monthlyPersonalIncome: 0,
            monthlyHouseholdIncome: 500,
        }),
        household: createHousehold(),
        health,
        caregivers: [],
        programSpecificData: createBptProgramSpecificData(
            patient,
            null,
            {
                applicationPathway: "bedridden_patient_without_eligible_caregiver",
                reasonForSelfApplication: "no_caregiver",
            }
        ),
        ...overrides,
    });
}

export function createBptNonMalaysianCaregiverApplicationData(
    overrides = {}
) {
    const applicationData = createBptBedriddenApplicationData();

    const caregiver = createCaregiver({
        fullName: "Test Non-Malaysian Caregiver",
        identificationNo: null,
        citizenship: "Indonesian",
        relationship: "spouse",
        providesIntensiveCare: true,
        eligiblePersonsCaredFor: 1,
    });

    return {
        ...applicationData,
        caregivers: [caregiver],
        programSpecificData: {
            ...applicationData.programSpecificData,
            caregiver,
            reasonForSelfApplication: "non_malaysian_caregiver",
        },
        ...overrides,
    };
}

export function createBptCaregiverApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BPT",
        createBptCaregiverApplicationData(applicationDataOverrides),
        payloadOverrides
    );
}

export function createBptNonBedriddenApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BPT",
        createBptNonBedriddenApplicationData(applicationDataOverrides),
        payloadOverrides
    );
}

export function createBptBedriddenApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BPT",
        createBptBedriddenApplicationData(applicationDataOverrides),
        payloadOverrides
    );
}

export function createBptNonMalaysianCaregiverApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BPT",
        createBptNonMalaysianCaregiverApplicationData(
            applicationDataOverrides
        ),
        payloadOverrides
    );
}

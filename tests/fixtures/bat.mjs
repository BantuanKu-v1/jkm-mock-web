import {
    createApplicant,
    createFinancial,
    createHousehold,
    createHouseholdMember,
    createHealth,
    createCommonApplicationData,
    createApplicationPayload,
} from "./common.mjs";

export function createBatBeneficiary(applicant, health, overrides = {}) {
    return {
        type: "applicant",
        fullName: applicant.fullName,
        identificationNo: applicant.identificationNo,
        relationshipToApplicant: null,
        health: { ...health },
        ...overrides,
    };
}

export function createBatEquipment(overrides = {}) {
    return {
        equipmentType: "Wheelchair",
        equipmentDescription: "Standard manual wheelchair",
        purpose: "Daily mobility assistance",
        estimatedCost: 1500,
        supplierName: "Test Medical Equipment Supplier",
        quotationAvailable: true,
        ...overrides,
    };
}

export function createBatRecommendation(overrides = {}) {
    return {
        recommendationAvailable: true,
        recommendingAuthority: "medical_officer",
        recommendationOfficerName: "Test Medical Officer",
        recommendationInstitution: "Test Medical Institution",
        recommendationDetails: "Wheelchair recommended for mobility assistance.",
        ...overrides,
    };
}

export function createBatProgramSpecificData(
    beneficiary,
    overrides = {}
) {
    return {
        beneficiary,
        functionalLimitationDescription: "Difficulty walking independently.",
        equipment: createBatEquipment(),
        recommendation: createBatRecommendation(),
        additionalJustification: null,
        ...overrides,
    };
}

export function createBatApplicationData(overrides = {}) {
    const applicant = overrides.applicant ?? createApplicant({
        fullName: "Test BAT Applicant",
        identificationNo: "850101140021",
        dateOfBirth: "1985-01-01",
    });

    const health = overrides.health ?? createHealth({
        isOku: true,
        okuRegistered: true,
        disabilityDescription: "Mobility impairment",
        hasChronicIllness: false,
        isBedridden: false,
    });

    const beneficiary = createBatBeneficiary(applicant, health);

    return createCommonApplicationData({
        applicant,
        financial: createFinancial({
            monthlyPersonalIncome: 0,
            monthlyHouseholdIncome: 1000,
        }),
        household: createHousehold([
            createHouseholdMember({
                fullName: "Test BAT Household Member",
                identificationNo: "600101140022",
                dateOfBirth: "1960-01-01",
                relationship: "mother",
                monthlyIncome: 1000,
            }),
        ]),
        health,
        programSpecificData: createBatProgramSpecificData(beneficiary),
        ...overrides,
    });
}

export function createBatDependentApplicationData(overrides = {}) {
    const applicant = overrides.applicant ?? createApplicant({
        fullName: "Test BAT Dependent Applicant",
        identificationNo: "800101140023",
        dateOfBirth: "1980-01-01",
    });

    const applicantHealth = overrides.health ?? createHealth({
        isOku: false,
        okuRegistered: false,
        hasChronicIllness: false,
        isBedridden: false,
    });

    const dependent = createHouseholdMember({
        fullName: "Test BAT Dependent",
        identificationNo: "120101140024",
        dateOfBirth: "2012-01-01",
        relationship: "child",
        isDependent: true,
        employmentStatus: null,
        occupation: null,
        monthlyIncome: 0,
        isStudent: true,
        studyMode: "full_time",
        institutionType: "secondary_school",
        isOku: true,
        okuRegistered: true,
    });

    const dependentHealth = createHealth({
        isOku: true,
        okuRegistered: true,
        disabilityDescription: "Physical disability affecting mobility",
        hasChronicIllness: false,
        isBedridden: false,
    });

    const beneficiary = createBatBeneficiary(
        applicant,
        dependentHealth,
        {
            type: "dependent",
            fullName: dependent.fullName,
            identificationNo: dependent.identificationNo,
            relationshipToApplicant: dependent.relationship,
        }
    );

    return createCommonApplicationData({
        applicant,
        financial: createFinancial({
            monthlyPersonalIncome: 1000,
            monthlyHouseholdIncome: 1000,
        }),
        household: createHousehold([dependent]),
        health: applicantHealth,
        programSpecificData: createBatProgramSpecificData(beneficiary),
        ...overrides,
    });
}

export function createBatApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BAT",
        createBatApplicationData(applicationDataOverrides),
        payloadOverrides
    );
}

export function createBatDependentApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BAT",
        createBatDependentApplicationData(applicationDataOverrides),
        payloadOverrides
    );
}

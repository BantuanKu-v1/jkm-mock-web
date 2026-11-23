import { randomUUID } from "node:crypto";

export function createApplicant(overrides = {}) {
    return {
        fullName: "Test Applicant",
        identificationNo: "650101140001",
        dateOfBirth: "1965-01-01",
        gender: "female",
        citizenship: "Malaysian",
        maritalStatus: "single",
        ...overrides,
    };
}

export function createContact(overrides = {}) {
    return {
        mobilePhone: null,
        homePhone: null,
        email: "applicant@example.test",
        ...overrides,
    };
}

export function createAddress(overrides = {}) {
    return {
        addressLine1: "Test Residential Address",
        addressLine2: null,
        postcode: "57100",
        city: "Kuala Lumpur",
        stateTerritory: "Kuala Lumpur",
        countryCode: "MY",
        ...overrides,
    };
}

export function createEmployment(overrides = {}) {
    return {
        occupation: null,
        employmentStatus: "unemployed",
        isStudent: false,
        studyMode: null,
        institutionType: null,
        ...overrides,
    };
}

export function createFinancial(overrides = {}) {
    return {
        monthlyPersonalIncome: 0,
        monthlyHouseholdIncome: 1000,
        incomeSource: null,
        ...overrides,
    };
}

export function createHouseholdMember(overrides = {}) {
    return {
        fullName: "Test Household Member",
        identificationNo: "900101140002",
        relationship: "child",
        dateOfBirth: "1990-01-01",
        gender: "female",
        citizenship: "Malaysian",
        isDependent: false,
        employmentStatus: "employed",
        occupation: "General Worker",
        monthlyIncome: 1000,
        isStudent: false,
        studyMode: null,
        institutionType: null,
        isOku: false,
        okuRegistered: false,
        ...overrides,
    };
}

export function createHousehold(members = []) {
    return {
        members,
    };
}

export function createHealth(overrides = {}) {
    return {
        isOku: null,
        okuRegistered: null,
        disabilityDescription: null,
        hasChronicIllness: null,
        chronicIllnessDetails: null,
        isBedridden: null,
        requiresContinuousTreatment: null,
        treatmentStartDate: null,
        ...overrides,
    };
}

export function createLivingArrangement(overrides = {}) {
    return {
        arrangementType: "private_residence",
        livesWithFamily: true,
        dependsOnFamily: true,
        dependsOnCaregiver: false,
        isInInstitution: false,
        institutionName: null,
        institutionType: null,
        receivesFreeServices: false,
        receivesRationGrant: false,
        ...overrides,
    };
}

export function createCaregiver(overrides = {}) {
    return {
        fullName: "Test Caregiver",
        identificationNo: "850101140003",
        citizenship: "Malaysian",
        relationship: "child",
        providesIntensiveCare: true,
        eligiblePersonsCaredFor: 1,
        ...overrides,
    };
}

export function createWelfareAssistance(overrides = {}) {
    return {
        programName: "Test Welfare Assistance",
        agency: "Test Agency",
        assistanceType: "monthly",
        monthlyAmount: 100,
        isActive: true,
        startDate: "2026-01-01",
        endDate: null,
        ...overrides,
    };
}

export function createSupportingDocument(overrides = {}) {
    return {
        documentId: randomUUID(),
        requirementType: "identification",
        documentType: "identity_card",
        originalFilename: "test-identification.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1024,
        issuedAt: null,
        expiresAt: null,
        ...overrides,
    };
}

export function createPreliminaryEligibility(overrides = {}) {
    return {
        status: "potentially_eligible",
        criteriaVersion: 1,
        assessedAt: new Date().toISOString(),
        ...overrides,
    };
}

export function createCommonApplicationData(overrides = {}) {
    return {
        schemaVersion: 1,
        applicant: createApplicant(),
        contact: createContact(),
        address: createAddress(),
        financial: createFinancial(),
        employment: createEmployment(),
        household: createHousehold(),
        supportingDocuments: [],
        ...overrides,
    };
}

export function createApplicationPayload(
    programCode,
    applicationData,
    overrides = {}
) {
    return {
        externalApplicationId: `test-${programCode.toLowerCase()}-${randomUUID()}`,
        programCode,
        applicantName: applicationData.applicant.fullName,
        applicantIdentificationNo: applicationData.applicant.identificationNo,
        applicationData,
        ...overrides,
    };
}

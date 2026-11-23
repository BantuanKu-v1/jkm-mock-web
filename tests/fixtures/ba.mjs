import {
    createApplicant,
    createFinancial,
    createHousehold,
    createHouseholdMember,
    createCommonApplicationData,
    createApplicationPayload,
} from "./common.mjs";

export function createBaAdditionalCircumstances(overrides = {}) {
    return {
        economicHardship: true,
        healthRelatedNeeds: false,
        dependentRelatedNeeds: false,
        otherCircumstances: false,
        description: null,
        ...overrides,
    };
}

export function createBaProgramSpecificData(overrides = {}) {
    return {
        receivesOtherJkmMonthlyAssistance: false,
        currentJkmAssistanceProgram: null,
        additionalCircumstances: createBaAdditionalCircumstances(),
        ...overrides,
    };
}

export function createBaApplicationData(overrides = {}) {
    return createCommonApplicationData({
        applicant: createApplicant({
            fullName: "Test BA Applicant",
            identificationNo: "800101140011",
            dateOfBirth: "1980-01-01",
        }),
        financial: createFinancial({
            monthlyPersonalIncome: 0,
            monthlyHouseholdIncome: 1000,
        }),
        household: createHousehold([
            createHouseholdMember({
                fullName: "Test BA Household Member",
                identificationNo: "000101140012",
                dateOfBirth: "2000-01-01",
                relationship: "child",
                monthlyIncome: 1000,
            }),
        ]),
        welfareAssistance: [],
        programSpecificData: createBaProgramSpecificData(),
        ...overrides,
    });
}

export function createBaApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BA",
        createBaApplicationData(applicationDataOverrides),
        payloadOverrides
    );
}

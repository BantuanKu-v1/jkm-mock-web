import {
    createApplicant,
    createFinancial,
    createHousehold,
    createHouseholdMember,
    createLivingArrangement,
    createCommonApplicationData,
    createApplicationPayload,
} from "./common.mjs";

export function createBweProgramSpecificData(overrides = {}) {
    return {
        hasChildren: true,
        dependsOnFamilyOrCaregiver: true,
        familyOrCaregiverMonthlyIncome: 1000,
        incomeDeclarationDetails: null,
        specialConsiderationRequested: false,
        specialConsiderationReason: null,
        ...overrides,
    };
}

export function createBweApplicationData(overrides = {}) {
    return createCommonApplicationData({
        applicant: createApplicant({
            fullName: "Test BWE Applicant",
            identificationNo: "550101140041",
            dateOfBirth: "1955-01-01",
            maritalStatus: "widowed",
        }),
        financial: createFinancial({
            monthlyPersonalIncome: 0,
            monthlyHouseholdIncome: 1000,
        }),
        household: createHousehold([
            createHouseholdMember({
                fullName: "Test BWE Household Member",
                identificationNo: "850101140042",
                dateOfBirth: "1985-01-01",
                relationship: "child",
                monthlyIncome: 1000,
            }),
        ]),
        livingArrangement: createLivingArrangement({
            arrangementType: "private_residence",
            livesWithFamily: true,
            dependsOnFamily: true,
            dependsOnCaregiver: false,
            isInInstitution: false,
            institutionName: null,
            institutionType: null,
            receivesFreeServices: false,
            receivesRationGrant: false,
        }),
        programSpecificData: createBweProgramSpecificData(),
        ...overrides,
    });
}

export function createBweSpecialConsiderationApplicationData(
    overrides = {}
) {
    return createCommonApplicationData({
        applicant: createApplicant({
            fullName: "Test BWE Special Consideration Applicant",
            identificationNo: "500101140043",
            dateOfBirth: "1950-01-01",
            maritalStatus: "single",
        }),
        financial: createFinancial({
            monthlyPersonalIncome: 0,
            monthlyHouseholdIncome: 2500,
        }),
        household: createHousehold([
            createHouseholdMember({
                fullName: "Test BWE Family Caregiver",
                identificationNo: "750101140044",
                dateOfBirth: "1975-01-01",
                relationship: "niece",
                monthlyIncome: 2500,
            }),
        ]),
        livingArrangement: createLivingArrangement({
            arrangementType: "private_residence",
            livesWithFamily: true,
            dependsOnFamily: true,
            dependsOnCaregiver: true,
            isInInstitution: false,
            institutionName: null,
            institutionType: null,
            receivesFreeServices: false,
            receivesRationGrant: false,
        }),
        programSpecificData: createBweProgramSpecificData({
            hasChildren: false,
            dependsOnFamilyOrCaregiver: true,
            familyOrCaregiverMonthlyIncome: 2500,
            incomeDeclarationDetails:
                "Applicant has no personal income and depends on a family caregiver.",
            specialConsiderationRequested: true,
            specialConsiderationReason:
                "Applicant has no children and depends on a family caregiver whose income exceeds the applicable household PGK threshold.",
        }),
        ...overrides,
    });
}

export function createBweApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BWE",
        createBweApplicationData(applicationDataOverrides),
        payloadOverrides
    );
}

export function createBweSpecialConsiderationApplicationPayload(
    applicationDataOverrides = {},
    payloadOverrides = {}
) {
    return createApplicationPayload(
        "BWE",
        createBweSpecialConsiderationApplicationData(
            applicationDataOverrides
        ),
        payloadOverrides
    );
}

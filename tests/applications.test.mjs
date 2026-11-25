import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
    createBaApplicationPayload,
} from "./fixtures/ba.mjs";

import {
    createBatApplicationPayload,
    createBatDependentApplicationPayload,
} from "./fixtures/bat.mjs";

import {
    createBptCaregiverApplicationPayload,
    createBptNonBedriddenApplicationPayload,
    createBptBedriddenApplicationPayload,
    createBptNonMalaysianCaregiverApplicationPayload,
} from "./fixtures/bpt.mjs";

import {
    createBweApplicationPayload,
    createBweSpecialConsiderationApplicationPayload,
} from "./fixtures/bwe.mjs";

import {
    createCaregiver,
} from "./fixtures/common.mjs";

import {
    apiRequest,
    requireApiKey,
    getApiHealth,
    getDatabaseHealth,
    getPrograms,
    getProgramEligibility,
    submitApplication,
    recoverApplication,
    getApplicationStatus,
    assertSuccessResponse,
    assertErrorResponse,
    assertSubmissionResponse,
    assertRecoveryResponse,
    assertStatusResponse,
    assertSameApplication,
} from "./helpers.mjs";

const PROGRAM_CODES = ["BA", "BAT", "BPT", "BWE"];

const EXPECTED_RULE_COUNTS = {
    BA: 3,
    BAT: 5,
    BPT: 5,
    BWE: 3,
};

const TEST_TIMEOUT_MS = 60000;

requireApiKey();

async function expectValidApplication(payload) {
    const response = await submitApplication(payload);

    const confirmation = assertSubmissionResponse(
        response,
        payload.programCode,
        201
    );

    assert.equal(
        confirmation.status,
        "submitted",
        "New applications must have submitted status"
    );

    return confirmation;
}

async function expectInvalidApplication(payload) {
    const response = await submitApplication(payload);

    const error = assertErrorResponse(response, 400);

    assert.equal(
        error.message,
        "Invalid application data"
    );

    assert.ok(
        error.errors !== undefined,
        "Validation errors should include error details"
    );

    const recoveryResponse = await recoverApplication(
        payload.externalApplicationId
    );

    const recoveryError = assertErrorResponse(
        recoveryResponse,
        404
    );

    assert.equal(
        recoveryError.message,
        "Application not found"
    );

    return error;
}

function validationTest(name, createPayload, mutatePayload) {
    it(name, async () => {
        const payload = createPayload();

        mutatePayload(payload);

        await expectInvalidApplication(payload);
    });
}

describe("JKM Mock API - Connectivity", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should return a successful API health response", async () => {
        const response = await getApiHealth();

        assertSuccessResponse(response);
    });

    it("should connect to Cloudflare D1", async () => {
        const response = await getDatabaseHealth();

        const body = assertSuccessResponse(response);

        assert.equal(body.data.connected, 1);
    });

    it("should return all four active JKM programmes", async () => {
        const response = await getPrograms();

        const body = assertSuccessResponse(response);

        assert.ok(Array.isArray(body.data));

        const codes = body.data.map((program) => program.code);

        for (const programCode of PROGRAM_CODES) {
            assert.ok(
                codes.includes(programCode),
                `Missing programme: ${programCode}`
            );
        }
    });

    for (const programCode of PROGRAM_CODES) {
        it(`should return ${programCode} eligibility criteria`, async () => {
            const response = await getProgramEligibility(programCode);

            const body = assertSuccessResponse(response);

            assert.equal(body.data.programCode, programCode);

            assert.ok(
                Number.isInteger(body.data.version) &&
                body.data.version >= 1
            );

            assert.ok(body.data.criteria);

            assert.equal(
                body.data.criteria.schemaVersion,
                1
            );

            assert.equal(
                body.data.criteria.programCode,
                programCode
            );

            assert.ok(
                Array.isArray(body.data.criteria.rules)
            );

            assert.equal(
                body.data.criteria.rules.length,
                EXPECTED_RULE_COUNTS[programCode]
            );
        });
    }
});

describe("JKM Mock API - Authentication", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should reject submission without an API key", async () => {
        const payload = createBaApplicationPayload();

        const response = await submitApplication(payload, {
            authenticated: false,
        });

        assertErrorResponse(response, 401);
    });

    it("should reject submission with an invalid API key", async () => {
        const payload = createBaApplicationPayload();

        const response = await submitApplication(payload, {
            apiKey: `invalid-${randomUUID()}`,
        });

        assertErrorResponse(response, 401);
    });

    it("should reject an invalid Authorization header", async () => {
        const response = await apiRequest("/applications", {
            method: "POST",
            authenticated: false,
            headers: {
                Authorization: "Invalid authentication",
            },
            body: createBaApplicationPayload(),
        });

        assertErrorResponse(response, 401);
    });

    it("should reject unauthenticated recovery requests", async () => {
        const response = await recoverApplication(
            `test-${randomUUID()}`,
            {
                authenticated: false,
            }
        );

        assertErrorResponse(response, 401);
    });

    it("should reject unauthenticated status requests", async () => {
        const response = await getApplicationStatus(
            randomUUID(),
            {
                authenticated: false,
            }
        );

        assertErrorResponse(response, 401);
    });
});

describe("JKM Mock API - Common Application Validation", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    validationTest(
        "should reject an unsupported programme code",
        createBaApplicationPayload,
        (payload) => {
            payload.programCode = "TBP";
        }
    );

    validationTest(
        "should reject a missing applicant name",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicantName;
        }
    );

    validationTest(
        "should reject a mismatched applicant name",
        createBaApplicationPayload,
        (payload) => {
            payload.applicantName = "Different Applicant";
        }
    );

    validationTest(
        "should reject a mismatched applicant identification number",
        createBaApplicationPayload,
        (payload) => {
            payload.applicantIdentificationNo = "990101140099";
        }
    );

    validationTest(
        "should reject a missing application data section",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicationData;
        }
    );

    validationTest(
        "should reject an unsupported schema version",
        createBaApplicationPayload,
        (payload) => {
            payload.applicationData.schemaVersion = 999;
        }
    );

    validationTest(
        "should reject a missing applicant section",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicationData.applicant;
        }
    );

    validationTest(
        "should reject a missing contact section",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicationData.contact;
        }
    );

    validationTest(
        "should reject a missing address section",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicationData.address;
        }
    );

    validationTest(
        "should reject a missing financial section",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicationData.financial;
        }
    );

    validationTest(
        "should reject an invalid date of birth",
        createBaApplicationPayload,
        (payload) => {
            payload.applicationData.applicant.dateOfBirth = "invalid-date";
        }
    );

    validationTest(
        "should reject an invalid email address",
        createBaApplicationPayload,
        (payload) => {
            payload.applicationData.contact.email = "invalid-email";
        }
    );

    validationTest(
        "should reject negative household income",
        createBaApplicationPayload,
        (payload) => {
            payload.applicationData.financial.monthlyHouseholdIncome = -100;
        }
    );

    validationTest(
        "should reject unknown common application fields",
        createBaApplicationPayload,
        (payload) => {
            payload.applicationData.unknownField = true;
        }
    );

    validationTest(
        "should reject unknown top-level application fields",
        createBaApplicationPayload,
        (payload) => {
            payload.unknownField = true;
        }
    );

    validationTest(
        "should reject unknown nested applicant fields",
        createBaApplicationPayload,
        (payload) => {
            payload.applicationData.applicant.unknownField = true;
        }
    );

    it("should accept nullable common application fields", async () => {
        const payload = createBaApplicationPayload();

        payload.applicationData.contact.email = null;
        payload.applicationData.financial.monthlyPersonalIncome = null;
        payload.applicationData.financial.monthlyHouseholdIncome = null;

        await expectValidApplication(payload);
    });

    it("should accept an omitted top-level identification number", async () => {
        const payload = createBaApplicationPayload();

        delete payload.applicantIdentificationNo;

        await expectValidApplication(payload);
    });

    it("should reject malformed JSON", async () => {
        const response = await fetch(
            "http://localhost:8787/api/v1/applications",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${requireApiKey()}`,
                    "Content-Type": "application/json",
                },
                body: '{"invalid":',
                signal: AbortSignal.timeout(15000),
                redirect: "error",
            }
        );

        assert.equal(response.status, 400);

        const body = await response.json();

        assert.equal(body.success, false);

        assert.equal(
            body.message,
            "Invalid JSON request body"
        );
    });
});

describe("JKM Mock API - BA Applications", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should accept a valid BA application", async () => {
        await expectValidApplication(
            createBaApplicationPayload()
        );
    });

    validationTest(
        "should reject missing household information",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicationData.household;
        }
    );

    validationTest(
        "should reject missing welfare assistance information",
        createBaApplicationPayload,
        (payload) => {
            delete payload.applicationData.welfareAssistance;
        }
    );

    validationTest(
        "should reject existing JKM assistance without programme name",
        createBaApplicationPayload,
        (payload) => {
            const data = payload.applicationData.programSpecificData;

            data.receivesOtherJkmMonthlyAssistance = true;
            data.currentJkmAssistanceProgram = null;
        }
    );

    validationTest(
        "should reject other circumstances without description",
        createBaApplicationPayload,
        (payload) => {
            const circumstances =
                payload.applicationData.programSpecificData
                    .additionalCircumstances;

            circumstances.otherCircumstances = true;
            circumstances.description = null;
        }
    );

    validationTest(
        "should reject other circumstances with blank description",
        createBaApplicationPayload,
        (payload) => {
            const circumstances =
                payload.applicationData.programSpecificData
                    .additionalCircumstances;

            circumstances.otherCircumstances = true;
            circumstances.description = "   ";
        }
    );

    it("should accept other circumstances with description", async () => {
        const payload = createBaApplicationPayload();

        const circumstances =
            payload.applicationData.programSpecificData
                .additionalCircumstances;

        circumstances.otherCircumstances = true;
        circumstances.description = "Unexpected household expenses.";

        await expectValidApplication(payload);
    });

    it("should accept a declared existing JKM assistance programme", async () => {
        const payload = createBaApplicationPayload();

        const data = payload.applicationData.programSpecificData;

        data.receivesOtherJkmMonthlyAssistance = true;
        data.currentJkmAssistanceProgram = "Bantuan Warga Emas";

        await expectValidApplication(payload);
    });
});

describe("JKM Mock API - BAT Applications", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should accept an applicant beneficiary", async () => {
        await expectValidApplication(
            createBatApplicationPayload()
        );
    });

    it("should accept a dependent beneficiary", async () => {
        await expectValidApplication(
            createBatDependentApplicationPayload()
        );
    });

    validationTest(
        "should reject a missing beneficiary",
        createBatApplicationPayload,
        (payload) => {
            delete payload.applicationData.programSpecificData.beneficiary;
        }
    );

    validationTest(
        "should reject an applicant beneficiary name mismatch",
        createBatApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .beneficiary.fullName = "Different Beneficiary";
        }
    );

    validationTest(
        "should reject an applicant beneficiary identification mismatch",
        createBatApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .beneficiary.identificationNo = "990101140099";
        }
    );

    validationTest(
        "should reject a dependent beneficiary without relationship",
        createBatDependentApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .beneficiary.relationshipToApplicant = null;
        }
    );

    validationTest(
        "should reject a dependent beneficiary with applicant identity",
        createBatDependentApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .beneficiary.identificationNo =
                payload.applicationData.applicant.identificationNo;
        }
    );

    validationTest(
        "should reject a missing beneficiary health section",
        createBatApplicationPayload,
        (payload) => {
            delete payload.applicationData.programSpecificData
                .beneficiary.health;
        }
    );

    validationTest(
        "should reject missing applicant health information",
        createBatApplicationPayload,
        (payload) => {
            delete payload.applicationData.health;
        }
    );

    validationTest(
        "should reject recommendation without authority",
        createBatApplicationPayload,
        (payload) => {
            const recommendation =
                payload.applicationData.programSpecificData.recommendation;

            recommendation.recommendationAvailable = true;
            recommendation.recommendingAuthority = null;
        }
    );

    validationTest(
        "should reject other recommending authority without details",
        createBatApplicationPayload,
        (payload) => {
            const recommendation =
                payload.applicationData.programSpecificData.recommendation;

            recommendation.recommendingAuthority = "other";
            recommendation.recommendationDetails = null;
        }
    );

    validationTest(
        "should reject negative equipment cost",
        createBatApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .equipment.estimatedCost = -100;
        }
    );

    validationTest(
        "should reject equipment cost exceeding RM20000 without justification",
        createBatApplicationPayload,
        (payload) => {
            const data = payload.applicationData.programSpecificData;

            data.equipment.estimatedCost = 20001;
            data.additionalJustification = null;
        }
    );

    it("should accept equipment cost of exactly RM20000", async () => {
        const payload = createBatApplicationPayload();

        const data = payload.applicationData.programSpecificData;

        data.equipment.estimatedCost = 20000;
        data.additionalJustification = null;

        await expectValidApplication(payload);
    });

    it("should accept equipment cost exceeding RM20000 with justification", async () => {
        const payload = createBatApplicationPayload();

        const data = payload.applicationData.programSpecificData;

        data.equipment.estimatedCost = 25000;
        data.additionalJustification =
            "Specialized equipment requires further JKM assessment.";

        await expectValidApplication(payload);
    });

    it("should accept an unknown equipment cost", async () => {
        const payload = createBatApplicationPayload();

        payload.applicationData.programSpecificData
            .equipment.estimatedCost = null;

        await expectValidApplication(payload);
    });
});

describe("JKM Mock API - BPT Applications", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should accept a valid caregiver application", async () => {
        await expectValidApplication(
            createBptCaregiverApplicationPayload()
        );
    });

    it("should accept a valid non-bedridden patient application", async () => {
        await expectValidApplication(
            createBptNonBedriddenApplicationPayload()
        );
    });

    it("should accept a bedridden patient without caregiver", async () => {
        await expectValidApplication(
            createBptBedriddenApplicationPayload()
        );
    });

    it("should accept a bedridden patient with non-Malaysian caregiver", async () => {
        await expectValidApplication(
            createBptNonMalaysianCaregiverApplicationPayload()
        );
    });

    validationTest(
        "should reject an unsupported application pathway",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .applicationPathway = "unsupported";
        }
    );

    validationTest(
        "should reject a caregiver pathway without caregiver",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData.caregiver = null;
        }
    );

    validationTest(
        "should reject a caregiver not providing intensive care",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .caregiver.providesIntensiveCare = false;
        }
    );

    validationTest(
        "should reject a caregiver name mismatch",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .caregiver.fullName = "Different Caregiver";
        }
    );

    validationTest(
        "should reject a caregiver identification mismatch",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .caregiver.identificationNo = "990101140099";
        }
    );

    validationTest(
        "should reject a caregiver pathway with non-bedridden patient",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.isBedridden = false;
        }
    );

    validationTest(
        "should reject a missing patient relationship",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.relationshipToApplicant = null;
        }
    );

    validationTest(
        "should reject patient and caregiver sharing identification",
        createBptCaregiverApplicationPayload,
        (payload) => {
            const data = payload.applicationData.programSpecificData;

            data.patient.identificationNo =
                data.caregiver.identificationNo;
        }
    );

    validationTest(
        "should reject a self-application patient name mismatch",
        createBptNonBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.fullName = "Different Patient";
        }
    );

    validationTest(
        "should reject a self-application patient identification mismatch",
        createBptNonBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.identificationNo = "990101140099";
        }
    );

    validationTest(
        "should reject a non-bedridden patient marked as bedridden",
        createBptNonBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.isBedridden = true;
        }
    );

    validationTest(
        "should reject a non-bedridden patient without chronic illness",
        createBptNonBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.hasChronicIllness = false;
        }
    );

    validationTest(
        "should reject a non-bedridden patient without continuous treatment",
        createBptNonBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.requiresContinuousTreatment = false;
        }
    );

    validationTest(
        "should reject a missing treatment start date",
        createBptNonBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.treatmentStartDate = null;
        }
    );

    validationTest(
        "should reject a bedridden self-application marked non-bedridden",
        createBptBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .patient.isBedridden = false;
        }
    );

    validationTest(
        "should reject a missing reason for bedridden self-application",
        createBptBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .reasonForSelfApplication = null;
        }
    );

    validationTest(
        "should reject a non-Malaysian caregiver reason without caregiver",
        createBptNonMalaysianCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData.caregiver = null;
        }
    );

    validationTest(
        "should reject a no-caregiver reason with caregiver information",
        createBptBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData.caregiver =
                createCaregiver();
        }
    );

    validationTest(
        "should reject a self-application reason in caregiver pathway",
        createBptCaregiverApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .reasonForSelfApplication = "no_caregiver";
        }
    );

    validationTest(
        "should reject a self-application reason in non-bedridden pathway",
        createBptNonBedriddenApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .reasonForSelfApplication = "no_caregiver";
        }
    );

    validationTest(
        "should reject missing health information",
        createBptCaregiverApplicationPayload,
        (payload) => {
            delete payload.applicationData.health;
        }
    );
});

describe("JKM Mock API - BWE Applications", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should accept a valid standard BWE application", async () => {
        await expectValidApplication(
            createBweApplicationPayload()
        );
    });

    it("should accept a valid special consideration application", async () => {
        await expectValidApplication(
            createBweSpecialConsiderationApplicationPayload()
        );
    });

    validationTest(
        "should reject special consideration without reason",
        createBweSpecialConsiderationApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .specialConsiderationReason = null;
        }
    );

    validationTest(
        "should reject special consideration with empty reason",
        createBweSpecialConsiderationApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .specialConsiderationReason = "";
        }
    );

    validationTest(
        "should reject special consideration with whitespace-only reason",
        createBweSpecialConsiderationApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .specialConsiderationReason = "   ";
        }
    );

    validationTest(
        "should reject missing household information",
        createBweApplicationPayload,
        (payload) => {
            delete payload.applicationData.household;
        }
    );

    validationTest(
        "should reject missing living arrangement information",
        createBweApplicationPayload,
        (payload) => {
            delete payload.applicationData.livingArrangement;
        }
    );

    validationTest(
        "should reject missing programme-specific data",
        createBweApplicationPayload,
        (payload) => {
            delete payload.applicationData.programSpecificData;
        }
    );

    validationTest(
        "should reject missing special consideration flag",
        createBweApplicationPayload,
        (payload) => {
            delete payload.applicationData.programSpecificData
                .specialConsiderationRequested;
        }
    );

    validationTest(
        "should reject negative family or caregiver income",
        createBweApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData
                .familyOrCaregiverMonthlyIncome = -100;
        }
    );

    validationTest(
        "should reject unknown programme-specific fields",
        createBweApplicationPayload,
        (payload) => {
            payload.applicationData.programSpecificData.unknownField = true;
        }
    );

    it("should accept unknown nullable family information", async () => {
        const payload = createBweApplicationPayload();

        const data = payload.applicationData.programSpecificData;

        data.hasChildren = null;
        data.dependsOnFamilyOrCaregiver = null;
        data.familyOrCaregiverMonthlyIncome = null;

        await expectValidApplication(payload);
    });
});

describe("JKM Mock API - Submission Reliability", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should return the original application for an identical submission", async () => {
        const payload = createBaApplicationPayload();

        const first = await expectValidApplication(payload);

        const duplicateResponse = await submitApplication(payload);

        const duplicate = assertSubmissionResponse(
            duplicateResponse,
            "BA",
            200
        );

        assertSameApplication(first, duplicate);
    });

    it("should return the original application when JSON properties are reordered", async () => {
        const payload = createBaApplicationPayload();

        const first = await expectValidApplication(payload);

        function reverseObjectProperties(value) {
            if (Array.isArray(value)) {
                return value.map(reverseObjectProperties);
            }

            if (value !== null && typeof value === "object") {
                return Object.fromEntries(
                    Object.entries(value)
                        .reverse()
                        .map(([key, item]) => [
                            key,
                            reverseObjectProperties(item),
                        ])
                );
            }

            return value;
        }

        const reorderedPayload = reverseObjectProperties(
            payload
        );

        assert.deepEqual(reorderedPayload, payload);

        const response = await submitApplication(
            reorderedPayload
        );

        const duplicate = assertSubmissionResponse(
            response,
            payload.programCode,
            200
        );

        assertSameApplication(first, duplicate);

        assert.equal(duplicate.status, "submitted");
    });

    it("should reject a conflicting duplicate submission", async () => {
        const payload = createBaApplicationPayload();

        const first = await expectValidApplication(payload);

        const conflictingPayload = structuredClone(payload);

        conflictingPayload.applicationData.financial
            .monthlyHouseholdIncome = 2000;

        const conflictResponse = await submitApplication(
            conflictingPayload
        );

        assertErrorResponse(conflictResponse, 409);

        const recoveryResponse = await recoverApplication(
            payload.externalApplicationId
        );

        const recovered = assertRecoveryResponse(
            recoveryResponse,
            "BA",
            payload.externalApplicationId
        );

        assertSameApplication(first, recovered);
    });

    it("should reject reuse of an external ID for another programme", async () => {
        const payload = createBaApplicationPayload();

        const first = await expectValidApplication(payload);

        const conflictingPayload = createBweApplicationPayload(
            {},
            {
                externalApplicationId: payload.externalApplicationId,
            }
        );

        const response = await submitApplication(conflictingPayload);

        assertErrorResponse(response, 409);

        const recoveryResponse = await recoverApplication(
            payload.externalApplicationId
        );

        const recovered = assertRecoveryResponse(
            recoveryResponse,
            "BA",
            payload.externalApplicationId
        );

        assertSameApplication(first, recovered);
    });

    it("should handle concurrent identical submissions consistently", async () => {
        const payload = createBatApplicationPayload();

        const responses = await Promise.all(
            Array.from(
                { length: 5 },
                () => submitApplication(payload)
            )
        );

        assert.ok(
            responses.some((response) => response.status === 201),
            "At least one request must create the application"
        );

        const confirmations = responses.map((response) => {
            assert.ok(
                [200, 201].includes(response.status),
                `Unexpected concurrent response: ${
                    JSON.stringify(response.data)
                }`
            );

            return assertSubmissionResponse(
                response,
                "BAT",
                response.status
            );
        });

        for (const confirmation of confirmations) {
            assertSameApplication(confirmations[0], confirmation);
        }

        const recoveryResponse = await recoverApplication(
            payload.externalApplicationId
        );

        const recovered = assertRecoveryResponse(
            recoveryResponse,
            "BAT",
            payload.externalApplicationId
        );

        assertSameApplication(confirmations[0], recovered);
    });

    it("should reject one of two concurrent conflicting submissions", async () => {
        const firstPayload = createBweApplicationPayload();

        const secondPayload = structuredClone(firstPayload);

        secondPayload.applicationData.financial
            .monthlyHouseholdIncome = 3000;

        const responses = await Promise.all([
            submitApplication(firstPayload),
            submitApplication(secondPayload),
        ]);

        const statuses = responses
            .map((response) => response.status)
            .sort((first, second) => first - second);

        assert.deepEqual(statuses, [201, 409]);

        const successfulResponse = responses.find(
            (response) => response.status === 201
        );

        const conflictingResponse = responses.find(
            (response) => response.status === 409
        );

        const confirmation = assertSubmissionResponse(
            successfulResponse,
            "BWE",
            201
        );

        assertErrorResponse(conflictingResponse, 409);

        const recoveryResponse = await recoverApplication(
            firstPayload.externalApplicationId
        );

        const recovered = assertRecoveryResponse(
            recoveryResponse,
            "BWE",
            firstPayload.externalApplicationId
        );

        assertSameApplication(confirmation, recovered);
    });

    it("should generate unique application IDs and reference numbers", async () => {
        const payloads = [
            createBaApplicationPayload(),
            createBatApplicationPayload(),
            createBptCaregiverApplicationPayload(),
            createBweApplicationPayload(),
        ];

        const confirmations = [];

        for (const payload of payloads) {
            confirmations.push(
                await expectValidApplication(payload)
            );
        }

        const applicationIds = new Set(
            confirmations.map((confirmation) => confirmation.id)
        );

        const referenceNumbers = new Set(
            confirmations.map((confirmation) => confirmation.referenceNo)
        );

        assert.equal(applicationIds.size, payloads.length);
        assert.equal(referenceNumbers.size, payloads.length);
    });
});

describe("JKM Mock API - Application Recovery and Status", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    const recoveryScenarios = [
        ["BA", createBaApplicationPayload],
        ["BAT", createBatApplicationPayload],
        ["BPT", createBptCaregiverApplicationPayload],
        ["BWE", createBweApplicationPayload],
    ];

    for (const [programCode, createPayload] of recoveryScenarios) {
        it(`should recover a submitted ${programCode} application`, async () => {
            const payload = createPayload();

            const confirmation = await expectValidApplication(payload);

            const response = await recoverApplication(
                payload.externalApplicationId
            );

            const recovered = assertRecoveryResponse(
                response,
                programCode,
                payload.externalApplicationId
            );

            assertSameApplication(confirmation, recovered);

            assert.equal(recovered.status, "submitted");

            assert.equal(
                Object.hasOwn(recovered, "applicationData"),
                false
            );

            assert.equal(
                Object.hasOwn(recovered, "applicantName"),
                false
            );

            assert.equal(
                Object.hasOwn(recovered, "applicantIdentificationNo"),
                false
            );
        });

        it(`should retrieve the status of a ${programCode} application`, async () => {
            const payload = createPayload();

            const confirmation = await expectValidApplication(payload);

            const response = await getApplicationStatus(
                confirmation.id
            );

            const application = assertStatusResponse(
                response,
                confirmation.id,
                programCode,
                "submitted"
            );

            assert.equal(
                application.referenceNo,
                confirmation.referenceNo
            );

            assert.ok(
                Date.parse(application.updatedAt) >=
                Date.parse(confirmation.submittedAt)
            );
        });
    }

    it("should return 404 for a nonexistent external application ID", async () => {
        const response = await recoverApplication(
            `test-nonexistent-${randomUUID()}`
        );

        const error = assertErrorResponse(response, 404);

        assert.equal(
            error.message,
            "Application not found"
        );
    });

    it("should return 404 for a nonexistent application ID", async () => {
        const response = await getApplicationStatus(
            randomUUID()
        );

        assertErrorResponse(response, 404);
    });

    it("should reject an external application ID exceeding 100 characters", async () => {
        const response = await recoverApplication(
            "a".repeat(101)
        );

        assertErrorResponse(response, 400);
    });

    it("should reject a whitespace-only external application ID", async () => {
        const response = await recoverApplication("   ");

        assertErrorResponse(response, 400);
    });
});

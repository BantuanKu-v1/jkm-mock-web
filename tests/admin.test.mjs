import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
    createBaApplicationPayload,
} from "./fixtures/ba.mjs";

import {
    createBatApplicationPayload,
} from "./fixtures/bat.mjs";

import {
    createBptCaregiverApplicationPayload,
} from "./fixtures/bpt.mjs";

import {
    createBweApplicationPayload,
} from "./fixtures/bwe.mjs";

import {
    apiRequest,
    requireApiKey,
    requireAdminApiKey,
    submitApplication,
    recoverApplication,
    getApplicationStatus,
    getAdminApplications,
    getAdminApplication,
    updateAdminApplicationStatus,
    assertSuccessResponse,
    assertErrorResponse,
    assertSubmissionResponse,
    assertRecoveryResponse,
    assertStatusResponse,
    assertSameApplication,
} from "./helpers.mjs";

const TEST_TIMEOUT_MS = 60000;

const APPLICATION_STATUSES = [
    "submitted",
    "under_review",
    "additional_information_required",
    "approved",
    "rejected",
    "cancelled",
];

const ALLOWED_TRANSITIONS = {
    submitted: [
        "under_review",
        "cancelled",
    ],
    under_review: [
        "additional_information_required",
        "approved",
        "rejected",
        "cancelled",
    ],
    additional_information_required: [
        "under_review",
        "cancelled",
    ],
    approved: [],
    rejected: [],
    cancelled: [],
};

const STATUS_PATHS = {
    submitted: [],
    under_review: [
        "under_review",
    ],
    additional_information_required: [
        "under_review",
        "additional_information_required",
    ],
    approved: [
        "under_review",
        "approved",
    ],
    rejected: [
        "under_review",
        "rejected",
    ],
    cancelled: [
        "cancelled",
    ],
};

requireApiKey();
requireAdminApiKey();

assert.notEqual(
    requireApiKey(),
    requireAdminApiKey(),
    "Client and admin API keys must be different"
);

async function createSubmittedApplication(
    createPayload = createBaApplicationPayload
) {
    const payload = createPayload();

    const response = await submitApplication(payload);

    const confirmation = assertSubmissionResponse(
        response,
        payload.programCode,
        201
    );

    assert.equal(confirmation.status, "submitted");

    return {
        payload,
        confirmation,
    };
}

async function assertCurrentApplicationStatus(
    application,
    expectedStatus
) {
    const { payload, confirmation } = application;

    const response = await getApplicationStatus(
        confirmation.id
    );

    const status = assertStatusResponse(
        response,
        confirmation.id,
        payload.programCode,
        expectedStatus
    );

    assert.equal(
        status.referenceNo,
        confirmation.referenceNo
    );

    return status;
}

async function transitionApplication(
    application,
    newStatus
) {
    const { payload, confirmation } = application;

    const previousStatus =
        await assertCurrentApplicationStatus(application);

    const response = await updateAdminApplicationStatus(
        confirmation.id,
        newStatus
    );

    const body = assertSuccessResponse(response, 200);

    assert.ok(body.data);

    assert.equal(
        body.data.id,
        confirmation.id
    );

    assert.equal(
        body.data.program_code,
        payload.programCode
    );

    assert.equal(
        body.data.status,
        newStatus
    );

    assert.equal(
        body.data.reference_no,
        confirmation.referenceNo
    );

    assert.equal(
        body.data.external_reference,
        payload.externalApplicationId
    );

    assert.equal(
        body.data.submitted_at,
        confirmation.submittedAt
    );

    const currentStatus =
        await assertCurrentApplicationStatus(
            application,
            newStatus
        );

    assert.equal(
        body.data.updated_at,
        currentStatus.updatedAt
    );

    assert.ok(
        Date.parse(currentStatus.updatedAt) >
        Date.parse(previousStatus.updatedAt),
        "Status update timestamps must strictly increase"
    );

    return body.data;
}

async function createApplicationAtStatus(
    status,
    createPayload = createBaApplicationPayload
) {
    assert.ok(
        Object.hasOwn(STATUS_PATHS, status),
        `Unsupported test status: ${status}`
    );

    const application = await createSubmittedApplication(
        createPayload
    );

    for (const nextStatus of STATUS_PATHS[status]) {
        await transitionApplication(
            application,
            nextStatus
        );
    }

    await assertCurrentApplicationStatus(
        application,
        status
    );

    return application;
}

function assertConcurrentStatusUpdateResponses(responses) {
    const statuses = responses
        .map((response) => response.status)
        .sort((first, second) => first - second);

    assert.deepEqual(statuses, [200, 409]);

    const successfulResponse = responses.find(
        (response) => response.status === 200
    );

    const conflictingResponse = responses.find(
        (response) => response.status === 409
    );

    const body = assertSuccessResponse(
        successfulResponse,
        200
    );

    assertErrorResponse(
        conflictingResponse,
        409
    );

    assert.ok(body.data);

    return body.data;
}

describe("JKM Mock API - Admin Authentication", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should reject application listing without admin authentication", async () => {
        const response = await getAdminApplications({
            authenticated: false,
        });

        assertErrorResponse(response, 401);
    });

    it("should reject application listing with an invalid admin API key", async () => {
        const response = await getAdminApplications({
            apiKey: `invalid-admin-${randomUUID()}`,
        });

        assertErrorResponse(response, 401);
    });

    it("should reject application listing with an ordinary client API key", async () => {
        const response = await getAdminApplications({
            apiKey: requireApiKey(),
        });

        assertErrorResponse(response, 401);
    });

    it("should reject unauthenticated individual application retrieval", async () => {
        const application = await createSubmittedApplication();

        const response = await getAdminApplication(
            application.confirmation.id,
            {
                authenticated: false,
            }
        );

        assertErrorResponse(response, 401);
    });

    it("should reject individual application retrieval using a client API key", async () => {
        const application = await createSubmittedApplication();

        const response = await getAdminApplication(
            application.confirmation.id,
            {
                apiKey: requireApiKey(),
            }
        );

        assertErrorResponse(response, 401);
    });

    it("should reject unauthenticated application status updates", async () => {
        const application = await createSubmittedApplication();

        const response = await updateAdminApplicationStatus(
            application.confirmation.id,
            "under_review",
            {
                authenticated: false,
            }
        );

        assertErrorResponse(response, 401);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should reject status updates using an invalid admin API key", async () => {
        const application = await createSubmittedApplication();

        const response = await updateAdminApplicationStatus(
            application.confirmation.id,
            "under_review",
            {
                apiKey: `invalid-admin-${randomUUID()}`,
            }
        );

        assertErrorResponse(response, 401);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should reject status updates using an ordinary client API key", async () => {
        const application = await createSubmittedApplication();

        const response = await updateAdminApplicationStatus(
            application.confirmation.id,
            "under_review",
            {
                apiKey: requireApiKey(),
            }
        );

        assertErrorResponse(response, 401);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });
});

describe("JKM Mock API - Admin Application Retrieval", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should retrieve all applications using admin authentication", async () => {
        const application = await createSubmittedApplication();

        const response = await getAdminApplications();

        const body = assertSuccessResponse(response, 200);

        assert.ok(
            Array.isArray(body.data),
            "Admin application list must be an array"
        );

        const retrievedApplication = body.data.find(
            (item) => item.id === application.confirmation.id
        );

        assert.ok(
            retrievedApplication,
            "Submitted application must appear in the admin list"
        );

        assert.equal(
            retrievedApplication.status,
            "submitted"
        );

        assert.equal(
            retrievedApplication.program_code,
            application.payload.programCode
        );

        assert.equal(
            retrievedApplication.reference_no,
            application.confirmation.referenceNo
        );

        assert.equal(
            retrievedApplication.external_reference,
            application.payload.externalApplicationId
        );
    });

    const programmeScenarios = [
        ["BA", createBaApplicationPayload],
        ["BAT", createBatApplicationPayload],
        ["BPT", createBptCaregiverApplicationPayload],
        ["BWE", createBweApplicationPayload],
    ];

    for (const [programCode, createPayload] of programmeScenarios) {
        it(`should retrieve an individual ${programCode} application`, async () => {
            const application = await createSubmittedApplication(
                createPayload
            );

            const { payload, confirmation } = application;

            const response = await getAdminApplication(
                confirmation.id
            );

            const body = assertSuccessResponse(response, 200);

            assert.ok(body.data);

            assert.equal(
                body.data.id,
                confirmation.id
            );

            assert.equal(
                body.data.program_code,
                programCode
            );

            assert.equal(
                body.data.submitted_at,
                confirmation.submittedAt
            );

            assert.equal(
                body.data.status,
                "submitted"
            );

            assert.equal(
                body.data.external_reference,
                payload.externalApplicationId
            );

            assert.equal(
                body.data.reference_no,
                confirmation.referenceNo
            );

            assert.equal(
                body.data.applicant_name,
                payload.applicantName
            );

            assert.equal(
                body.data.applicant_identification_no,
                payload.applicantIdentificationNo
            );

            const storedApplicationData =
                typeof body.data.application_data === "string"
                    ? JSON.parse(body.data.application_data)
                    : body.data.application_data;

            assert.deepEqual(
                storedApplicationData,
                payload.applicationData
            );
        });
    }

    it("should return 404 for a nonexistent application", async () => {
        const response = await getAdminApplication(
            randomUUID()
        );

        assertErrorResponse(response, 404);
    });
});

describe("JKM Mock API - Valid Admin Status Transitions", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    for (const [currentStatus, nextStatuses] of Object.entries(
        ALLOWED_TRANSITIONS
    )) {
        for (const nextStatus of nextStatuses) {
            it(`should allow ${currentStatus} -> ${nextStatus}`, async () => {
                const application = await createApplicationAtStatus(
                    currentStatus
                );

                await transitionApplication(
                    application,
                    nextStatus
                );

                const response = await getAdminApplication(
                    application.confirmation.id
                );

                const body = assertSuccessResponse(response, 200);

                assert.equal(
                    body.data.status,
                    nextStatus
                );
            });
        }
    }
});

describe("JKM Mock API - Invalid Admin Status Transitions", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    for (const currentStatus of APPLICATION_STATUSES) {
        const invalidStatuses = APPLICATION_STATUSES.filter(
            (status) =>
                !ALLOWED_TRANSITIONS[currentStatus].includes(status)
        );

        for (const nextStatus of invalidStatuses) {
            it(`should reject ${currentStatus} -> ${nextStatus}`, async () => {
                const application = await createApplicationAtStatus(
                    currentStatus
                );

                const response = await updateAdminApplicationStatus(
                    application.confirmation.id,
                    nextStatus
                );

                assertErrorResponse(response, 409);

                await assertCurrentApplicationStatus(
                    application,
                    currentStatus
                );
            });
        }
    }
});

describe("JKM Mock API - Admin Status Validation", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should reject an unsupported application status", async () => {
        const application = await createSubmittedApplication();

        const response = await updateAdminApplicationStatus(
            application.confirmation.id,
            "invalid_status"
        );

        const body = assertErrorResponse(response, 400);

        assert.ok(body.errors !== undefined);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should reject a missing application status", async () => {
        const application = await createSubmittedApplication();

        const response = await apiRequest(
            `/admin/applications/${encodeURIComponent(
                application.confirmation.id
            )}/status`,
            {
                method: "PATCH",
                admin: true,
                body: {},
            }
        );

        assertErrorResponse(response, 400);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should reject a null application status", async () => {
        const application = await createSubmittedApplication();

        const response = await updateAdminApplicationStatus(
            application.confirmation.id,
            null
        );

        assertErrorResponse(response, 400);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should reject a numeric application status", async () => {
        const application = await createSubmittedApplication();

        const response = await updateAdminApplicationStatus(
            application.confirmation.id,
            123
        );

        assertErrorResponse(response, 400);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should reject an empty application status", async () => {
        const application = await createSubmittedApplication();

        const response = await updateAdminApplicationStatus(
            application.confirmation.id,
            ""
        );

        assertErrorResponse(response, 400);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should reject malformed JSON in a status update", async () => {
        const application = await createSubmittedApplication();

        const response = await fetch(
            `http://localhost:8787/api/v1/admin/applications/${
                encodeURIComponent(application.confirmation.id)
            }/status`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${requireAdminApiKey()}`,
                    "Content-Type": "application/json",
                },
                body: '{"status":',
                signal: AbortSignal.timeout(15000),
                redirect: "error",
            }
        );

        assert.equal(response.status, 400);

        const body = await response.json();

        assert.equal(body.success, false);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });

    it("should return 404 when updating a nonexistent application", async () => {
        const response = await updateAdminApplicationStatus(
            randomUUID(),
            "under_review"
        );

        assertErrorResponse(response, 404);
    });

    it("should reject unknown status update fields", async () => {
        const application = await createSubmittedApplication();

        const response = await apiRequest(
            `/admin/applications/${encodeURIComponent(
                application.confirmation.id
            )}/status`,
            {
                method: "PATCH",
                admin: true,
                body: {
                    status: "under_review",
                    unknownField: true,
                },
            }
        );

        const body = assertErrorResponse(response, 400);

        assert.equal(
            body.message,
            "Invalid application status"
        );

        assert.ok(body.errors !== undefined);

        await assertCurrentApplicationStatus(
            application,
            "submitted"
        );
    });
});

describe("JKM Mock API - Application Status Synchronization", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    const lifecycleScenarios = [
        {
            programCode: "BA",
            createPayload: createBaApplicationPayload,
            statuses: [
                "under_review",
                "approved",
            ],
        },
        {
            programCode: "BAT",
            createPayload: createBatApplicationPayload,
            statuses: [
                "under_review",
                "additional_information_required",
                "under_review",
                "approved",
            ],
        },
        {
            programCode: "BPT",
            createPayload: createBptCaregiverApplicationPayload,
            statuses: [
                "under_review",
                "rejected",
            ],
        },
        {
            programCode: "BWE",
            createPayload: createBweApplicationPayload,
            statuses: [
                "under_review",
                "cancelled",
            ],
        },
    ];

    for (const scenario of lifecycleScenarios) {
        it(`should synchronize the ${scenario.programCode} application lifecycle`, async () => {
            const application = await createSubmittedApplication(
                scenario.createPayload
            );

            const { payload, confirmation } = application;

            let previousUpdatedAt = confirmation.submittedAt;

            for (const nextStatus of scenario.statuses) {
                await transitionApplication(
                    application,
                    nextStatus
                );

                const status = await assertCurrentApplicationStatus(
                    application,
                    nextStatus
                );

                assert.ok(
                    Date.parse(status.updatedAt) >
                    Date.parse(previousUpdatedAt),
                    "Status update timestamps must strictly increase"
                );

                const recoveryResponse = await recoverApplication(
                    payload.externalApplicationId
                );

                const recovered = assertRecoveryResponse(
                    recoveryResponse,
                    scenario.programCode,
                    payload.externalApplicationId
                );

                assertSameApplication(
                    confirmation,
                    recovered
                );

                assert.equal(
                    recovered.status,
                    nextStatus
                );

                assert.equal(
                    recovered.updatedAt,
                    status.updatedAt
                );

                previousUpdatedAt = status.updatedAt;
            }
        });
    }

    it("should preserve the updated status when an application is resubmitted", async () => {
        const application = await createApplicationAtStatus(
            "approved"
        );

        const { payload, confirmation } = application;

        const response = await submitApplication(payload);

        const duplicate = assertSubmissionResponse(
            response,
            payload.programCode,
            200
        );

        assertSameApplication(
            confirmation,
            duplicate
        );

        assert.equal(
            duplicate.status,
            "approved"
        );

        await assertCurrentApplicationStatus(
            application,
            "approved"
        );
    });

    it("should preserve the original submission timestamp after status updates", async () => {
        const application = await createApplicationAtStatus(
            "under_review"
        );

        const { payload, confirmation } = application;

        await transitionApplication(
            application,
            "additional_information_required"
        );

        await transitionApplication(
            application,
            "under_review"
        );

        await transitionApplication(
            application,
            "approved"
        );

        const response = await recoverApplication(
            payload.externalApplicationId
        );

        const recovered = assertRecoveryResponse(
            response,
            payload.programCode,
            payload.externalApplicationId
        );

        assertSameApplication(
            confirmation,
            recovered
        );

        assert.equal(
            recovered.status,
            "approved"
        );
    });
});


describe("JKM Mock API - Concurrent Admin Status Updates", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should allow only one concurrent conflicting terminal status update", async () => {
        const application = await createApplicationAtStatus(
            "under_review"
        );

        const { payload, confirmation } = application;

        const previousStatus =
            await assertCurrentApplicationStatus(
                application,
                "under_review"
            );

        const responses = await Promise.all([
            updateAdminApplicationStatus(
                confirmation.id,
                "approved"
            ),
            updateAdminApplicationStatus(
                confirmation.id,
                "rejected"
            ),
        ]);

        const updatedApplication =
            assertConcurrentStatusUpdateResponses(responses);

        assert.ok(
            ["approved", "rejected"].includes(
                updatedApplication.status
            )
        );

        assert.equal(
            updatedApplication.id,
            confirmation.id
        );

        assert.equal(
            updatedApplication.program_code,
            payload.programCode
        );

        assert.equal(
            updatedApplication.reference_no,
            confirmation.referenceNo
        );

        assert.equal(
            updatedApplication.external_reference,
            payload.externalApplicationId
        );

        assert.equal(
            updatedApplication.submitted_at,
            confirmation.submittedAt
        );

        const finalStatus =
            await assertCurrentApplicationStatus(
                application,
                updatedApplication.status
            );

        assert.equal(
            finalStatus.updatedAt,
            updatedApplication.updated_at
        );

        assert.ok(
            Date.parse(finalStatus.updatedAt) >
            Date.parse(previousStatus.updatedAt)
        );

        const recoveryResponse = await recoverApplication(
            payload.externalApplicationId
        );

        const recovered = assertRecoveryResponse(
            recoveryResponse,
            payload.programCode,
            payload.externalApplicationId
        );

        assertSameApplication(
            confirmation,
            recovered
        );

        assert.equal(
            recovered.status,
            finalStatus.status
        );

        assert.equal(
            recovered.updatedAt,
            finalStatus.updatedAt
        );
    });

    it("should allow only one concurrent identical status update", async () => {
        const application = await createSubmittedApplication();

        const { payload, confirmation } = application;

        const previousStatus =
            await assertCurrentApplicationStatus(
                application,
                "submitted"
            );

        const responses = await Promise.all([
            updateAdminApplicationStatus(
                confirmation.id,
                "under_review"
            ),
            updateAdminApplicationStatus(
                confirmation.id,
                "under_review"
            ),
        ]);

        const updatedApplication =
            assertConcurrentStatusUpdateResponses(responses);

        assert.equal(
            updatedApplication.id,
            confirmation.id
        );

        assert.equal(
            updatedApplication.program_code,
            payload.programCode
        );

        assert.equal(
            updatedApplication.status,
            "under_review"
        );

        assert.equal(
            updatedApplication.reference_no,
            confirmation.referenceNo
        );

        assert.equal(
            updatedApplication.external_reference,
            payload.externalApplicationId
        );

        assert.equal(
            updatedApplication.submitted_at,
            confirmation.submittedAt
        );

        const finalStatus =
            await assertCurrentApplicationStatus(
                application,
                "under_review"
            );

        assert.equal(
            finalStatus.updatedAt,
            updatedApplication.updated_at
        );

        assert.ok(
            Date.parse(finalStatus.updatedAt) >
            Date.parse(previousStatus.updatedAt)
        );
    });
});

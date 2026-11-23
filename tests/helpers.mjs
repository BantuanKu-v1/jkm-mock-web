import assert from "node:assert/strict";

const API_BASE_URL = "http://localhost:8787/api/v1";

const API_KEY = process.env.API_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const APPLICATION_STATUSES = [
    "submitted",
    "under_review",
    "additional_information_required",
    "approved",
    "rejected",
    "cancelled",
];

const PROGRAM_CODES = ["BA", "BAT", "BPT", "BWE"];

const REQUEST_TIMEOUT_MS = 15000;

export function requireApiKey() {
    assert.ok(
        typeof API_KEY === "string" && API_KEY.trim().length > 0,
        "API_KEY is missing from the local environment"
    );

    return API_KEY;
}

export function requireAdminApiKey() {
    assert.ok(
        typeof ADMIN_API_KEY === "string" &&
        ADMIN_API_KEY.trim().length > 0,
        "ADMIN_API_KEY is missing from the local environment"
    );

    return ADMIN_API_KEY;
}

export async function apiRequest(
    path,
    {
        method = "GET",
        body,
        authenticated = true,
        admin = false,
        apiKey,
        headers = {},
    } = {}
) {
    const baseUrl = new URL(`${API_BASE_URL}/`);
    const url = new URL(path.replace(/^\/+/, ""), baseUrl);

    assert.equal(
        url.origin,
        baseUrl.origin,
        "Test requests must target the local Worker"
    );

    assert.ok(
        url.pathname.startsWith(baseUrl.pathname),
        "Test requests must target the local API"
    );

    const requestHeaders = new Headers({
        Accept: "application/json",
        ...headers,
    });

    if (authenticated) {
        const token = apiKey ?? (
            admin ? requireAdminApiKey() : requireApiKey()
        );

        requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    if (body !== undefined) {
        requestHeaders.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: "error",
    });

    const responseText = await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch {
        assert.fail(
            `Expected JSON response from ${method} ${path}. ` +
            `Received HTTP ${response.status}: ${responseText}`
        );
    }

    return {
        status: response.status,
        ok: response.ok,
        headers: response.headers,
        data,
    };
}

export async function getApiHealth() {
    return apiRequest("/health", {
        authenticated: false,
    });
}

export async function getDatabaseHealth() {
    return apiRequest("/health/db", {
        authenticated: false,
    });
}

export async function getPrograms() {
    return apiRequest("/programs", {
        authenticated: false,
    });
}

export async function getProgramEligibility(programCode) {
    return apiRequest(
        `/programs/${encodeURIComponent(programCode)}/eligibility`,
        {
            authenticated: false,
        }
    );
}

export async function submitApplication(payload, options = {}) {
    return apiRequest("/applications", {
        ...options,
        method: "POST",
        body: payload,
    });
}

export async function recoverApplication(
    externalApplicationId,
    options = {}
) {
    return apiRequest(
        `/applications/external/${encodeURIComponent(
            externalApplicationId
        )}`,
        options
    );
}

export async function getApplicationStatus(
    applicationId,
    options = {}
) {
    return apiRequest(
        `/applications/${encodeURIComponent(applicationId)}/status`,
        options
    );
}

export function assertNonEmptyString(value, fieldName) {
    assert.equal(
        typeof value,
        "string",
        `${fieldName} must be a string`
    );

    assert.ok(
        value.trim().length > 0,
        `${fieldName} must not be empty`
    );
}

export function assertIsoTimestamp(value, fieldName) {
    assertNonEmptyString(value, fieldName);

    assert.match(
        value,
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
        `${fieldName} must be an ISO UTC timestamp`
    );

    assert.ok(
        Number.isFinite(Date.parse(value)),
        `${fieldName} must be a valid timestamp`
    );
}

export function assertApplicationStatus(status) {
    assert.ok(
        APPLICATION_STATUSES.includes(status),
        `Unexpected application status: ${status}`
    );
}

export function assertProgramCode(programCode) {
    assert.ok(
        PROGRAM_CODES.includes(programCode),
        `Unexpected programme code: ${programCode}`
    );
}

export function assertSuccessResponse(
    response,
    expectedStatus = 200
) {
    assert.equal(
        response.status,
        expectedStatus,
        `Unexpected HTTP status: ${JSON.stringify(response.data)}`
    );

    assert.equal(response.ok, true);

    assert.equal(
        response.data.success,
        true,
        "Expected a successful API response"
    );

    return response.data;
}

export function assertErrorResponse(
    response,
    expectedStatus
) {
    assert.equal(
        response.status,
        expectedStatus,
        `Unexpected HTTP status: ${JSON.stringify(response.data)}`
    );

    assert.equal(response.ok, false);

    assert.equal(
        response.data.success,
        false,
        "Expected an unsuccessful API response"
    );

    assertNonEmptyString(
        response.data.message,
        "Error message"
    );

    return response.data;
}

export function assertApplicationConfirmation(
    confirmation,
    expectedProgramCode
) {
    assert.ok(
        confirmation &&
        typeof confirmation === "object" &&
        !Array.isArray(confirmation),
        "Application confirmation must be an object"
    );

    assertNonEmptyString(confirmation.id, "Application ID");

    assertNonEmptyString(
        confirmation.referenceNo,
        "Reference number"
    );

    assertProgramCode(confirmation.programCode);

    assert.equal(
        confirmation.programCode,
        expectedProgramCode,
        "Programme code does not match the submitted application"
    );

    assert.match(
        confirmation.referenceNo,
        new RegExp(
            `^JKM-${expectedProgramCode}-\\d{4}-[A-F0-9]{12}$`
        ),
        "Unexpected JKM reference number format"
    );

    assertApplicationStatus(confirmation.status);

    assertIsoTimestamp(
        confirmation.submittedAt,
        "Submission timestamp"
    );

    return confirmation;
}

export function assertSubmissionResponse(
    response,
    expectedProgramCode,
    expectedStatus = 201
) {
    const body = assertSuccessResponse(
        response,
        expectedStatus
    );

    return assertApplicationConfirmation(
        body.data,
        expectedProgramCode
    );
}

export function assertRecoveryResponse(
    response,
    expectedProgramCode,
    expectedExternalApplicationId
) {
    const body = assertSuccessResponse(response, 200);

    const recovered = assertApplicationConfirmation(
        body.data,
        expectedProgramCode
    );

    assert.equal(
        recovered.externalApplicationId,
        expectedExternalApplicationId,
        "Recovered external application ID does not match"
    );

    assertIsoTimestamp(
        recovered.updatedAt,
        "Recovery update timestamp"
    );

    assert.ok(
        Date.parse(recovered.updatedAt) >=
        Date.parse(recovered.submittedAt),
        "Update timestamp must not precede submission timestamp"
    );

    return recovered;
}

export function assertStatusResponse(
    response,
    expectedApplicationId,
    expectedProgramCode,
    expectedApplicationStatus
) {
    const body = assertSuccessResponse(response, 200);
    const application = body.data;

    assert.ok(
        application &&
        typeof application === "object" &&
        !Array.isArray(application),
        "Application status must be an object"
    );

    assert.equal(
        application.id,
        expectedApplicationId,
        "Application ID does not match"
    );

    assertNonEmptyString(
        application.referenceNo,
        "Reference number"
    );

    assert.equal(
        application.programCode,
        expectedProgramCode,
        "Programme code does not match"
    );

    assertApplicationStatus(application.status);

    if (expectedApplicationStatus !== undefined) {
        assert.equal(
            application.status,
            expectedApplicationStatus,
            "Application status does not match"
        );
    }

    assertIsoTimestamp(
        application.updatedAt,
        "Status update timestamp"
    );

    return application;
}

export function assertSameApplication(first, second) {
    assert.equal(
        first.id,
        second.id,
        "Application IDs must match"
    );

    assert.equal(
        first.referenceNo,
        second.referenceNo,
        "Reference numbers must match"
    );

    assert.equal(
        first.programCode,
        second.programCode,
        "Programme codes must match"
    );

    assert.equal(
        first.submittedAt,
        second.submittedAt,
        "Original submission timestamps must match"
    );
}


export async function getAdminApplications(options = {}) {
    return apiRequest("/admin/applications", {
        ...options,
        method: "GET",
        admin: true,
    });
}

export async function getAdminApplication(
    applicationId,
    options = {}
) {
    return apiRequest(
        `/admin/applications/${encodeURIComponent(applicationId)}`,
        {
            ...options,
            method: "GET",
            admin: true,
        }
    );
}

export async function updateAdminApplicationStatus(
    applicationId,
    status,
    options = {}
) {
    return apiRequest(
        `/admin/applications/${encodeURIComponent(applicationId)}/status`,
        {
            ...options,
            method: "PATCH",
            admin: true,
            body: {
                status,
            },
        }
    );
}

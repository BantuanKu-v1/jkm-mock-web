import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
    apiRequest,
    getAdminApplications,
    assertSuccessResponse,
    assertErrorResponse,
} from "./helpers.mjs";

const TEST_TIMEOUT_MS = 60000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const COOKIE_NAME = "jkm_admin_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_LIMIT_PERIOD = 60;

assert.ok(
    typeof ADMIN_USERNAME === "string" &&
    ADMIN_USERNAME.trim().length > 0,
    "ADMIN_USERNAME is missing from the local environment"
);

assert.ok(
    typeof ADMIN_PASSWORD === "string" &&
    ADMIN_PASSWORD.trim().length > 0,
    "ADMIN_PASSWORD is missing from the local environment"
);

async function login(username, password) {
    return apiRequest("/admin/auth/login", {
        method: "POST",
        authenticated: false,
        body: {
            username,
            password,
        },
    });
}

async function checkSession(cookie) {
    return apiRequest("/admin/auth/me", {
        authenticated: false,
        headers: cookie
            ? {
                Cookie: cookie,
            }
            : {},
    });
}

async function logout(cookie) {
    return apiRequest("/admin/auth/logout", {
        method: "POST",
        authenticated: false,
        headers: cookie
            ? {
                Cookie: cookie,
            }
            : {},
    });
}

function extractSessionCookie(response) {
    const setCookie = response.headers.get("set-cookie");

    assert.ok(
        setCookie,
        "Login response must contain a Set-Cookie header"
    );

    const cookie = setCookie.split(";")[0];

    assert.ok(
        cookie.startsWith(`${COOKIE_NAME}=`),
        "Unexpected administrator session cookie name"
    );

    const token = cookie.slice(
        COOKIE_NAME.length + 1
    );

    assert.ok(
        token.trim().length > 0,
        "Session token must not be empty"
    );

    return {
        cookie,
        setCookie,
    };
}

describe("JKM Mock API - Administrator Session Authentication", {
    timeout: TEST_TIMEOUT_MS,
    concurrency: false,
}, () => {
    it("should reject session verification without a cookie", async () => {
        const response = await checkSession();

        const body = assertErrorResponse(
            response,
            401
        );

        assert.equal(
            body.message,
            "Not authenticated"
        );
    });

    it("should reject an invalid session cookie", async () => {
        const invalidCookie =
            `${COOKIE_NAME}=invalid-${randomUUID()}`;

        const response = await checkSession(
            invalidCookie
        );

        const body = assertErrorResponse(
            response,
            401
        );

        assert.equal(
            body.message,
            "Session expired or invalid"
        );
    });

    it("should reject protected endpoints without a valid session", async () => {
        const response = await getAdminApplications({
            authenticated: false,
        });

        assertErrorResponse(response, 401);
    });

    it("should reject protected endpoints using an invalid session", async () => {
        const response = await getAdminApplications({
            authenticated: false,
            headers: {
                Cookie:
                    `${COOKIE_NAME}=invalid-${randomUUID()}`,
            },
        });

        assertErrorResponse(response, 401);
    });

    it("should reject missing credentials", async () => {
        const response = await apiRequest(
            "/admin/auth/login",
            {
                method: "POST",
                authenticated: false,
                body: {},
            }
        );

        const body = assertErrorResponse(
            response,
            400
        );

        assert.equal(
            body.message,
            "Username and password are required"
        );

        assert.equal(
            response.headers.get("set-cookie"),
            null
        );
    });

    it("should reject invalid administrator credentials", async () => {
        const response = await login(
            ADMIN_USERNAME,
            `invalid-password-${randomUUID()}`
        );

        const body = assertErrorResponse(
            response,
            401
        );

        assert.equal(
            body.message,
            "Invalid username or password"
        );

        assert.equal(
            response.headers.get("set-cookie"),
            null
        );
    });

    it("should authenticate an administrator and invalidate the session after logout", async () => {
        const response = await login(
            ADMIN_USERNAME,
            ADMIN_PASSWORD
        );

        const body = assertSuccessResponse(
            response,
            200
        );

        assert.equal(
            body.message,
            "Login successful"
        );

        const { cookie, setCookie } =
            extractSessionCookie(response);

        let loggedOut = false;

        try {
            // Verify session cookie security attributes
            assert.match(
                setCookie,
                /(?:^|;\s*)HttpOnly(?:;|$)/i
            );

            assert.match(
                setCookie,
                /(?:^|;\s*)SameSite=Strict(?:;|$)/i
            );

            assert.match(
                setCookie,
                /(?:^|;\s*)Path=\/(?:;|$)/i
            );

            assert.match(
                setCookie,
                new RegExp(
                    `(?:^|;\\s*)Max-Age=${SESSION_DURATION_SECONDS}(?:;|$)`,
                    "i"
                )
            );

            // Local Worker uses HTTP.
            // Secure is required when deployed over HTTPS.
            assert.doesNotMatch(
                setCookie,
                /(?:^|;\s*)Secure(?:;|$)/i
            );

            // Verify the administrator session
            const sessionResponse =
                await checkSession(cookie);

            const sessionBody = assertSuccessResponse(
                sessionResponse,
                200
            );

            assert.ok(sessionBody.data);

            assert.equal(
                sessionBody.data.username,
                ADMIN_USERNAME
            );

            // Access a protected endpoint without an API key
            const applicationsResponse =
                await getAdminApplications({
                    authenticated: false,
                    headers: {
                        Cookie: cookie,
                    },
                });

            const applicationsBody =
                assertSuccessResponse(
                    applicationsResponse,
                    200
                );

            assert.ok(
                Array.isArray(applicationsBody.data)
            );

            // Log out and invalidate the session
            const logoutResponse = await logout(cookie);

            const logoutBody = assertSuccessResponse(
                logoutResponse,
                200
            );

            loggedOut = true;

            assert.equal(
                logoutBody.message,
                "Logout successful"
            );

            const deletedCookie =
                logoutResponse.headers.get("set-cookie");

            assert.ok(
                deletedCookie,
                "Logout must clear the session cookie"
            );

            assert.match(
                deletedCookie,
                /(?:^|;\s*)Max-Age=0(?:;|$)/i
            );

            // Reusing the old cookie must fail
            const expiredSessionResponse =
                await checkSession(cookie);

            const expiredSessionBody =
                assertErrorResponse(
                    expiredSessionResponse,
                    401
                );

            assert.equal(
                expiredSessionBody.message,
                "Session expired or invalid"
            );

            const protectedResponse =
                await getAdminApplications({
                    authenticated: false,
                    headers: {
                        Cookie: cookie,
                    },
                });

            assertErrorResponse(
                protectedResponse,
                401
            );
        } finally {
            if (!loggedOut) {
                await logout(cookie);
            }
        }
    });

    it("should allow logout without an existing session", async () => {
        const response = await logout();

        const body = assertSuccessResponse(
            response,
            200
        );

        assert.equal(
            body.message,
            "Logout successful"
        );
    });
});

describe("JKM Mock API - Administrator Login Rate Limiting", {
    timeout: 180000,
    concurrency: false,
}, () => {
    it("should reject login attempts exceeding the configured rate limit", async () => {
        // Wait for the previous authentication tests' login rate-limit window to expire
        console.log(
            "[Admin Auth] Waiting 62 seconds for rate-limit reset..."
        );

        await new Promise((resolve) =>
            setTimeout(
                resolve,
                (LOGIN_RATE_LIMIT_PERIOD + 2) * 1000
            )
        );

        console.log("[Admin Auth] Testing login rate limiting...");

        for (
            let attempt = 1;
            attempt <= LOGIN_RATE_LIMIT;
            attempt++
        ) {
            const response = await login(
                ADMIN_USERNAME,
                `invalid-password-${randomUUID()}`
            );

            const body = assertErrorResponse(
                response,
                401
            );

            assert.equal(
                body.message,
                "Invalid username or password",
                `Unexpected response for login attempt ${attempt}`
            );
        }

        // Even valid credentials must be rate limited
        // after the allowed number of login requests.
        const limitedResponse = await login(
            ADMIN_USERNAME,
            ADMIN_PASSWORD
        );

        const limitedBody = assertErrorResponse(
            limitedResponse,
            429
        );

        assert.equal(
            limitedBody.message,
            "Too many login attempts. Please try again later."
        );

        assert.equal(
            limitedResponse.headers.get("retry-after"),
            String(LOGIN_RATE_LIMIT_PERIOD)
        );

        assert.equal(
            limitedResponse.headers.get("set-cookie"),
            null
        );

        // Verify that login becomes available again after the rate-limit window expires
        console.log(
            "[Admin Auth] Waiting 62 seconds for rate-limit recovery..."
        );

        await new Promise((resolve) =>
            setTimeout(
                resolve,
                (LOGIN_RATE_LIMIT_PERIOD + 2) * 1000
            )
        );

        console.log("[Admin Auth] Verifying login recovery...")

        const recoveredResponse = await login(
            ADMIN_USERNAME,
            ADMIN_PASSWORD
        );

        assertSuccessResponse(
            recoveredResponse,
            200
        );

        const { cookie } =
            extractSessionCookie(recoveredResponse);

        try {
            const sessionResponse =
                await checkSession(cookie);

            assertSuccessResponse(
                sessionResponse,
                200
            );
        } finally {
            const logoutResponse =
                await logout(cookie);

            assertSuccessResponse(
                logoutResponse,
                200
            );
        }
    });
});

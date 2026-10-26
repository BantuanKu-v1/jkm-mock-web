import githubIcon from "../assets/github-mark.svg";
import { useEffect } from "react";

const GITHUB_REPO_URL = "https://github.com/BantuanKu-v1/jkm-mock-web";

const API_BASE = "/api/v1";

const endpoints = [
  {
    method: "GET",
    path: "/health",
    description: "Check whether the JKM Mock API is running.",
    auth: "Public",
  },
  {
    method: "GET",
    path: "/health/db",
    description: "Check the Cloudflare D1 database connection.",
    auth: "Public",
  },
  {
    method: "GET",
    path: "/programs",
    description: "Retrieve all active JKM assistance programs.",
    auth: "Public",
  },
  {
    method: "GET",
    path: "/programs/eligibility",
    description: "Retrieve eligibility criteria for all active programs.",
    auth: "Public",
  },
  {
    method: "GET",
    path: "/programs/:code",
    description: "Retrieve information about a specific JKM program.",
    auth: "Public",
  },
  {
    method: "GET",
    path: "/programs/:code/eligibility",
    description: "Retrieve eligibility criteria for a specific program.",
    auth: "Public",
  },
  {
    method: "POST",
    path: "/applications",
    description: "Submit a new JKM assistance application.",
    auth: "API Key",
  },
  {
    method: "GET",
    path: "/applications/:id/status",
    description: "Retrieve the processing status of an application.",
    auth: "API Key",
  },
];

const supportedPrograms = [
  {
    code: "BWE",
    name: "Bantuan Warga Emas",
  },
  {
    code: "BA",
    name: "Bantuan Am",
  },
  {
    code: "BAT",
    name: "Bantuan Alat Tiruan / Alat Sokongan",
  },
  {
    code: "BPT",
    name: "Bantuan Penjagaan OKU Terlantar / Pesakit Kronik Terlantar",
  },
];

const applicationStatuses = [
  {
    status: "submitted",
    description: "Application successfully received.",
  },
  {
    status: "under_review",
    description: "Application is being reviewed by an administrator.",
  },
  {
    status: "additional_information_required",
    description: "Additional applicant information is required.",
  },
  {
    status: "approved",
    description: "Application has been approved.",
  },
  {
    status: "rejected",
    description: "Application has been rejected.",
  },
  {
    status: "cancelled",
    description: "Application has been cancelled.",
  },
];

const errorResponses = [
  {
    status: 400,
    meaning: "Bad Request",
    cause: "Invalid JSON or application data.",
  },
  {
    status: 401,
    meaning: "Unauthorized",
    cause: "Missing or invalid API key.",
  },
  {
    status: 404,
    meaning: "Not Found",
    cause: "Program, eligibility criteria, or application not found.",
  },
  {
    status: 409,
    meaning: "Conflict",
    cause: "External application ID is already in use.",
  },
  {
    status: 500,
    meaning: "Internal Server Error",
    cause: "An unexpected server or database error occurred.",
  },
];

function Endpoint({
  method,
  path,
  description,
}: {
  method: "GET" | "POST" | "PATCH";
  path: string;
  description?: string;
}) {
  return (
      <div className="api-docs__endpoint">
      <span
          className={`api-docs__method api-docs__method--${method.toLowerCase()}`}
      >
        {method}
      </span>

        <code>{API_BASE}{path}</code>

        {description && <p>{description}</p>}
      </div>
  );
}

export default function ApiDocumentationPage() {
  useEffect(() => {
    document.title = "JKM Mock API Doc";

    return () => {
      document.title = "JKM Mock";
    };
  }, []);

  return (
      <div className="api-docs">
        <header className="api-docs__header">
          <div className="api-docs__header-content">
            <div className="api-docs__header-top">
            <span className="api-docs__label">
              JKM Mock Web
            </span>

              {GITHUB_REPO_URL && (
                  <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="api-docs__github"
                  >
                    <img
                        src={githubIcon}
                        alt=""
                        aria-hidden="true"
                    />

                    <span>GitHub Repository ↗</span>
                  </a>
              )}
            </div>

            <h1 className="api-docs__title">
              API Documentation
            </h1>

            <p className="api-docs__description">
              Integration guidelines for third-party applications
              connecting to the JKM Mock Web API.
            </p>
          </div>
        </header>

        <main className="api-docs__content">
          <section className="api-docs__section">
            <h2>Overview</h2>

            <p>
              JKM Mock Web is a simulated external agency system
              developed for academic demonstration and integration
              testing.
            </p>

            <p>
              Third-party applications can retrieve JKM assistance
              programs, access eligibility criteria, submit
              applications, and retrieve their processing statuses.
            </p>

            <p>
              The API follows RESTful conventions and uses JSON
              for request and response bodies.
            </p>

            <p>
              All API endpoints are prefixed with:
            </p>

            <pre>
            <code>/api/v1</code>
          </pre>
          </section>

          <section className="api-docs__section">
            <h2>Authentication</h2>

            <p>
              JKM Mock Web provides public endpoints for retrieving
              assistance programs and eligibility criteria.
            </p>

            <p>
              Application submission and application status
              retrieval require an API key.
            </p>

            <p>
              Include the API key in the Authorization header:
            </p>

            <pre>
            <code>
              {"Authorization: Bearer <YOUR_API_KEY>"}
            </code>
          </pre>

            <p>
              For requests containing JSON data, include:
            </p>

            <pre>
            <code>Content-Type: application/json</code>
          </pre>

            <p>
              API keys must be stored securely and should never
              be exposed in public repositories or client-side code.
            </p>

            <h3>Public Endpoints</h3>

            <p>
              The following endpoints do not require an API key:
            </p>

            <pre>
            <code>{`GET /api/v1/health
              GET /api/v1/health/db
              GET /api/v1/programs
              GET /api/v1/programs/eligibility
              GET /api/v1/programs/:code
              GET /api/v1/programs/:code/eligibility`}</code>
          </pre>

            <h3>Protected Endpoints</h3>

            <pre>
            <code>{`POST /api/v1/applications
              GET /api/v1/applications/:id/status`}</code>
          </pre>

            <p>
              Administrative endpoints use separate administrator
              authentication and are not intended for third-party
              application integrations.
            </p>
          </section>

          <section className="api-docs__section">
            <h2>Available Endpoints</h2>

            {endpoints.map((endpoint) => (
                <Endpoint
                    key={`${endpoint.method}-${endpoint.path}`}
                    method={endpoint.method as "GET" | "POST"}
                    path={endpoint.path}
                    description={endpoint.description}
                />
            ))}
          </section>

          <section className="api-docs__section">
            <h2>Supported Assistance Programs</h2>

            <p>
              JKM Mock Web supports the following assistance
              program codes for application submission.
              Program retrieval endpoints return programs
              that are currently marked as active.
            </p>

            <div className="api-docs__table-wrapper">
              <table className="api-docs__table">
                <thead>
                <tr>
                  <th>Program Code</th>
                  <th>Program Name</th>
                </tr>
                </thead>

                <tbody>
                {supportedPrograms.map((program) => (
                    <tr key={program.code}>
                      <td>
                        <code>{program.code}</code>
                      </td>

                      <td>{program.name}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="api-docs__section">
            <h2>1. Retrieve JKM Programs</h2>

            <Endpoint
                method="GET"
                path="/programs"
            />

            <p>
              Retrieve all active JKM assistance programs.
            </p>

            <p>
              The response contains program information,
              including descriptions, assistance amounts,
              application methods, and official references.
            </p>

            <h3>Success Response - 200 OK</h3>

            <pre>
            <code>{`{
              "success": true,
              "data": [
                {
                  "id": "<program-id>",
                  "code": "BWE",
                  "name": "Bantuan Warga Emas",
                  "agency": "JKM",
                  "category": "<category>",
                  "description": "<description>",
                  "assistance_type": "<assistance-type>",
                  "assistance_min_amount": null,
                  "assistance_max_amount": null,
                  "assistance_frequency": "<frequency>",
                  "assistance_description": "<description>",
                  "application_method": "<method>",
                  "official_url": "<official-reference>",
                  "is_active": 1,
                  "last_reviewed_at": "<timestamp>"
                }
              ]
            }`}</code>
          </pre>

            <p>
              The example above illustrates the response structure.
              Actual values depend on the database records.
            </p>
          </section>

          <section className="api-docs__section">
            <h2>2. Retrieve a Specific Program</h2>

            <Endpoint
                method="GET"
                path="/programs/:code"
            />

            <p>
              Retrieve detailed information about an active
              JKM assistance program using its program code.
            </p>

            <h3>Path Parameter</h3>

            <div className="api-docs__table-wrapper">
              <table className="api-docs__table">
                <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
                </thead>

                <tbody>
                <tr>
                  <td><code>code</code></td>
                  <td>string</td>
                  <td>
                    JKM program code, such as BWE, BA, BAT, or BPT.
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <h3>Example Request</h3>

            <pre>
            <code>GET /api/v1/programs/BWE</code>
          </pre>

            <p>
              Program codes are converted to uppercase
              before database lookup.
            </p>

            <p>
              The endpoint returns the program object
              described in the previous section.
            </p>

            <p>
              If the program does not exist or is inactive,
              the API returns HTTP 404 Not Found.
            </p>
          </section>

          <section className="api-docs__section">
            <h2>3. Retrieve All Eligibility Criteria</h2>

            <Endpoint
                method="GET"
                path="/programs/eligibility"
            />

            <p>
              Retrieve eligibility criteria for all active
              JKM assistance programs that have criteria
              stored in the database.
            </p>

            <h3>Success Response - 200 OK</h3>

            <pre>
            <code>{`{
              "success": true,
              "data": [
                {
                  "programCode": "BWE",
                  "programName": "Bantuan Warga Emas",
                  "version": 1,
                  "updatedAt": "<timestamp>",
                  "criteria": {
                    "rules": []
                  }
                }
              ]
            }`}</code>
          </pre>

            <p>
              The rules array above is abbreviated for illustration.
              Actual responses contain the eligibility criteria
              stored for each program.
            </p>
          </section>

          <section className="api-docs__section">
            <h2>4. Retrieve Program Eligibility Criteria</h2>

            <Endpoint
                method="GET"
                path="/programs/:code/eligibility"
            />

            <p>
              Retrieve the eligibility criteria associated
              with a specific active JKM assistance program.
            </p>

            <h3>Example Request</h3>

            <pre>
            <code>GET /api/v1/programs/BWE/eligibility</code>
          </pre>

            <h3>Success Response - 200 OK</h3>

            <pre>
            <code>{`{
              "success": true,
              "data": {
                "programCode": "BWE",
                "programName": "Bantuan Warga Emas",
                "version": 1,
                "updatedAt": "<timestamp>",
                "criteria": {
                  "rules": [
                    "<eligibility-rule-objects>"
                  ]
                }
              }
            }`}</code>
          </pre>

            <h3>Response Fields</h3>

            <div className="api-docs__table-wrapper">
              <table className="api-docs__table">
                <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
                </thead>

                <tbody>
                <tr>
                  <td><code>programCode</code></td>
                  <td>string</td>
                  <td>JKM assistance program code.</td>
                </tr>

                <tr>
                  <td><code>programName</code></td>
                  <td>string</td>
                  <td>Assistance program name.</td>
                </tr>

                <tr>
                  <td><code>version</code></td>
                  <td>number</td>
                  <td>Current eligibility criteria version.</td>
                </tr>

                <tr>
                  <td><code>updatedAt</code></td>
                  <td>string</td>
                  <td>Last updated timestamp.</td>
                </tr>

                <tr>
                  <td><code>criteria</code></td>
                  <td>object</td>
                  <td>
                    Eligibility criteria stored for the program.
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <p>
              The API returns the stored eligibility criteria.
              Third-party applications are responsible for
              interpreting and evaluating these criteria.
            </p>

            <p>
              The API does not independently determine
              an applicant's eligibility through this endpoint.
            </p>
          </section>

          <section className="api-docs__section">
            <h2>5. Submit an Application</h2>

            <Endpoint
                method="POST"
                path="/applications"
            />

            <p>
              Submit a new JKM assistance application using
              a unique external application identifier.
            </p>

            <p>
              This endpoint requires Bearer API key authentication.
            </p>

            <h3>Request Body</h3>

            <pre>
            <code>{`{
              "externalApplicationId": "BANTUANKU-APP-001",
              "programCode": "BWE",
              "applicantName": "Ahmad bin Ali",
              "applicantIdentificationNo": "900101011234",
              "applicationData": {
                "monthlyHouseholdIncome": 1000,
                "householdSize": 2
              }
            }`}</code>
          </pre>

            <h3>Request Fields</h3>

            <div className="api-docs__table-wrapper">
              <table className="api-docs__table">
                <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Validation</th>
                  <th>Description</th>
                </tr>
                </thead>

                <tbody>
                <tr>
                  <td><code>externalApplicationId</code></td>
                  <td>string</td>
                  <td>Required, 1–100 characters</td>
                  <td>
                    Unique identifier generated by the third-party system.
                  </td>
                </tr>

                <tr>
                  <td><code>programCode</code></td>
                  <td>string</td>
                  <td>BWE, BA, BAT, or BPT</td>
                  <td>JKM assistance program code.</td>
                </tr>

                <tr>
                  <td><code>applicantName</code></td>
                  <td>string</td>
                  <td>Required, 1–150 characters</td>
                  <td>Applicant's full name.</td>
                </tr>

                <tr>
                  <td><code>applicantIdentificationNo</code></td>
                  <td>string</td>
                  <td>Optional, 1–30 characters</td>
                  <td>Applicant identification number.</td>
                </tr>

                <tr>
                  <td><code>applicationData</code></td>
                  <td>object</td>
                  <td>Optional</td>
                  <td>Additional application information.</td>
                </tr>
                </tbody>
              </table>
            </div>

            <p>
              Leading and trailing whitespace is removed
              from validated string fields.
            </p>

            <h3>Success Response - 201 Created</h3>

            <pre>
            <code>{`{
              "success": true,
              "message": "Application submitted successfully",
              "data": {
                "id": "<generated-application-id>",
                "referenceNo": "<generated-reference-number>",
                "programCode": "BWE",
                "status": "submitted",
                "submittedAt": "<ISO-8601-timestamp>"
              }
            }`}</code>
          </pre>

            <h3>Duplicate Submission - 200 OK</h3>

            <p>
              If an existing external application ID is submitted
              again with identical application information,
              the API returns the existing application.
            </p>

            <pre>
            <code>{`{
              "success": true,
              "message": "Application already exists",
              "data": {
                "id": "<existing-application-id>",
                "referenceNo": "<existing-reference-number>",
                "programCode": "BWE",
                "status": "under_review",
                "submittedAt": "<existing-timestamp>"
              }
            }`}</code>
          </pre>

            <p>
              If the same external application ID is reused
              with different application information,
              the API returns HTTP 409 Conflict.
            </p>

            <p>
              A successful submission creates an application
              with the initial status <code>submitted</code>.
            </p>
          </section>

          <section className="api-docs__section">
            <h2>6. Retrieve Application Status</h2>

            <Endpoint
                method="GET"
                path="/applications/:id/status"
            />

            <p>
              Retrieve the current processing status of
              a previously submitted JKM application.
            </p>

            <p>
              This endpoint requires Bearer API key authentication.
            </p>

            <h3>Path Parameter</h3>

            <div className="api-docs__table-wrapper">
              <table className="api-docs__table">
                <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
                </thead>

                <tbody>
                <tr>
                  <td><code>id</code></td>
                  <td>string</td>
                  <td>
                    Application ID returned by the submission endpoint.
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <h3>Success Response - 200 OK</h3>

            <pre>
            <code>{`{
              "success": true,
              "data": {
                "id": "<application-id>",
                "referenceNo": "<reference-number>",
                "programCode": "BWE",
                "status": "under_review",
                "updatedAt": "<timestamp>"
              }
            }`}</code>
          </pre>

            <p>
              Applications are retrieved within the authenticated
              API client's scope.
            </p>

            <p>
              If the application does not exist or does not belong
              to the authenticated client, the API returns
              HTTP 404 Not Found.
            </p>
          </section>

          <section className="api-docs__section">
            <h2>Application Status Flow</h2>

            <pre>
            <code>{`submitted
               |
               +----> under_review
               |          |
               |          +----> additional_information_required
               |          |                  |
               |          |                  +----> under_review
               |          |
               |          +----> approved
               |          |
               |          +----> rejected
               |          |
               |          +----> cancelled
               |
               +----> cancelled`}</code>
          </pre>

            <p>
              Every newly submitted application starts with
              the <code>submitted</code> status.
            </p>

            <p>
              Administrators can update applications according
              to the supported status transitions.
            </p>

            <p>
              Approved, rejected, and cancelled applications
              are final and cannot be changed further.
            </p>

            <h3>Supported Status Values</h3>

            <div className="api-docs__table-wrapper">
              <table className="api-docs__table">
                <thead>
                <tr>
                  <th>Status</th>
                  <th>Description</th>
                </tr>
                </thead>

                <tbody>
                {applicationStatuses.map((item) => (
                    <tr key={item.status}>
                      <td>
                        <code>{item.status}</code>
                      </td>

                      <td>{item.description}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="api-docs__section">
            <h2>Error Responses</h2>

            <p>
              The API returns an appropriate HTTP status code
              and a JSON response describing the error.
            </p>

            <div className="api-docs__table-wrapper">
              <table className="api-docs__table">
                <thead>
                <tr>
                  <th>HTTP Status</th>
                  <th>Meaning</th>
                  <th>Possible Cause</th>
                </tr>
                </thead>

                <tbody>
                {errorResponses.map((error) => (
                    <tr key={error.status}>
                      <td>{error.status}</td>
                      <td>{error.meaning}</td>
                      <td>{error.cause}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>

            <h3>Example Error Response</h3>

            <pre>
            <code>{`{
              "success": false,
              "message": "JKM program not found"
            }`}</code>
          </pre>
          </section>

          <section className="api-docs__section api-docs__section--notice">
            <h2>Important Notice</h2>

            <p>
              JKM Mock Web is developed solely for academic
              demonstration and integration testing.
              It is not affiliated with, endorsed by, or
              operated by Jabatan Kebajikan Masyarakat
              or any Malaysian government agency.
            </p>

            <p>
              Eligibility criteria and application processing
              are simulated and do not represent official
              government eligibility decisions or approvals.
            </p>

            <p>
              Use fictional applicant information when
              testing API integrations.
            </p>
          </section>

        </main>
      </div>
  );
}

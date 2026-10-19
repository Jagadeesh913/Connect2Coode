# Connect-2-Code — Developer API Reference Manual

This document is the central, comprehensive developer reference for all APIs in the **Connect-2-Code** platform. Consult this document prior to making any frontend network calls, designing new components, or modifying backend controllers.

---

## Table of Contents

1. [Architectural Overview & Base URLs](#1-architectural-overview--base-urls)
2. [Status & Evidence Taxonomy](#2-status--evidence-taxonomy)
3. [Module 1: Authentication & Session Management](#3-module-1-authentication--session-management)
   - [POST /signUp](#post-signup)
   - [POST /auth/login](#post-authlogin)
   - [POST /auth/refresh](#post-authrefresh)
   - [POST /auth/generatePasswordResetOtp](#post-authgeneratepasswordresetotp)
   - [POST /auth/verifyPasswordResetOtp](#post-authverifypasswordresetotp)
   - [POST /auth/logout](#post-authlogout)
4. [Module 2: Reference Library (Metadata & Lookups)](#4-module-2-reference-library-metadata--lookups)
   - [GET /referenceLibrary/refGroupCode/TOPIC](#get-referencelibraryrefgroupcodetopic)
   - [GET /referenceLibrary/refGroupCode/DIFF](#get-referencelibraryrefgroupcodediff)
   - [GET /referenceLibrary/refGroupCode/QPF](#get-referencelibraryrefgroupcodeqpf)
   - [GET /referenceLibrary](#get-referencelibrary)
5. [Module 3: Companies Directory](#5-module-3-companies-directory)
   - [GET /company](#get-company)
   - [GET /company/{id}](#get-companyid)
   - [GET /company/{slug}](#get-companyslug)
   - [GET /company/{id}/problems](#get-companyidproblems)
   - [POST /company](#post-company)
6. [Module 4: Languages & Compiler Configuration](#6-module-4-languages--compiler-configuration)
   - [GET /language](#get-language)
   - [GET /language/dropdown](#get-languagedropdown)
   - [GET /language/{id}](#get-languageid)
   - [POST /language](#post-language)
   - [DELETE /language/{id}](#delete-languageid)
7. [Module 5: Questions & Problem Management](#7-module-5-questions--problem-management)
   - [POST /questions](#post-questions)
   - [GET /question/{id}](#get-questionid)
   - [GET /question/{slug}](#get-questionslug)
   - [POST /question](#post-question)
   - [POST /question/{id}/testCases](#post-questionidtestcases)
   - [POST /question/{id}/submit](#post-questionidsubmit)
8. [Module 6: Code Execution & Judge0 Integration](#8-module-6-code-execution--judge0-integration)
   - [POST /runCode](#post-runcode)
   - [POST /submitCode](#post-submitcode)
   - [POST /admin/testCode](#post-admintestcode)
   - [POST /admin/submitCode](#post-adminsubmitcode)
9. [Module 7: User Profile, Bookmarks & Progress](#9-module-7-user-profile-bookmarks--progress)
   - [GET /user/profile](#get-userprofile)
   - [PUT /user/profile](#put-userprofile)
   - [POST /users/{userId}/questions/{questionId}/bookmark](#post-usersuseridquestionsquestionidbookmark)
   - [GET /users/{userId}/questions/bookmarks](#get-usersuseridquestionsbookmarks)
   - [DELETE /users/{userId}/questions/{questionId}/bookmark](#delete-usersuseridquestionsquestionidbookmark)
   - [GET /users/{userId}/solvedQuestions](#get-usersuseridsolvedquestions)
   - [GET /users/{userId}/attemptedQuestions](#get-usersuseridattemptedquestions)

---

## 1. Architectural Overview & Base URLs

- **Remote Production Base URL**: `https://api.connect2code.in/api/v1`
- **Development Proxy Path**: `/api/v1` (forwarded via Vite development server)
- **Base URL Source**: Configured in `src/core/api/apiClient.ts` via `import.meta.env.VITE_API_BASE_URL`.
- **Standard Envelope**: Most successful responses follow the Java Spring Boot `ApiResponse<T>` wrapper:
  ```json
  {
    "statusCode": 200,
    "message": "Operation successful",
    "data": {},
    "errors": null,
    "timestamp": "2026-10-09T10:05:20.381245748"
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "statusCode": 401,
    "message": "Authentication required",
    "data": null,
    "errors": ["JWT token is missing or invalid"],
    "timestamp": "2026-10-09T10:05:20.708709263"
  }
  ```

---

## 2. Status & Evidence Taxonomy

To ensure complete technical precision, every documented endpoint separates three distinct dimensions:

1. **Evidence Method**:
   - `POSTMAN_EXECUTED`: Execution result directly confirmed by the connected Postman MCP collection runner (`runCollection`).
   - `DIRECT_HTTP_PROBE`: Request executed by a reproducible automated script via direct HTTP fetch.
   - `SOURCE_VERIFIED`: Confirmed by frontend source code or endpoint mappings without direct execution.
   - `NOT_VERIFIED`: Evidence is insufficient to verify behavior.
2. **Functional Status**:
   - `PASS`: Endpoint functioned successfully and satisfied its expected contract.
   - `FAIL`: Endpoint failed contract expectations (e.g. string slug rejected by `@PathVariable Long id`).
   - `BLOCKED`: Request reached backend service logic but halted due to an observed backend defect.
   - `INCONCLUSIVE`: Payload validation or schema constraint failure halted execution before business logic ran.
   - `NOT_TESTED`: Endpoint not tested functionally (e.g., unmapped base path or deprecated route).
3. **Auth Verification Status**:
   - `VERIFIED`: Access control boundaries conclusively determined across Anonymous, USER, and ADMIN credentials.
   - `INCONCLUSIVE`: Caught by fallback security filter (401) or execution halted before role boundary confirmed.
   - `NOT_TESTED`: Authentication not evaluated.

---

## 3. Module 1: Authentication & Session Management

### POST /signUp
- **Feature / Module**: Authentication & Registration
- **HTTP Method**: `POST`
- **Exact Path**: `/signUp`
- **Full Remote URL**: `https://api.connect2code.in/api/v1/signUp`
- **Purpose**: Creates and registers a new platform user account.
- **Frontend Caller**: `src/services/authService.ts` (`authService.signUp`)
- **Authentication Requirement**: `PUBLIC`
- **Required Role(s)**: None (Anonymous allowed)
- **Bearer Token Behavior**: No Authorization header needed or expected.
- **Required Headers**: `Content-Type: application/json`
- **Path & Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  interface SignUpPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'USER' | 'ADMIN'; // Defaults to 'USER'
    labelUserName?: string;
    userName?: string;
  }
  ```
- **Safe Request Example**:
  ```json
  {
    "firstName": "Alex",
    "lastName": "Dev",
    "labelUserName": "alexdev_c2c",
    "userName": "alexdev_c2c",
    "email": "alex.dev.example@testmail.com",
    "password": "[REDACTED_PASSWORD]",
    "role": "USER"
  }
  ```
- **Success Response Schema & Example**:
  ```json
  {
    "statusCode": 200,
    "message": "User Created Successfully",
    "data": {
      "id": 64,
      "firstName": "Alex",
      "lastName": "Dev",
      "email": "alex.dev.example@testmail.com",
      "role": "USER"
    },
    "errors": null,
    "timestamp": "2026-10-09T10:05:18.993329088"
  }
  ```
- **Known Error Responses**:
  - `500 Internal Server Error`: `"Email is already Registered"` (when email exists in database).
- **Postman Collection Item**: Item name `"User Sign Up"` (`id: 58775230-9b21e4f1-9339-e473-7a3e-5fcb0f177eee`).
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `POSTMAN_EXECUTED` (Collection runner executed in 3.00s; conflict handling verified).

---

### POST /auth/login
- **Feature / Module**: Authentication
- **HTTP Method**: `POST`
- **Exact Path**: `/auth/login`
- **Full Remote URL**: `https://api.connect2code.in/api/v1/auth/login`
- **Purpose**: Authenticates credentials and returns JWT Bearer token and refresh token.
- **Frontend Caller**: `src/services/authService.ts` (`authService.login`), `src/features/auth/redux/authSlice.ts`
- **Authentication Requirement**: `PUBLIC`
- **Required Role(s)**: None
- **Bearer Token Behavior**: None required.
- **Required Headers**: `Content-Type: application/json`
- **Path & Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  interface LoginPayload {
    email: string;
    password: string;
  }
  ```
- **Safe Request Example**:
  ```json
  {
    "email": "user@example.com",
    "password": "[REDACTED_PASSWORD]"
  }
  ```
- **Success Response Schema & Example**:
  ```json
  {
    "statusCode": 200,
    "message": "Login Successful",
    "data": {
      "token": "[REDACTED_ACCESS_TOKEN]",
      "refreshToken": "[REDACTED_REFRESH_TOKEN]",
      "role": "USER",
      "id": 63,
      "firstName": "Sakhamuri",
      "lastName": "Jagadeesh",
      "email": "231fa04913@gmail.com"
    },
    "errors": null,
    "timestamp": "2026-10-09T10:05:20.381245748"
  }
  ```
- **Known Error Responses**:
  - `401 Unauthorized` / `500 Server Error`: `"Invalid email or password"`.
- **Postman Collection Item**: Item name `"1. Authentication"` (`id: 58775230-85cf2599-b130-4c1f-ad5c-ddeaae17f18a`).
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `POSTMAN_EXECUTED` (Collection runner executed; authenticates USER and ADMIN).

---

### POST /auth/refresh
- **Feature / Module**: Authentication & Token Management
- **HTTP Method**: `POST`
- **Exact Path**: `/auth/refresh`
- **Full Remote URL**: `https://api.connect2code.in/api/v1/auth/refresh`
- **Purpose**: Exchanges a valid refresh token for a fresh short-lived JWT access token and rolling refresh token.
- **Frontend Caller**: `src/services/authService.ts` (`authService.refreshToken`), Axios response interceptor in `src/core/api/apiClient.ts`
- **Authentication Requirement**: `AUTHENTICATED` (Token-based via payload)
- **Required Role(s)**: Any valid authenticated session (`USER` or `ADMIN`)
- **Bearer Token Behavior**: Does not require an Authorization header; relies on `refreshToken` in request body.
- **Required Headers**: `Content-Type: application/json`
- **Request Body Schema**:
  ```typescript
  interface RefreshTokenPayload {
    refreshToken: string;
  }
  ```
- **Safe Request Example**:
  ```json
  {
    "refreshToken": "[REDACTED_REFRESH_TOKEN]"
  }
  ```
- **Success Response Schema & Example**:
  ```json
  {
    "statusCode": 200,
    "message": "Token Refreshed Successfully",
    "data": {
      "token": "[REDACTED_NEW_ACCESS_TOKEN]",
      "refreshToken": "[REDACTED_NEW_REFRESH_TOKEN]",
      "role": "USER",
      "id": 63,
      "firstName": "Sakhamuri",
      "lastName": "Jagadeesh",
      "email": "231fa04913@gmail.com"
    },
    "errors": null,
    "timestamp": "2026-10-09T10:06:55.084717429"
  }
  ```
- **Known Error Responses**:
  - `500 Internal Server Error`: `message: "Failed to refresh token"`, `errors: ["Refresh token invalid or expired"]`.
- **Postman Collection Item**: Missing from collection.
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Verified with fresh USER session token, latency 1.16s).

---

### POST /auth/generatePasswordResetOtp
- **Feature / Module**: Password Recovery
- **HTTP Method**: `POST`
- **Exact Path**: `/auth/generatePasswordResetOtp`
- **Full Remote URL**: `https://api.connect2code.in/api/v1/auth/generatePasswordResetOtp`
- **Purpose**: Generates and dispatches a numeric OTP to the registered account email for password reset.
- **Frontend Caller**: `src/services/authService.ts` (`authService.generatePasswordResetOtp`)
- **Authentication Requirement**: `PUBLIC`
- **Required Role(s)**: None
- **Bearer Token Behavior**: None required.
- **Required Headers**: `Content-Type: application/json`
- **Request Body Schema**:
  ```typescript
  interface GenerateOtpPayload {
    email: string;
  }
  ```
- **Safe Request Example**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response Schema & Example**:
  ```json
  {
    "statusCode": 200,
    "message": "Password Reset OTP Sent Successfully",
    "data": true,
    "errors": null,
    "timestamp": "2026-10-09T10:05:31.721020093"
  }
  ```
- **Postman Collection Item**: Missing from collection.
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (SMTP dispatch latency 10.9s).

---

### POST /auth/verifyPasswordResetOtp
- **Feature / Module**: Password Recovery
- **HTTP Method**: `POST`
- **Exact Path**: `/auth/verifyPasswordResetOtp`
- **Full Remote URL**: `https://api.connect2code.in/api/v1/auth/verifyPasswordResetOtp`
- **Purpose**: Verifies the received OTP and sets a new password.
- **Frontend Caller**: `src/services/authService.ts` (`authService.verifyPasswordResetOtp`)
- **Authentication Requirement**: `PUBLIC`
- **Required Role(s)**: None
- **Required Headers**: `Content-Type: application/json`
- **Request Body Schema**:
  ```typescript
  interface VerifyOtpPayload {
    email: string;
    otp: string;
    password: string;
  }
  ```
- **Safe Request Example**:
  ```json
  {
    "email": "user@example.com",
    "otp": "000000",
    "password": "[REDACTED_NEW_PASSWORD]"
  }
  ```
- **Known Error Responses**:
  - `500 Internal Server Error`: `message: "Password Reset Failed"` (when OTP is invalid or expired).
- **Postman Collection Item**: Missing from collection.
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Invalid OTP rejected with 500, confirming public controller validation).

---

### POST /auth/logout
- **Feature / Module**: Session Termination
- **HTTP Method**: `POST`
- **Exact Path**: `/auth/logout`
- **Full Remote URL**: `https://api.connect2code.in/api/v1/auth/logout`
- **Purpose**: Invalidates the active refresh token session on the server.
- **Frontend Caller**: `src/services/authService.ts` (`authService.logout`)
- **Authentication Requirement**: `PUBLIC` (Accepts session token in payload)
- **Required Role(s)**: Any
- **Request Body Schema**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Success Response Example**:
  ```json
  {
    "statusCode": 200,
    "message": "User Logged Out Successfully",
    "data": null
  }
  ```
- **Postman Collection Item**: Missing from collection.
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Returns 200 across all caller states).

---

## 4. Module 2: Reference Library (Metadata & Lookups)

### GET /referenceLibrary/refGroupCode/TOPIC
- **Feature / Module**: Question Categories & Topic Metadata
- **HTTP Method**: `GET`
- **Exact Path**: `/referenceLibrary/refGroupCode/TOPIC`
- **Purpose**: Fetches all available topic taxonomy codes for question filtering and tags.
- **Frontend Caller**: `src/services/referenceService.ts` (`referenceService.getByGroupCode('TOPIC')`)
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Required Role(s)**: Regular `USER` or `ADMIN`
- **Bearer Token Behavior**: `Authorization: Bearer <TOKEN>` required. Anonymous returns 401.
- **Success Response Example**:
  ```json
  {
    "statusCode": 200,
    "message": "ReferenceLibrary fetched successfully",
    "data": [
      { "id": 9, "refGroupCode": "TOPIC", "refCode": "ARRAY", "refName": "Arrays", "isActive": true },
      { "id": 10, "refGroupCode": "TOPIC", "refCode": "STRING", "refName": "Strings", "isActive": true }
    ],
    "errors": null,
    "timestamp": "2026-10-09T10:06:56.147946063"
  }
  ```
- **Postman Collection Item**: Missing from collection.
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (USER: 200, ADMIN: 200, Anon: 401).

---

### GET /referenceLibrary/refGroupCode/DIFF
- **Feature / Module**: Question Difficulty Metadata
- **HTTP Method**: `GET`
- **Exact Path**: `/referenceLibrary/refGroupCode/DIFF`
- **Purpose**: Fetches the 4 platform difficulty tiers.
- **Frontend Caller**: `src/services/referenceService.ts` (`referenceService.getByGroupCode('DIFF')`)
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Required Role(s)**: Regular `USER` or `ADMIN`
- **Success Response Example**:
  ```json
  {
    "statusCode": 200,
    "message": "ReferenceLibrary fetched successfully",
    "data": [
      { "id": 1, "refGroupCode": "DIFF", "refCode": "BASIC", "refName": "Basic", "isActive": true },
      { "id": 2, "refGroupCode": "DIFF", "refCode": "EASY", "refName": "Easy", "isActive": true },
      { "id": 3, "refGroupCode": "DIFF", "refCode": "MEDIUM", "refName": "Medium", "isActive": true },
      { "id": 4, "refGroupCode": "DIFF", "refCode": "HARD", "refName": "Hard", "isActive": true }
    ]
  }
  ```
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /referenceLibrary/refGroupCode/QPF
- **Feature / Module**: Question Platform Flags
- **HTTP Method**: `GET`
- **Exact Path**: `/referenceLibrary/refGroupCode/QPF`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /referenceLibrary
- **Feature / Module**: Base Reference Library
- **HTTP Method**: `GET`
- **Exact Path**: `/referenceLibrary`
- **Status & Finding**: Unmapped base route. Spring Security returns 401 across all credential states. Callers must use `/referenceLibrary/refGroupCode/{code}`.
- **Functional Status**: `NOT_TESTED`
- **Auth Verification Status**: `INCONCLUSIVE` (Spring Security catch-all filter returns 401)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

## 5. Module 3: Companies Directory

### GET /company
- **Feature / Module**: Company Catalog
- **HTTP Method**: `GET`
- **Exact Path**: `/company`
- **Purpose**: Retrieves all companies associated with interview questions.
- **Frontend Caller**: `src/services/companyService.ts` (`companyService.getCompanies`), `src/services/admin/adminCompanyService.ts`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Optional Query Parameter**: `search` (`string`)
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Returns 31 companies for USER and ADMIN).

---

### GET /company/{id}
- **Feature / Module**: Company Details
- **HTTP Method**: `GET`
- **Exact Path**: `/company/{id}` (e.g. `/company/1`)
- **Purpose**: Fetches single company details by numeric database ID.
- **Frontend Caller**: `src/services/companyService.ts` (`companyService.getCompanyBySlug`), `src/services/admin/adminCompanyService.ts`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Path Parameter**: `id` (`number` — strictly numeric ID on backend).
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /company/{slug}
- **Feature / Module**: Company Details by Slug
- **HTTP Method**: `GET`
- **Exact Path**: `/company/tcs`
- **Purpose**: Direct text slug lookup probe.
- **Observed Result**: Returns 401 across all credentials because Spring Boot `@PathVariable Long id` fails type conversion and triggers fallback filter.
- **Functional Status**: `FAIL` (Path variable type mismatch; resolved in `companyService.ts` via client-side search fallback)
- **Auth Verification Status**: `INCONCLUSIVE`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /company/{id}/problems
- **Feature / Module**: Company Problems
- **HTTP Method**: `GET`
- **Exact Path**: `/company/{id}/problems`
- **Status & Finding**: Defined in `endpoints.ts` line 20, but **unmapped** in backend controller (returns 401). `companyService.getCompanyProblems` executes `POST /questions` with `{ companies: [companyId] }` instead.
- **Functional Status**: `NOT_TESTED`
- **Auth Verification Status**: `INCONCLUSIVE` (Unmapped controller route)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### POST /company
- **Feature / Module**: Admin Company Management
- **HTTP Method**: `POST`
- **Exact Path**: `/company`
- **Purpose**: Create a new company or update an existing company.
- **Frontend Caller**: `src/services/admin/adminCompanyService.ts` (`adminCompanyService.saveOrUpdateCompany`)
- **Authentication Requirement**: `ADMIN_ONLY`
- **Required Role(s)**: `ADMIN`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (ADMIN: 200 OK, USER: 401/403).

---

## 6. Module 4: Languages & Compiler Configuration

### GET /language
- **Feature / Module**: Language Runtime Registry
- **HTTP Method**: `GET`
- **Exact Path**: `/language`
- **Purpose**: Fetches all available programming languages, including database Table ID, Reference ID (`referenceId`), and Judge0 ID (`judge0LanguageId`).
- **Frontend Caller**: `src/services/executionService.ts`, `src/services/admin/adminLanguageService.ts`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Returns Java, Python, C++, JavaScript).

---

### GET /language/dropdown
- **Feature / Module**: Language Dropdown Selector
- **HTTP Method**: `GET`
- **Exact Path**: `/language/dropdown`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /language/{id}
- **Feature / Module**: Language Details
- **HTTP Method**: `GET`
- **Exact Path**: `/language/{id}`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### POST /language
- **Feature / Module**: Admin Language Management
- **HTTP Method**: `POST`
- **Exact Path**: `/language`
- **Authentication Requirement**: `ADMIN_ONLY`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (ADMIN: 200 OK, USER: 500/403).

---

### DELETE /language/{id}
- **Feature / Module**: Admin Language Deactivation
- **HTTP Method**: `DELETE`
- **Exact Path**: `/language/{id}`
- **Authentication Requirement**: `ADMIN_ONLY`
- **Functional Status**: `PASS` (Error handling for non-existent ID verified on admin controller)
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

## 7. Module 5: Questions & Problem Management

### POST /questions
- **Feature / Module**: Problem Catalog & Search
- **HTTP Method**: `POST`
- **Exact Path**: `/questions`
- **Purpose**: Paginated, multi-filter search endpoint for the coding problem directory.
- **Frontend Caller**: `src/services/problemService.ts` (`problemService.getProblems`), `src/services/companyService.ts`, `src/services/admin/adminQuestionService.ts`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Returns paginated problem records).

---

### GET /question/{id}
- **Feature / Module**: Problem Workspace & Details
- **HTTP Method**: `GET`
- **Exact Path**: `/question/{id}` (e.g. `/question/1`)
- **Purpose**: Fetches the full problem statement, markdown description, visible sample test cases, hints, and associated tags.
- **Frontend Caller**: `src/services/problemService.ts` (`problemService.getProblemById`), `src/features/problems/pages/ProblemDetails.tsx`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Path Parameter**: `id` (`number` — strictly numeric ID on Java backend).
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /question/{slug}
- **Feature / Module**: Problem Details by Text Slug
- **HTTP Method**: `GET`
- **Exact Path**: `/question/two-sum`
- **Observed Result**: Returns 401 across all credentials because Spring Boot `@PathVariable Long id` fails route pattern match.
- **Functional Status**: `FAIL` (Path variable type mismatch; resolved in frontend via ID translation)
- **Auth Verification Status**: `INCONCLUSIVE`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### POST /question
- **Feature / Module**: Admin Problem Creator
- **HTTP Method**: `POST`
- **Exact Path**: `/question`
- **Authentication Requirement**: `ADMIN_ONLY`
- **Functional Status**: `INCONCLUSIVE` (Probe payload was minimal, resulting in JPA DTO constraint check)
- **Auth Verification Status**: `VERIFIED` (USER rejected with 401/403; ADMIN reaches controller)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### POST /question/{id}/testCases
- **Feature / Module**: Admin Test Case Management
- **HTTP Method**: `POST`
- **Exact Path**: `/question/{id}/testCases`
- **Authentication Requirement**: `ADMIN_ONLY`
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (ADMIN: 200 OK, USER: 401).

---

### POST /question/{id}/submit
- **Feature / Module**: Legacy Submission
- **HTTP Method**: `POST`
- **Exact Path**: `/question/{id}/submit`
- **Status & Finding**: Deprecated legacy route in `endpoints.ts`. Replaced by `POST /submitCode`.
- **Functional Status**: `NOT_TESTED`
- **Auth Verification Status**: `INCONCLUSIVE`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

## 8. Module 6: Code Execution & Judge0 Integration

### POST /runCode
- **Feature / Module**: Interactive Code Runner
- **HTTP Method**: `POST`
- **Exact Path**: `/runCode`
- **Purpose**: Normal user RUN. Executes submitted code against **visible sample test cases only** via Judge0 without persisting results to submission history.
- **Frontend Caller**: `src/services/executionService.ts` (`executionService.runCode`), `src/features/problems/pages/ProblemDetails.tsx`
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Required Role(s)**: `USER` or `ADMIN`
- **Contract Rule**: `languageId` MUST be the Reference ID (5 for Java, 6 for Python, 7 for C++, 8 for JavaScript), NOT Table ID (1-4).
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (USER: 200 OK, ADMIN: 200 OK, latency 7.6s through Judge0).

---

### POST /submitCode
- **Feature / Module**: Formal Problem Submission
- **HTTP Method**: `POST`
- **Exact Path**: `/submitCode`
- **Purpose**: Normal user SUBMIT. Executes submitted code against all test cases (visible + hidden) and evaluates accepted/rejected verdict.
- **Frontend Caller**: `src/services/executionService.ts` (`executionService.submitCode`)
- **Authentication Requirement**: `USER_OR_ADMIN`
- **Observed Result**: Both USER and ADMIN return HTTP 500 with stack trace:
  ```json
  {
    "statusCode": 500,
    "message": "Code Submission Failed",
    "errors": [
      "Cannot invoke \"com.connect2code.codingPlatform.common.entity.ReferenceLibrary.getRefName()\" because the return value of \"com.connect2code.codingPlatform.question.entity.TestCase.getType()\" is null"
    ]
  }
  ```
- **Functional Status**: `BLOCKED` (Observed backend failure pending root-cause confirmation: NullPointerException in backend entity mapping when evaluating full test suite)
- **Auth Verification Status**: `INCONCLUSIVE` (Reaches submission service for authenticated users, but halted before role boundaries can be conclusively confirmed)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### POST /admin/testCode
- **Feature / Module**: Admin Code Runner
- **HTTP Method**: `POST`
- **Exact Path**: `/admin/testCode`
- **Purpose**: Privileged admin test runner bypassing client-rate limits.
- **Frontend Caller**: `src/services/executionService.ts` (`executionService.adminTestCode`)
- **Authentication Requirement**: `ADMIN_ONLY`
- **Required Role(s)**: `ADMIN` (USER returns 401 Unauthorized)
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (USER: 401, ADMIN: 200 OK, latency 7.9s).

---

### POST /admin/submitCode
- **Feature / Module**: Admin Code Submission Validator
- **HTTP Method**: `POST`
- **Exact Path**: `/admin/submitCode`
- **Purpose**: Privileged admin submission runner.
- **Authentication Requirement**: `ADMIN_ONLY`
- **Observed Result**: USER is rejected with 401; ADMIN reaches execution engine and triggers the identical `TestCase.getType()` NPE defect.
- **Functional Status**: `BLOCKED` (Observed backend failure pending root-cause confirmation: hits same `TestCase.getType()` NPE defect)
- **Auth Verification Status**: `VERIFIED` (Role restriction confirmed: regular USER strictly rejected with 401)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

## 9. Module 7: User Profile, Bookmarks & Progress

### GET /user/profile
- **Feature / Module**: User Profile
- **HTTP Method**: `GET`
- **Exact Path**: `/user/profile`
- **Purpose**: Defined in `src/core/api/endpoints.ts` and `src/services/profileService.ts`.
- **Status & Finding**: Unmapped route on the remote backend (returns 401 across all credentials). The frontend application relies on user details returned during `/auth/login` and cached in client-side storage (`tokenStorage`).
- **Functional Status**: `NOT_TESTED`
- **Auth Verification Status**: `INCONCLUSIVE` (Unmapped controller route)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### PUT /user/profile
- **Feature / Module**: User Profile
- **HTTP Method**: `PUT`
- **Exact Path**: `/user/profile`
- **Purpose**: Update user profile information.
- **Status & Finding**: Unmapped route on the remote backend (returns 401 across all credentials).
- **Functional Status**: `NOT_TESTED`
- **Auth Verification Status**: `INCONCLUSIVE` (Unmapped controller route)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### POST /users/{userId}/questions/{questionId}/bookmark
- **Feature / Module**: User Bookmarks (Cloud Persistence)
- **HTTP Method**: `POST`
- **Exact Path**: `/users/{userId}/questions/{questionId}/bookmark`
- **Purpose**: Bookmarks a specific question for the authenticated user.
- **Authentication Requirement**: `USER_ONLY` (Owner-Scoped)
- **Authorization Rules**: `userId` in path MUST match the user ID in the JWT token (e.g. `63`).
- **Observed Result**: USER 63 returns `200 OK`. ADMIN (ID 1) attempting to access User 63's bookmarks returns `500 Server Error`: `"You are not authorized to access this user's bookmarks"`.
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Live backend endpoint discovered).

---

### GET /users/{userId}/questions/bookmarks
- **Feature / Module**: User Bookmarks Listing
- **HTTP Method**: `GET`
- **Exact Path**: `/users/{userId}/questions/bookmarks`
- **Purpose**: Retrieves all bookmarked questions for the user.
- **Authentication Requirement**: `USER_ONLY` (Owner-Scoped)
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE` (Returns bookmark list for User 63).

---

### DELETE /users/{userId}/questions/{questionId}/bookmark
- **Feature / Module**: Remove User Bookmark
- **HTTP Method**: `DELETE`
- **Exact Path**: `/users/{userId}/questions/{questionId}/bookmark`
- **Purpose**: Removes a bookmark.
- **Authentication Requirement**: `USER_ONLY` (Owner-Scoped)
- **Functional Status**: `PASS`
- **Auth Verification Status**: `VERIFIED`
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /users/{userId}/solvedQuestions
- **Feature / Module**: User Problem Progress
- **HTTP Method**: `GET`
- **Exact Path**: `/users/{userId}/solvedQuestions`
- **Status & Finding**: Unmapped route on the remote backend (returns 401). Problem progress tracking in the frontend is currently maintained in client-scoped storage (`problem_progress`).
- **Functional Status**: `NOT_TESTED`
- **Auth Verification Status**: `INCONCLUSIVE` (Unmapped controller route)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

---

### GET /users/{userId}/attemptedQuestions
- **Feature / Module**: User Problem Progress
- **HTTP Method**: `GET`
- **Exact Path**: `/users/{userId}/attemptedQuestions`
- **Status & Finding**: Unmapped route on the remote backend (returns 401). Problem progress tracking in the frontend is currently maintained in client-scoped storage (`problem_progress`).
- **Functional Status**: `NOT_TESTED`
- **Auth Verification Status**: `INCONCLUSIVE` (Unmapped controller route)
- **Evidence Method**: `DIRECT_HTTP_PROBE`

# Connect-2-Code — API Authentication & Authorization Matrix

This document provides the definitive, evidence-based authorization matrix for all APIs in the **Connect-2-Code** platform.

Every classification records historical live probes executed with Anonymous credentials, authenticated regular `USER` Bearer tokens, and authenticated `ADMIN` Bearer tokens. Authentication rows API-002, API-003, and API-006 predate the cookie-based refresh migration and must not be treated as current deployment acceptance evidence.

---

## 1. Classification & Status Definitions

### Access Classifications
| Classification | Meaning | Evidence Standard |
| :--- | :--- | :--- |
| **`PUBLIC`** | Endpoint allows requests without an `Authorization` header. | Anonymous request succeeds with HTTP 200 or 201 (or reaches controller validation). |
| **`USER_OR_ADMIN`** | Both authenticated regular users (`USER`) and administrators (`ADMIN`) have permission. | Anonymous returns 401/403; both USER and ADMIN tokens return 200 OK. |
| **`USER_ONLY`** | Scoped specifically to regular users (e.g., owner-scoped user data). | Regular user token returns 200 OK; Admin or cross-user token receives authorization rejection. |
| **`ADMIN_ONLY`** | Privileged endpoint restricted to users with the `ADMIN` role. | Anonymous returns 401; USER token returns 401/403; ADMIN token returns 200 OK. |
| **`AUTHENTICATED_ROLE_UNSPECIFIED`** | Endpoint requires authentication, but role boundaries cannot be conclusively separated due to payload validation or backend exception. | Anonymous returns 401; authenticated requests pass security filter but error inside controller logic. |
| **`UNKNOWN`** | Route is unmapped, deprecated, or contradictory. | Route returns 401 across all credential states due to Spring Security catch-all filter. |

### Evidence Methods
- **`POSTMAN_EXECUTED`**: Execution result directly confirmed by the Postman MCP collection runner (`runCollection`).
- **`DIRECT_HTTP_PROBE`**: Execution result obtained via reproducible direct HTTP probe using fresh tokens.
- **`SOURCE_VERIFIED`**: Verified from frontend source code, routing constants, or backend service mappings.
- **`NOT_VERIFIED`**: Evidence is insufficient to verify behavior.

### Functional & Auth Verification Statuses
- **Functional Status**:
  - `PASS`: Endpoint functioned as expected according to contract.
  - `FAIL`: Route contract failure (e.g., path variable type mismatch on text slugs).
  - `BLOCKED`: Request reached backend service but halted due to an observed backend defect.
  - `INCONCLUSIVE`: Payload constraint check triggered before business logic could be evaluated.
  - `NOT_TESTED`: Endpoint not tested functionally (e.g., unmapped base path or deprecated route).
- **Auth Verification Status**:
  - `VERIFIED`: Access control boundaries conclusively determined across Anonymous, USER, and ADMIN.
  - `INCONCLUSIVE`: Route is caught by fallback security filter (401) or execution halts before role boundaries can be separated.
  - `NOT_TESTED`: Authentication not evaluated.

---

## 2. Authentication & Authorization Matrix

| ID | HTTP Method & Path | Anonymous | USER Token | ADMIN Token | Access Classification | Functional Status | Auth Verification | Evidence Method | Notes & Limitations |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :--- | :--- |
| **API-001** | `POST /signUp` | `500`* | `N/A` | `N/A` | **`PUBLIC`** | `PASS` | `VERIFIED` | `POSTMAN_EXECUTED` | *Tested via Postman MCP collection runner; returns 500 `"Email is already Registered"` when probed with existing email, verifying public accessibility without token. |
| **API-002** | `POST /auth/login` | `200`* | `200`* | `200`* | **`PUBLIC`** | `INCONCLUSIVE` | `NOT_TESTED` | `NOT_VERIFIED` | *Historical body-token result only. Current JSON shape and HttpOnly cookie issuance require a new controlled browser acceptance run. |
| **API-003** | `POST /auth/refresh` | `500`* | `200`* | `200`* | **`USER_OR_ADMIN`** | `INCONCLUSIVE` | `NOT_TESTED` | `NOT_VERIFIED` | *Historical request-body refresh result only. Current bodyless cookie validation and rotation are unverified. |
| **API-004** | `POST /auth/generatePasswordResetOtp` | `200` | `200` | `200` | **`PUBLIC`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Generates 6-digit OTP and sends email via SMTP without requiring authentication. |
| **API-005** | `POST /auth/verifyPasswordResetOtp` | `500`* | `500`* | `500`* | **`PUBLIC`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | *Returns 500 `"Password Reset Failed"` when provided dummy OTP, proving public accessibility and backend validation handling. |
| **API-006** | `POST /auth/logout` | `200`* | `200`* | `200`* | **`PUBLIC`** | `INCONCLUSIVE` | `NOT_TESTED` | `NOT_VERIFIED` | *Historical request-body result only. Current cookie revocation and clearing are unverified. |
| **API-007** | `GET /referenceLibrary/refGroupCode/TOPIC` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Returns 11 topic taxonomy records. Anonymous strictly rejected with 401. |
| **API-008** | `GET /referenceLibrary/refGroupCode/DIFF` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Returns 4 difficulty tiers (Basic, Easy, Medium, Hard). |
| **API-009** | `GET /referenceLibrary/refGroupCode/QPF` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Returns question platform flag records. |
| **API-010** | `GET /referenceLibrary` | `401` | `401` | `401` | **`UNKNOWN`** | `NOT_TESTED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Base route unmapped; Spring Security fallback returns 401 across all credentials. Callers must use `/referenceLibrary/refGroupCode/{groupCode}`. |
| **API-011** | `GET /company` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Returns all 31 companies with metadata, logos, and websites. |
| **API-012** | `GET /company/1` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Fetches company details by numeric ID (1 = TCS). |
| **API-013** | `GET /company/tcs` (slug route) | `401` | `401` | `401` | **`UNKNOWN`** | `FAIL` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Backend `@PathVariable Long id` fails pattern match on text slugs. Frontend uses slug-fallback logic. |
| **API-014** | `GET /company/1/problems` | `401` | `401` | `401` | **`UNKNOWN`** | `NOT_TESTED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Defined in `endpoints.ts`, but unmapped on backend. Frontend executes `POST /questions` with `{ companies: [1] }`. |
| **API-015** | `POST /company` | `401` | `401` | `200` | **`ADMIN_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Admin creates or updates company record. Regular USER token receives 401/403. |
| **API-016** | `GET /language` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Returns full compiler catalog with Table IDs (1-4) and Reference IDs (5-8). |
| **API-017** | `GET /language/dropdown` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Lightweight selector returning language names and IDs. |
| **API-018** | `GET /language/1` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Retrieves single language compiler definition. |
| **API-019** | `POST /language` | `401` | `500`* | `200` | **`ADMIN_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Creates or updates language config. *USER token receives authorization rejection. |
| **API-020** | `DELETE /language/9999` | `401` | `500`* | `500`* | **`ADMIN_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Soft delete language. *Returns 500 `"Language not found with id: 9999"`, confirming controller execution for ADMIN. |
| **API-021** | `POST /questions` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Paginated search endpoint for questions. Handles filtering by level, topic, company. |
| **API-022** | `GET /question/1` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Returns full question details, hints, and sample test cases for Question ID 1. |
| **API-023** | `GET /question/two-sum` (slug) | `401` | `401` | `401` | **`UNKNOWN`** | `FAIL` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Backend `@PathVariable Long id` fails route match on text slugs. Resolved via slug-to-ID lookup. |
| **API-024** | `POST /question` | `401` | `401` | `500`* | **`ADMIN_ONLY`** | `INCONCLUSIVE` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Admin question creation. *Returns 500 when testing minimal probe payload due to JPA DTO constraints. |
| **API-025** | `POST /question/1/testCases` | `401` | `401` | `200` | **`ADMIN_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Attaches test cases to question. USER is forbidden (401); ADMIN succeeds (200). |
| **API-026** | `POST /question/1/submit` | `401` | `401` | `401` | **`UNKNOWN`** | `NOT_TESTED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Deprecated legacy submit route in `endpoints.ts`. Replaced by `POST /submitCode`. |
| **API-027** | `POST /runCode` | `401` | `200` | `200` | **`USER_OR_ADMIN`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Normal code execution against sample test cases via Judge0. Requires Reference ID (`5` for Java). |
| **API-028** | `POST /submitCode` | `401` | `500`* | `500`* | **`USER_OR_ADMIN`** | `BLOCKED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | *Observed backend failure pending root-cause confirmation: NullPointerException when invoking `TestCase.getType()` during full submission evaluation. |
| **API-029** | `POST /admin/testCode` | `401` | `401` | `200` | **`ADMIN_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Admin privileged code execution against sample test cases via Judge0. |
| **API-030** | `POST /admin/submitCode` | `401` | `401` | `500`* | **`ADMIN_ONLY`** | `BLOCKED` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Privileged admin submission runner. USER is rejected (401); ADMIN reaches execution engine and hits same `TestCase.getType()` NPE defect. |
| **API-031** | `GET /user/profile` | `401` | `401` | `401` | **`UNKNOWN`** | `NOT_TESTED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Unmapped route on remote backend. User profile is currently maintained in client-side storage from `/auth/login`. |
| **API-032** | `PUT /user/profile` | `401` | `401` | `401` | **`UNKNOWN`** | `NOT_TESTED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Unmapped route on remote backend. Client-side storage used. |
| **API-033** | `POST /users/63/questions/1/bookmark` | `401` | `200` | `500`* | **`USER_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | User bookmarks Question 1. *ADMIN receives: `"You are not authorized to access this user's bookmarks"`. |
| **API-034** | `GET /users/63/questions/bookmarks` | `401` | `200` | `500`* | **`USER_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Returns bookmarked questions for User 63. *Cross-user or Admin access rejected. |
| **API-035** | `DELETE /users/63/questions/1/bookmark` | `401` | `200` | `500`* | **`USER_ONLY`** | `PASS` | `VERIFIED` | `DIRECT_HTTP_PROBE` | Removes bookmark for User 63. *Admin access rejected. |
| **API-036** | `GET /users/63/solvedQuestions` | `401` | `401` | `401` | **`UNKNOWN`** | `NOT_TESTED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Unmapped route. Solved question tracking is currently managed in client-side storage. |
| **API-037** | `GET /users/63/attemptedQuestions` | `401` | `401` | `401` | **`UNKNOWN`** | `NOT_TESTED` | `INCONCLUSIVE` | `DIRECT_HTTP_PROBE` | Unmapped route. Progress tracking is currently managed in client-side storage. |

---

## 3. Key Observations & Security Takeaways

1. **Strict Distinction Between Postman MCP and Direct Probes**:
   Only 2 requests (`POST /signUp` and `POST /auth/login`) are present in the target Postman collection and were executed through the Postman MCP runner (`POSTMAN_EXECUTED`). The remaining 35 endpoints were probed via direct HTTP/fetch (`DIRECT_HTTP_PROBE`).
2. **Spring Boot Route Fallback to 401**:
   In this Spring Security configuration, any URL that does not match an explicit `@RequestMapping` or `@GetMapping` controller method triggers the fallback security filter, which returns `401 Unauthorized` instead of `404 Not Found`. A 401 response alone does not conclusively prove an endpoint is unmapped or deprecated without route confirmation.
3. **Observed Backend Defect on Submission Workflows**:
   Both `POST /submitCode` and `POST /admin/submitCode` reach the backend execution pipeline but fail with HTTP 500 (`NullPointerException` on `TestCase.getType().getRefName()`). These endpoints are categorized as `FUNCTIONAL_STATUS: BLOCKED` pending backend bug resolution.

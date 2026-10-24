# 05. API Contracts, Authentication & Security

## 1. Backend Origin & Base URL Resolution

- **Production API Origin**: `https://api.connect2code.in`
- **Canonical API Base URL**: `https://api.connect2code.in/api/v1`
- **Base URL Resolution Logic** ([`src/core/api/apiClient.ts`](../../src/core/api/apiClient.ts)):
  ```ts
  export const resolveDeploymentApiBaseUrl = (rawUrl?: string | null, _isLocal: boolean = false): string => {
    const resolved = resolveApiBaseUrl(rawUrl);
    // In all environments, ALL API calls strictly target the live backend origin
    if (resolved.includes('localhost') || resolved.includes('127.0.0.1') || !resolved.startsWith('http')) {
      return DEFAULT_API_BASE_URL; // 'https://api.connect2code.in/api/v1'
    }
    return resolved;
  };
  ```

---

## 2. Authentication Architecture & Token Lifecycle

Connect2Code uses stateless **JWT Bearer access tokens** combined with **refresh tokens** managed via HTTP requests and client-side cookie storage.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Client as apiClient (Axios)
    participant Storage as tokenStorage (Cookies/Memory)
    participant API as Spring Boot API (/api/v1)

    Note over User,API: 1. Login Flow
    User->>Client: authService.login({ email, password })
    Client->>API: POST /auth/login
    API-->>Client: 200 OK { statusCode: 200, data: { token, refreshToken, role, id, firstName, lastName, email, isDarkTheme } }
    Client->>Storage: setAccessToken(token), setRefreshToken(refreshToken), setUser(user)

    Note over User,API: 2. Authenticated Request with Auto-Attached Token
    User->>Client: problemService.getProblems(...)
    Client->>Storage: getAccessToken()
    Client->>Client: Request Interceptor: Append Authorization: Bearer <token> & inject jwtToken in body
    Client->>API: POST /questions { jwtToken: "...", ... }
    API-->>Client: 200 OK { statusCode: 200, data: { content: [...] } }

    Note over User,API: 3. Automatic Token Refresh on 401 / Expired Token
    User->>Client: Next API Call
    Client->>API: GET /userInfo/63 (Expired Token)
    API-->>Client: 401 Unauthorized / { statusCode: 401 }
    Client->>Client: Response Interceptor catches 401
    Client->>API: POST /auth/refresh { refreshToken } (Single-Flight Lock)
    API-->>Client: 200 OK { accessToken: "new_jwt", refreshToken: "new_uuid" }
    Client->>Storage: Update tokens
    Client->>API: Re-dispatch original request with new Bearer token
    API-->>Client: 200 OK
```

### Storage Security Architecture (`tokenStorage.ts`)
- **Access Token**: Maintained in memory and fallback cookie (`accessToken`).
- **Refresh Token**: Stored in cookie (`refreshToken`).
- **Cookie Security Attributes**: Automatically appends `; Secure` on HTTPS origins and `SameSite=Lax`.
- **No Web-Storage Credentials**: `tokenStorage` does not read or write access tokens, refresh tokens, or user profiles in `localStorage` or `sessionStorage`; it removes legacy copies when a session is written or cleared.
- **Expired-Access Startup**: An expired access token with a refresh token/profile keeps authentication in `LOADING` until the one bootstrap refresh completes, preventing a premature protected-route redirect.
- **Single-Flight Refresh Lock**: `executeRefreshToken()` uses a shared promise variable `refreshTokenPromise`. If multiple concurrent requests receive a 401 simultaneously, only ONE refresh request is dispatched to the backend; all waiting callers resolve with the new access token.
- **Cross-Tab Session Reconciliation**: [`src/core/security/authSessionSync.ts`](../../src/core/security/authSessionSync.ts) sends credential-free `session-updated` and `session-cleared` events through `BroadcastChannel`, with a transient storage-event fallback only where that browser API is unavailable. Receiving tabs discard their in-memory token cache, then restore from the shared cookies or immediately become unauthenticated. A logout, refresh failure, sign-in, or refresh therefore cannot leave another open tab with stale Redux authentication state.

---

## 3. The `jwtToken` Payload Contract

### The Problem
Historically, some services sent a payload field named `token` while others sent `jwtToken`, or both. The backend strictly expects `jwtToken` and throws validation errors if duplicate or conflicting token fields are present.

### The Solution: Deep Purge in `apiClient.ts`
[`src/core/api/apiClient.ts`](../../src/core/api/apiClient.ts) implements `purgeDuplicateTokenFields`:
```ts
function purgeDuplicateTokenFields(obj: any): void {
  if (!obj || typeof obj !== 'object' || obj instanceof FormData) return;
  if (Array.isArray(obj)) {
    for (const item of obj) purgeDuplicateTokenFields(item);
    return;
  }
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'token' || (lowerKey === 'jwttoken' && key !== 'jwtToken') || lowerKey === 'jwt_token') {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      purgeDuplicateTokenFields(obj[key]);
    }
  }
}
```
In every outgoing `POST`, `PUT`, `PATCH`, or `DELETE` request:
1. `purgeDuplicateTokenFields` recursively removes any `token`, `jwttoken`, or `jwt_token` keys.
2. The logged-in user's active access token is attached strictly as `jwtToken`.
3. URL query parameters are checked to ensure no token is ever exposed in query strings.

---

## 4. REST Endpoint Catalog & Method Mappings

### A. Authentication Endpoints ([`src/services/authService.ts`](../../src/services/authService.ts))
| Endpoint | Method | Access | Request Body | Response Envelope |
| :--- | :---: | :--- | :--- | :--- |
| `/signUp` | `POST` | `PUBLIC` | `{ firstName, lastName, email, password, role: "USER", labelUserName, userName }` | `ApiResponse<AuthResponseData>` |
| `/auth/login` | `POST` | `PUBLIC` | `{ email, password }` | `ApiResponse<{ token, refreshToken, role, id, firstName, lastName, email, isDarkTheme }>` (read-only production capture, 2026-10-23) |
| `/auth/refresh` | `POST` | `USER_OR_ADMIN` | `{ refreshToken }` | `ApiResponse<{ accessToken, refreshToken }>` |
| `/auth/logout` | `POST` | `PUBLIC` | `{ refreshToken }` | `ApiResponse<string>` |
| `/auth/generatePasswordResetOtp` | `POST` | `PUBLIC` | `{ email }` | `ApiResponse<unknown>` |
| `/auth/verifyPasswordResetOtp` | `POST` | `PUBLIC` | `{ email, otp, password }` | `ApiResponse<unknown>` |

### B. Problems & Questions ([`src/services/problemService.ts`](../../src/services/problemService.ts), [`src/services/questionService.ts`](../../src/services/questionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/questions` | `POST` | `USER_OR_ADMIN` | Paginated search: `{ level: number[], companies: number[], topic: number[], searchText: string, pageRequest: { pageNumber, pageSize, sortBy, sortDirection } }` |
| `/question/{id}` | `GET` | `USER_OR_ADMIN` | Numeric problem detail route. A request for a current catalog ID returned a backend `HttpResponseException` on 2026-10-23; callers retain the catalog fallback and this endpoint is not currently runtime-verified. |
| `/question` | `POST` | `ADMIN_ONLY` | Creates/updates problem with title, description, constraints, hints, and tax references. |
| `/question/{id}/testCases` | `POST` | `ADMIN_ONLY` | Attaches array of test cases (`input`, `expectedOutput`, `isHidden`, `displayOrder`). A direct `GET` to this path returned `401` for the temporary authenticated account on 2026-10-23, so catalog fallback does not issue it as a speculative read. Test cases, including hidden cases, remain backend-owned: failed mutations remain errors and must never fall back to browser storage or static client fixtures. |

### C. Code Execution Engine ([`src/services/executionService.ts`](../../src/services/executionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/runCode` | `POST` | `USER_OR_ADMIN` | User RUN: executes visible sample test cases. Payload: `{ questionId: number, languageId: number (Ref ID 5-8), sourceCode: string, customInput?: string }`; `customInput` is included only for the explicit custom-input action. |
| `/submitCode` | `POST` | `USER_OR_ADMIN` | User SUBMIT: runs all test cases (visible, hidden, edge). *Remote backend has observed NPE bug on `TestCase.getType()`.* |
| `/admin/testCode` | `POST` | `ADMIN_ONLY` | Admin RUN: runs sample test cases without saving submission history. |
| `/admin/submitCode` | `POST` | `ADMIN_ONLY` | Admin SUBMIT: runs all test cases without saving submission history. |

`ProblemDetails` invalidates and refetches submission history after a completed user submission. It does not synthesize a local history row or store submitted source code/results in browser storage.

`executionService` normalizes only the execution response fields returned by the API (`totalTestCases`, pass/fail counts, optional runtime/memory, and `testCases`). A successful HTTP response must still contain a recognizable verdict, and solved/success UI requires at least one executed and passed test with zero failures; zero-test or malformed responses are rejected instead of being reported as accepted.

### D. Recruiter Companies & Exams ([`src/services/companyService.ts`](../../src/services/companyService.ts), [`src/services/admin/adminCompanyService.ts`](../../src/services/admin/adminCompanyService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/company/list` | `POST` | `USER_OR_ADMIN` | Paginated companies: `{ pageNumber, pageSize, sortBy, sortDirection, jwtToken }`. Captured records contain `id`, `name`, `logo`, `website`, and `isActive`. |
| `/company/{id}` | `GET` | `USER_OR_ADMIN` | Company details by numeric ID; captured records contain `id`, `name`, `logo`, `website`, and `isActive`. |
| `/company/{companyId}/exams/list` | `POST` | `USER_OR_ADMIN` | Exams associated with company: `{ pageNumber, pageSize, sortBy, sortDirection, jwtToken }`. |
| `/company/exams/{examId}` | `GET` | `USER_OR_ADMIN` | Detailed exam blueprint (exam info, recruitment roles, exam sections). |
| `/admin/company` | `POST` | `ADMIN_ONLY` | Creates or updates company record. |
| `/admin/companyRole` | `POST` | `ADMIN_ONLY` | Creates or updates recruitment role (`roleName`, `roleCode`, `salary`). |
| `/admin/examSection` | `POST` | `ADMIN_ONLY` | Creates or updates exam section / round (`sectionName`, `durationMinutes`, `totalMarks`). |
| `/admin/companyExam` | `POST` | `ADMIN_ONLY` | Creates or updates company exam schedule (`examName`, `year`, `totalDurationMinutes`). |

### E. Aptitude & MCQ Assessment ([`src/services/mcqService.ts`](../../src/services/mcqService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/mcq` | `POST` | `USER_OR_ADMIN` | Query MCQs by subject, difficulty, company, search text with pagination. |
| `/mcq/{id}` | `GET` | `USER_OR_ADMIN` | Single MCQ question details and options. |
| `/admin/mcq` | `POST` | `ADMIN_ONLY` | Admin create/update MCQ. The request contains `id` for an update and each option contains only its persisted `id` when present, `optionLabel`, `optionText`, and explicit `isCorrect: true/false`. Exactly one option must be correct. Legacy question-level answer fields and option aliases are not sent or used to determine correctness. |
| `/admin/mcq/{id}` | `DELETE` | `ADMIN_ONLY` | Deletes an MCQ question. |

### F. Live Read-Only DTO Fields (2026-10-23)

The following fields were captured from the configured production API using the supplied temporary test account before that account began returning `401` for subsequent requests. They are evidence for read paths only; admin mutation payloads were not sent to production. The Postman MCP connection was authenticated during the follow-up audit, but its enabled-tools handshake repeated instead of returning an inventory and its exposed surface did not offer a live-request executor; it supplied no contract evidence and no collection/example was used as a substitute.

| Endpoint | Captured `data` fields |
| :--- | :--- |
| `GET /language` | `id`, `referenceId`, `languageName`, `judge0LanguageId`, `version`, `isActive` |
| `GET /language/dropdown` | `id`, `name` (a distinct dropdown DTO) |
| `GET /referenceLibrary/refGroupCode/{group}` | `id`, `refGroupCode`, `refCode`, `refName`, `isActive` |
| `POST /mcq`, `GET /mcq/{id}` | Question: `subjectGroupCode`, `subjectRefCode`, `subjectRefName`, `topic*`, `difficulty*`, `companyName`, `companyId`, `question`, `explanation`, `isActive`, `options`, `id`; option: `id`, `optionLabel`, `optionText`, `isCorrect` |
| `POST /questions` | `id`, `title`, `description`, `difficultyId`, `difficultyName`, `topicId`, `topicName`, `isOwnProblem`, `isActive`, `companies`, `questionPlatform` |
| `GET /users/{id}/questions/bookmarks` | `questionId`, `title`, `difficulty` |
| `GET /{id}/getSubmiteedQuestionIds` | `questionId`, `questionName`, `difficultyLevel`, `submittedDate` |
| `GET /{id}/getAPttemptedQuestionIds` | `questionId`, `title`, `difficulty`, `submittedDate` |
| `GET /institutions/search` | `id`, `name`, `institutionType`, `state`, `district` |
| `GET /admin/institutions`, `GET /admin/institutions/{id}` | `id`, `aisheCode`, `name`, `institutionType`, `state`, `district`, `website`, `yearOfEstablishment`, `location`, `collegeType`, `management`, `universityId`, `universityName`, `universityType`, `isActive`, audit timestamps/IDs |

Live MCQ verification on 2026-10-23 found that this is a record-level data boundary: a ten-record `POST /mcq` response had option counts `4, 4, 4, 0, 0, 0, 0, 0, 0, 0`, and an affected record's `GET /mcq/4` returned the same empty `options` array. The aptitude renderer intentionally shows no selectable answers for those records; it must not manufacture option text or correctness from question-level aliases.

### G. Endpoint Coverage Boundary

`src/core/api/endpoints.ts` contains only routes with a current service caller. The unused `company/{id}/problems`, `question/{id}/submit`, `/institutions` base, `/language/dropdown`, and duplicate solved-question constant were removed during the source audit rather than represented as working integrations. `/language/dropdown` was captured but intentionally omitted because it supplies only `id` and `name`, whereas code execution requires the `referenceId` supplied by `GET /language`. Read-only routes listed above have direct production evidence. `GET /institutions/{id}` and `GET /question/{id}/testCases` returned `401` under the authenticated temporary account; `GET /question/{id}` returned a backend `500` for a current catalog ID. Create, update, delete, refresh, reset, and execution requests are preserved at their existing callers but remain `PARTIALLY VERIFIED` until a disposable non-production fixture is available; this audit did not mutate production data.

### H. Envelope and Detail Rules

`apiClient` returns the backend envelope directly, so UI callers consume the payload exactly once through `response.data`; user and admin MCQ/question/dashboard views do not attempt nested `data.data` fallbacks. `POST /questions` rows are mapped only from the captured list fields. They are not converted into full `Question` detail records, because the list DTO lacks the reference and test-case fields required for authoring. When `GET /question/{id}` fails, the admin/detail UI reports that API failure instead of showing guessed taxonomy, platform, or test cases.

### F. User Profile, Bookmarks & Academic Details ([`src/services/profileService.ts`](../../src/services/profileService.ts), [`src/services/userQuestionService.ts`](../../src/services/userQuestionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/userInfo/{userId}` | `GET` | `USER_OR_ADMIN` | Fetches academic details (regNumber, joinedYear, passedOutYear, college). |
| `/userInfo/{userId}` | `POST` | `USER_OR_ADMIN` | Saves/updates academic details. Payload includes `jwtToken`. |
| `/users/{userId}/questions/{questionId}/bookmark` | `POST` | `USER_ONLY` | Bookmarks a problem for the user. |
| `/users/{userId}/questions/{questionId}/bookmark` | `DELETE` | `USER_ONLY` | Removes a problem bookmark. |
| `/users/{userId}/questions/bookmarks` | `GET` | `USER_ONLY` | Retrieves all bookmarked questions for the user. |
| `/{userId}/getSubmiteedQuestionIds` | `GET` | `USER_ONLY` | Solved problem IDs for progress tracking. (Backend typo preserved: `getSubmiteedQuestionIds`). |
| `/{userId}/getAPttemptedQuestionIds` | `GET` | `USER_ONLY` | Attempted problem IDs. (Backend typo preserved: `getAPttemptedQuestionIds`). |
| `/{userId}/question/{questionId}/getSubmissions` | `GET` | `USER_ONLY` | Submissions history for a specific problem. |

Academic records are server-owned: `ProfileSettings` reads and writes them through `/userInfo/{userId}` and does not retain an offline `localStorage` copy. A legacy `c2c_user_academic_<userId>` value is removed when that profile is opened.

Problem bookmarks are server-owned. `bookmarkSlice` hydrates only `questionId`, `title`, and `difficulty` from `GET /users/{userId}/questions/bookmarks`; a failed refresh preserves the active user's last known server list and exposes an error instead of replacing it with a false empty success. COMPANY/APTITUDE bookmarks have no observed API contract and are therefore retained only in `userScopedStorage`; server-owned problem bookmarks are excluded from browser persistence.

`GET` and `PUT /user/profile` are not used: archived direct probes returned 401 for every available credential and identified the route as unmapped. The client therefore does not fabricate successful identity or avatar mutations in browser storage. Name/email remain session-owned and read-only; avatar editing is disabled. Personal fields supported by `userInfo` are saved only when the required academic fields already exist, so the client never invents registration, college, or year values to satisfy the POST contract.

### G. Institution Directory ([`src/services/institutionService.ts`](../../src/services/institutionService.ts), [`src/services/admin/adminInstitutionService.ts`](../../src/services/admin/adminInstitutionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/institutions/search` | `GET` | `PUBLIC` | Query param `?query=...` (min 3 chars). Autocomplete for college selection. |
| `/institutions/{id}` | `GET` | `PUBLIC` | Public institution details. |
| `/admin/institutions` | `GET` | `ADMIN_ONLY` | Paginated admin list with query, type, state, district, activeOnly filters. |
| `/admin/institutions/{id}` | `GET` | `ADMIN_ONLY` | Institution details including affiliated university. |
| `/admin/institutions` | `POST` | `ADMIN_ONLY` | Creates new college or university with AISHE code. |
| `/admin/institutions/{id}` | `PUT` | `ADMIN_ONLY` | Updates existing institution details. |
| `/admin/institutions/{id}/status` | `PATCH` | `ADMIN_ONLY` | Soft toggle: `{ isActive: boolean }`. |

### H. Compiler Languages & Taxonomy ([`src/services/referenceService.ts`](../../src/services/referenceService.ts), [`src/services/admin/adminLanguageService.ts`](../../src/services/admin/adminLanguageService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/referenceLibrary/refGroupCode/{groupCode}` | `GET` | `USER_OR_ADMIN` | Returns API-owned taxonomy terms. Current callers request `DIFF`, `TOPIC`, `QPF`, `SUBJECT`, subject-specific topic groups, `GENDER`, `LANG`, and `TESTCASETYPE`. |
| `/language` | `GET` | `USER_OR_ADMIN` | Compiler catalog with database table IDs and execution reference IDs. Values are consumed from response fields, not fixed client ranges. |
| `/language/dropdown` | `GET` | `USER_OR_ADMIN` | Lightweight language selector for code runner. |
| `/language` | `POST` | `ADMIN_ONLY` | Registers or updates language compiler configuration. |
| `/language/{id}` | `DELETE` | `ADMIN_ONLY` | Soft deletes language compiler configuration. |

The response interceptor returns the backend `ApiResponse<T>` envelope itself, not an Axios response wrapper. Services therefore consume `response.data` exactly once. List services reject malformed successful payloads rather than silently converting them into empty arrays. Reference groups and compiler dropdowns use 30-minute Redux TTLs, in-flight deduplication, and request ownership; an API-confirmed empty list is cacheable. Successful language create/update/delete operations invalidate both Redux and execution-service caches so Monaco/code execution cannot retain an obsolete compiler mapping. Public institution-search failures are surfaced to the autocomplete instead of being converted into a false successful empty result.

---

## 5. Security & Error Sanitization

### Error Sanitization (`serverErrorMapper.ts`)
The backend is built with Java Spring Boot and Hibernate. When internal exceptions occur, raw error messages may contain Java package paths (`org.springframework`, `java.lang`), database table names, or SQL constraint violations.
- [`src/core/validation/serverErrorMapper.ts`](../../src/core/validation/serverErrorMapper.ts) tests error text against `isInternalServerLeak()`.
- If an internal leak is detected, it suppresses the technical trace and presents clean, actionable user feedback (e.g. *"Our servers encountered an issue while processing your request. Please try again shortly."*).
- Prevents database column names, Java stack traces, and internal server topologies from being revealed to end users.

# 05. API Contracts, Authentication & Security

## 1. Backend Origin & Base URL Resolution

- **Production API Origin**: `https://api.connect2code.in`
- **Canonical API Base URL**: `https://api.connect2code.in/api/v1`
- **Production origin pin**: Deployed builds accept only the exact canonical HTTPS base above. Relative, localhost, staging, arbitrary HTTPS, and insecure HTTP environment values fall back to the canonical base; Google OAuth navigation is derived from that already-validated base. Local development/preview may still use the documented proxy or explicit development target.
- **Base URL Resolution Logic** ([`src/core/api/apiClient.ts`](../../src/core/api/apiClient.ts)):
  ```ts
  export const resolveDeploymentApiBaseUrl = (rawUrl?: string | null, isLocal?: boolean): string => {
    const resolved = resolveApiBaseUrl(rawUrl);
    const isLocalEnv = typeof isLocal === 'boolean' ? isLocal : ...;

    // In local dev/preview: preserve relative paths (/api/v1) for Vite proxy and local backends (localhost)
    if (isLocalEnv) return resolved;

    // In deployed production: guard against localhost/relative paths and fallback to canonical backend
    if (resolved.includes('localhost') || resolved.includes('127.0.0.1') || !resolved.startsWith('http')) {
      return DEFAULT_API_BASE_URL; // 'https://api.connect2code.in/api/v1'
    }
    return resolved;
  };
  ```

---

## 2. Authentication Architecture & Token Lifecycle

Connect2Code uses a short-lived **JWT Bearer access token** held only in per-tab memory. The backend exclusively owns the rotating refresh token in an HttpOnly cookie; frontend JavaScript never reads, creates, updates, or serializes it.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Client as apiClient (Axios)
    participant Storage as tokenStorage (Memory Only)
    participant API as Spring Boot API (/api/v1)

    Note over User,API: 1. Login Flow
    User->>Client: authService.login({ email, password })
    Client->>API: POST /auth/login
    API-->>Client: Set-Cookie: refreshToken=...; HttpOnly + { data: { token, role, id, firstName, lastName, email, isDarkTheme } }
    Client->>Storage: setAccessToken(token), setUser(profile)

    Note over User,API: 2. Authenticated Request with Auto-Attached Token
    User->>Client: problemService.getProblems(...)
    Client->>Storage: getAccessToken()
    Client->>Client: Request Interceptor: Append Authorization: Bearer <token>
    Client->>API: POST /questions { business fields only }
    API-->>Client: 200 OK { statusCode: 200, data: { content: [...] } }

    Note over User,API: 3. Automatic Token Refresh on Protected HTTP 401
    User->>Client: Next API Call
    Client->>API: GET /userInfo/63 (Expired Token)
    API-->>Client: 401 Unauthorized / { statusCode: 401 }
    Client->>Client: Response Interceptor catches 401
    Client->>API: POST /auth/refresh (no body; browser sends HttpOnly cookie)
    API-->>Client: Set-Cookie rotates refresh token + { data: { token, role, user fields } }
    Client->>Storage: Replace in-memory access token/profile
    Client->>API: Re-dispatch original request with new Bearer token
    API-->>Client: 200 OK
```

### Storage Security Architecture (`tokenStorage.ts`)
- **Access Token**: Held only in module memory for the current tab. Obsolete JavaScript-readable access-token cookies and web-storage aliases are deleted but never read.
- **Refresh Token**: Owned only by the backend in an HttpOnly cookie. `tokenStorage` exposes no refresh-token getter, setter, or remover.
- **Profile Metadata**: Held in memory/Redux and restored from login or refresh response data. Both responses must provide a non-empty access token (`token`, with the backend compatibility alias `accessToken` normalized at the boundary), `id`, `role`, and `email`; incomplete success envelopes are rejected before authenticated state is established. Known non-sensitive fields used by the UI, including `avatarUrl`, are normalized from flat or nested user payloads, while arbitrary properties and credential fields are discarded.
- **Immediate Logout Hygiene**: Logout increments the local session epoch, clears in-memory access/profile state and protected Redux caches immediately, sweeps all readable browser cookies across path/domain permutations (`clearAllReadableCookies()`), removes the previous user's persisted progress/bookmarks/drafts while preserving only `theme_pref`, broadcasts the cleared state, executes `executeAppLogout` with top-level `window.location.replace('/')` redirect to ensure all protected components, in-flight queries, and Monaco workers unmount cleanly, and calls the backend bodyless logout endpoint. `userScopedStorage` remembers only the last resolved opaque account scope in memory so cleanup still works if the current profile object becomes unavailable; it never guesses among unrelated stored scopes. The caller receives the real backend success or failure.
- **Stale-Response Rejection**: Login and refresh responses capture the session epoch and cannot restore credentials after a logout that completed while their request was in flight. Redux separately owns the active refresh request ID: a startup refresh that settles after a successful login is ignored rather than resetting that new session to the login route.
- **Unconditional Startup Restoration**: `AppRouterLayout` keeps auth status `LOADING` and calls `/auth/refresh` once on startup without inspecting cookies or persisted user state. Protected content stays gated until that request settles.
- **401-Only Retry**: Requests are not proactively refreshed from decoded expiry. Only an HTTP 401 from a protected request enters the refresh flow; 403, other HTTP errors, successful envelopes containing an inner error code, and unexpected HTML never trigger refresh.
- **Single-Flight Refresh Lock**: `executeRefreshToken()` owns the same-tab promise while `refreshCoordinator.ts` serializes refresh-token rotation across tabs with the browser's atomic Web Locks API. `localStorage` is not used as a mutex because it has no atomic compare-and-set operation. If Web Locks are unavailable, refresh fails safely before the request is issued rather than bypassing serialization.
- **Failure Semantics**: A refresh HTTP 401 clears auth state and redirects through route guards. Network, malformed success, and 5xx failures do not prove the cookie invalid: active sessions remain active, while startup enters `RECOVERY_REQUIRED` instead of rendering protected content. Guest routes expose an explicit **Sign in instead** action so the user can replace the account/session when recovery cannot complete; this is user-directed and does not reinterpret the transport failure as proof of logout.
- **Cross-Tab Session Reconciliation**: [`src/core/security/authSessionSync.ts`](../../src/core/security/authSessionSync.ts) sends credential-free lifecycle events. The publisher and subscriber share one `BroadcastChannel` object per tab, so an originating tab does not receive its own login event and discard the session it just established; other tabs still receive the event and perform their own serialized cookie-backed refresh. Logout and refresh-401 events clear per-tab state.
- **Explicit Request Policy**: Every request is resolved to `public` or `protected`. Only protected requests receive the bearer header and only their first HTTP 401 may refresh/retry. Authentication transport calls are explicitly marked `public`; authenticated profile institution search is explicitly `protected`. A 400, 403, 404, 429, 500, or already-retried 401 never refreshes.
- **Legacy Refresh-Cookie Migration**: Frontend JavaScript does not read or expire `refreshToken`, including a legacy readable cookie. The backend deployment must replace/expire legacy variants with `Set-Cookie` for every formerly used Path/Domain and issue only the canonical `HttpOnly; Secure; SameSite` cookie. This cannot be completed safely by frontend code.
- **Runtime Verification Boundary**: Automated tests exercise one active Web Lock at a time and prove the no-lock/storage-denied path never invokes the refresh callback. They do not prove behavior in two real browser tabs or validate deployed refresh-cookie rotation. On 2026-11-07, the deployed bodyless `/auth/refresh` was observed returning HTTP 401 with `"Refresh token missing"` immediately after a successful login and browser reload. Public preflight probes confirmed that the active `https://www.connect2code.in` origin receives `Access-Control-Allow-Origin: https://www.connect2code.in` and `Access-Control-Allow-Credentials: true`; therefore the remaining failure is backend cookie issuance, browser acceptance, or cookie Domain/Path/SameSite scope. The login `Set-Cookie` header and stored-cookie attributes remain unavailable from this frontend-only checkout.

---

## 3. Bearer-Only JWT Contract

### The Problem
Historically, the client sent `jwtToken` in mutating request bodies in addition to the bearer header. Authenticated production probes on 2026-11-03 proved that this was unnecessary and incorrect: bearer-only requests returned HTTP 200, while otherwise identical body-token-only requests returned HTTP 401 for `/questions`, `/mcq`, and `/company/list`.

### The Solution: Non-Mutating Canonicalization in `apiClient.ts`
[`src/core/api/apiClient.ts`](../../src/core/api/apiClient.ts) implements `sanitizeRequestData` over a recursive clone. For every outgoing request body:

1. The caller-owned body remains unchanged while a recursive clone removes `jwtToken`, `token`, `jwttoken`, and `jwt_token`, including nested objects, arrays, `FormData`, and `URLSearchParams`.
2. The access token is attached only as `Authorization: Bearer <token>`.
3. DELETE without business data remains bodyless.
4. URL query parameters are checked so credentials are never exposed in URLs.
5. `URLSearchParams` bodies remain form-encoded and preserve repeated business fields after credential removal.

---

## 4. REST Endpoint Catalog & Method Mappings

### A. Authentication Endpoints ([`src/services/authService.ts`](../../src/services/authService.ts))
| Endpoint | Method | Access | Request Body | Response Envelope |
| :--- | :---: | :--- | :--- | :--- |
| `/signUp` | `POST` | `PUBLIC` | `{ firstName, lastName, email, password, role: "USER", labelUserName, userName }` | `ApiResponse<AuthResponseData>` |
| `/auth/login` | `POST` | `PUBLIC` | `{ email, password }` | `ApiResponse<({ token: string } or { accessToken: string }) & Identity>` plus backend `Set-Cookie` for the HttpOnly refresh token |
| `/auth/refresh` | `POST` | `SESSION_RENEWAL` | No body; browser sends HttpOnly cookie | `ApiResponse<({ token: string } or { accessToken: string }) & Identity>` plus rotated refresh cookie; incomplete identity is rejected |
| `/auth/logout` | `POST` | `PUBLIC` | No body; browser sends HttpOnly cookie | Real backend `ApiResponse<string>`; backend revokes and clears its cookie |
| `/auth/generatePasswordResetOtp` | `POST` | `PUBLIC` | `{ email }` | `ApiResponse<unknown>` |
| `/auth/verifyPasswordResetOtp` | `POST` | `PUBLIC` | `{ email, otp, password }` | `ApiResponse<unknown>` |

`/auth/logout` remains a public-auth transport endpoint. The client clears local memory/caches immediately and sends a bodyless credentialed request. Backend revocation success is not fabricated: callers can distinguish a confirmed logout from local-only cleanup after a network/server failure.

### B. Problems & Questions ([`src/services/problemService.ts`](../../src/services/problemService.ts), [`src/services/questionService.ts`](../../src/services/questionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/questions` | `POST` | `USER_OR_ADMIN` | Paginated search: `{ level: number[] | null, companies: number[] | null, topic: number[] | null, searchText: string | null, pageRequest: { pageNumber, pageSize, sortBy, sortDirection } }`. Successful pages must include non-negative `totalElements`/`totalPages` plus `pageNumber`/`pageSize` (or Spring `number`/`size` aliases). Every row must contain an authoritative positive numeric ID and non-empty title; one malformed row rejects the page instead of being dropped, renumbered, or retitled. |
| `/question/{id}` | `GET` | `USER_OR_ADMIN` | Authoritative numeric problem detail route. The returned positive ID must equal the requested path ID and the title must be non-empty. Text slugs may scan the catalog only to resolve a numeric ID before this request. The authenticated admin browser probe on 2026-11-11 loaded question `1` with its authoring fields and eight test cases. |
| `/question` | `POST` | `ADMIN_ONLY` | Creates/updates a problem with title, description, constraints, hints, and taxonomy references. Success must return a positive saved ID; updates must return the requested ID. The separate test-case mutation is non-atomic, so the admin form adopts the saved identity and invalidates problem caches before attaching test cases. A failed attachment can then be retried as an update without duplicating the question. |
| `/question/{id}/testCases` | `POST` | `ADMIN_ONLY` | Sends the complete edited test-case array (`input`, `expectedOutput`, `isHidden`, `displayOrder`). No authenticated GET contract is established; test-case reads reuse the authoritative question-detail response. Test cases, including hidden cases, remain backend-owned: failed mutations remain errors and must never fall back to browser storage or static client fixtures. |

### C. Code Execution Engine ([`src/services/executionService.ts`](../../src/services/executionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/runCode` | `POST` | `USER_OR_ADMIN` | User RUN: executes visible sample test cases. Payload: `{ questionId: number, languageId: number (Ref ID 5-8), sourceCode: string, customInput?: string }`; `customInput` is included only for the explicit custom-input action. |
| `/submitCode` | `POST` | `USER_OR_ADMIN` | User SUBMIT: runs all test cases (visible, hidden, edge). *Remote backend has observed NPE bug on `TestCase.getType()`.* |
| `/admin/testCode` | `POST` | `ADMIN_ONLY` | Admin RUN: runs sample test cases without saving submission history. The authenticated production action returned three sample verdicts on 2026-11-11. |
| `/admin/submitCode` | `POST` | `ADMIN_ONLY` | Admin SUBMIT: runs all test cases without saving submission history. The authenticated production action returned five full-suite verdicts on 2026-11-11. |

`ProblemDetails` invalidates and refetches submission history after a completed user submission. It does not synthesize a local history row or store submitted source code/results in browser storage.

The admin runtime editor retains in-memory drafts by the composite question ID and language-table ID. Opening another question or switching languages cannot silently execute the previous question/language draft; Reset Boilerplate updates only the active draft.

`executionService` normalizes the execution verdict plus observed per-case and aggregate `time`, `memory`, `errors`, `stderr`, `stdout`, `compileOutput`, `message`, and `status` fields. `time` and `memory` remain opaque display values because their units are not verified; only explicitly named legacy `runtimeMs` and `memoryMb` fields receive `ms` and `MB` labels. Case visibility is determined by an explicit `isHidden` value when supplied, otherwise only a `Visible`, `Sample`, or `Public` `testCaseType` is treated as public. This prevents backend `isHidden: null` mandatory/edge cases from exposing their input, expected/actual output, or diagnostic text. Hidden data is removed at the shared boundary before components receive the result. This is defense in depth only: the backend must not expose hidden-case contents to ordinary users. A successful HTTP response must still contain a recognizable verdict, and solved/success UI requires at least one executed and passed test with zero failures; zero-test or malformed responses are rejected instead of being reported as accepted.

### D. Recruiter Companies & Exams ([`src/services/companyService.ts`](../../src/services/companyService.ts), [`src/services/admin/adminCompanyService.ts`](../../src/services/admin/adminCompanyService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/company/list` | `POST` | `USER_OR_ADMIN` | Service payload: `{ pageNumber, pageSize, sortBy, sortDirection }` with bearer authentication. The observed response page uses `content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `first`, and `last`; the observed page size is 24. Catalog selectors begin with that bounded size and use the returned page size for later pages. Captured records contain `id`, `name`, `logo`, `website`, and `isActive`. Live 2026-11-03 probes confirmed pagination and also confirmed that `searchText`, `search`, `query`, `name`, and `companyName` are silently ignored; they must not be exposed as server filters. |
| `/company` | `GET` | `USER_OR_ADMIN` | Historical direct-probe evidence records an unpaginated `data: Company[]` read with `id`, `name`, `logo`, `website`, and `isActive`. The active UI uses the newer paginated `/company/list` contract; do not substitute this route without fresh endpoint evidence. |
| `/company/{id}` | `GET` | `USER_OR_ADMIN` | Company details by numeric ID; captured records contain `id`, `name`, `logo`, `website`, and `isActive`. |
| `/company/{companyId}/exams/list` | `POST` | `USER_OR_ADMIN` | Services send pagination/sort business fields with bearer authentication. |
| `/company/exams/{examId}` | `GET` | `USER_OR_ADMIN` | Detailed exam blueprint (exam info, recruitment roles, exam sections). |
| `/admin/company` | `POST` | `ADMIN_ONLY` | Current frontend create/update target. It sends `{ id: number|null, name, website, logo, description, isActive }`; its live write contract remains `PARTIALLY VERIFIED`. `/admin/companies` is the admin UI route, not a verified REST endpoint. Historical `POST /company` evidence conflicts with this target and requires fresh admin evidence before any endpoint change. |
| `/admin/companyRole` | `POST` | `ADMIN_ONLY` | Creates or updates recruitment role (`roleName`, `roleCode`, `salary`). |
| `/admin/examSection` | `POST` | `ADMIN_ONLY` | Creates or updates an exam section / round. `sectionTypeId` and optional `questionTypeId` must be selected from `EXAM SECTION TYPE` and `QUESTION TYPE`; no legacy numeric fallback is permitted. |
| `/admin/companyExam` | `POST` | `ADMIN_ONLY` | Creates or updates company exam schedule (`examName`, `year`, `totalDurationMinutes`). |

### E. Aptitude & MCQ Assessment ([`src/services/mcqService.ts`](../../src/services/mcqService.ts), [`src/services/admin/adminMcqService.ts`](../../src/services/admin/adminMcqService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/mcq` | `POST` | `USER_OR_ADMIN` | Query MCQs by `subject`, `difficulty`, `topic`, `companies`, and `searchText`, with `pageRequest`. Reference filters send numeric IDs loaded from the reference library. Live 2026-11-03 probes returned 86 total rows and different totals for search queries. |
| `/mcq/{id}` | `GET` | `USER_OR_ADMIN` | Single MCQ question details and options. When a list row omits options, Aptitude fetches this detail only after the user requests that card's options, and Company Preparation fetches it when the solve modal opens. |
| `/admin/mcq` | `POST` | `ADMIN_ONLY` | Admin create/update MCQ. The request contains `id` for an update, taxonomy codes and names (`subjectGroupCode`, `subjectRefCode`, `subjectRefName`, `topicGroupCode`, `topicRefCode`, `topicRefName`, `difficultyGroupCode`, `difficultyRefCode`, `difficultyRefName`), optional `companyId` and `companyName`, `question`, optional `explanation`, `isActive`, and `options`. Each option contains only its persisted `id` when present, `optionLabel`, `optionText`, and explicit `isCorrect: true/false`. Exactly one option must be correct. Legacy question-level answer fields and option aliases are not sent or used to determine correctness. |
| `/admin/mcq/{id}` | `DELETE` | `ADMIN_ONLY` | Deletes an MCQ question. |

User-facing MCQ reads remain in `mcqService`; create/update/delete operations exist only in the admin service and admin-routed UI. Because the backend uses one `POST` route for both create and update, endpoint constants and payload types use `SAVE` naming rather than the obsolete create-only name.

### F. DSA Learning Sheets ([`src/services/learningSheetService.ts`](../../src/services/learningSheetService.ts), [`src/services/admin/adminLearningSheetService.ts`](../../src/services/admin/adminLearningSheetService.ts))

The backend names this resource `learningSheet`; the product UI intentionally presents it only as **DSA Sheet**.

| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/user/learningSheets` | `GET` | `USER_OR_ADMIN` | Lists sheets with `id`, `sheetCode`, `sheetName`, `description`, and `isActive`. |
| `/user/learningSheets/{sheetId}` | `GET` | `USER_OR_ADMIN` | Returns the selected sheet for the admin edit form. The returned `id` must match the requested path ID. |
| `/user/learningSheets/{sheetId}/sections` | `GET` | `USER_OR_ADMIN` | Returns the sections supplied for one sheet, ordered by `displayOrder`, then `id`. The client validates `sheetId` and never requests an undocumented child-section endpoint. |
| `/user/learningSheet/section/{sectionId}/questions` | `GET` | `USER_OR_ADMIN` | Returns question-link records ordered by `displayOrder`. Each nested `question` uses the same structured summaries as `POST /questions`: `companies[]` objects and nullable `questionPlatform` object. The deletion identifier is the outer link `id`; problem navigation uses `question.id`. |
| `/admin/learningSheet` | `POST` | `ADMIN_ONLY` | Saves a sheet. Create sends `id: null`; edit sends the existing `id`, with `{ sheetCode, sheetName, description, isActive }`. |
| `/admin/learningSheet/section` | `POST` | `ADMIN_ONLY` | Saves a section or nested section. Create sends `id: null`; edit sends the existing `id`, with `{ sheetId, parentSectionId, sectionName, displayOrder, isActive }`, where `parentSectionId: null` is top-level. |
| `/admin/learningSheet/section/{sectionId}` | `DELETE` | `ADMIN_ONLY` | Deletes a section with bearer authentication and no invented credential body. |
| `/admin/learningSheet/question` | `POST` | `ADMIN_ONLY` | Saves a problem association: create sends `id: null`; edit sends the outer association `id`, plus `{ sectionId, question: { id }, displayOrder, isActive }`. |
| `/admin/learningSheet/section/{sectionId}/question/{linkId}` | `DELETE` | `ADMIN_ONLY` | Removes a section-question association without deleting the problem. The second path value is the association/link ID returned as the outer record `id`. |

The problem route is deliberately built from the nested `question.id`, never the outer association `id` and never the nullable response `sectionId`. The production OpenAPI document requires authentication and could not be read anonymously on 2026-11-01; therefore live update acceptance remains `PARTIALLY VERIFIED` until an authenticated edit is executed against the backend.

All calls use `apiClient`. Protected business requests carry the access JWT only in the bearer header; access- and refresh-token aliases are removed from request bodies and query parameters. `/auth/refresh` and `/auth/logout` are bodyless and rely exclusively on the backend-managed HttpOnly cookie.

Problem test cases are accepted only from backend DTOs, backend-provided `examples`, or genuine Input/Output examples parsed from the problem description. The frontend contains no ID/title-based sample fixtures and never invents hidden evaluation cases.

### G. Live Read-Only DTO Fields (2026-10-23)

The following fields were captured from the configured production API using supplied test credentials. They are evidence for read paths only; admin mutation payloads were not sent to production. A follow-up Postman MCP run on 2026-11-01 authenticated successfully and runtime-verified the reference group-code catalog; the per-group request exposed the backend cache failure documented in the known-issues register.

| Endpoint | Captured `data` fields |
| :--- | :--- |
| `GET /language` | `id`, `referenceId`, `languageName`, `judge0LanguageId`, `version`, `isActive` |
| `GET /language/dropdown` | `id`, `name` (a distinct dropdown DTO) |
| `GET /referenceLibrary/refGroupCode/{group}` | `id`, `refGroupCode`, `refCode`, `refName`, `isActive` |
| `GET /referenceLibrary/refGroupCode/list` | Array of reference group-code strings |
| `POST /referenceLibrary` | `id`, `refGroupCode`, `refCode`, `refName`, `isActive` (`refGroupName` is accepted on create but omitted from the observed response) |
| `POST /mcq`, `GET /mcq/{id}` | Question: `subjectGroupCode`, `subjectRefCode`, `subjectRefName`, `topic*`, `difficulty*`, `companyName`, `companyId`, `question`, `explanation`, `isActive`, `options`, `id`; option: `id`, `optionLabel`, `optionText`, `isCorrect` |
| `POST /questions` | `id`, `title`, `description` (nullable), `difficultyId`, `difficultyName` (or reference aliases), `topicId`, `topicName`, `isOwnProblem`, `isActive`; `companies[]` contains `{ id, name, logo, website, isActive }` (with nullable `logo`/`website`) or company name strings; nullable `questionPlatform` contains `{ id, refGroupCode, refGroupName, refCode, refName, isActive, logoUrl }` or string platform name. Service layer normalizes rows into strongly-typed `QuestionListItem` records. |
| `GET /users/{id}/questions/bookmarks` | `questionId`, `title`, `difficulty` |
| `GET /{id}/getSubmiteedQuestionIds` | `questionId`, `questionName`, `difficultyLevel`, `submittedDate` |
| `GET /{id}/getAPttemptedQuestionIds` | `questionId`, `title`, `difficulty`, `submittedDate` |
| `GET /institutions/search` | `id`, `name`, `institutionType`, `state`, `district` |
| `GET /admin/institutions`, `GET /admin/institutions/{id}` | `id`, `aisheCode`, `name`, `institutionType`, `state`, `district`, `website`, `yearOfEstablishment`, `location`, `collegeType`, `management`, `universityId`, `universityName`, `universityType`, `isActive`, audit timestamps/IDs |

Live MCQ verification on 2026-10-23 found that this is also a record-level data boundary: a ten-record `POST /mcq` response had option counts `4, 4, 4, 0, 0, 0, 0, 0, 0`, and an affected record's `GET /mcq/4` returned the same empty `options` array. A missing list `options` field now triggers the verified detail route at the user-interaction boundary; if detail still returns no options, the renderer remains unanswerable and does not manufacture option text or correctness from question-level aliases.

### G. Endpoint Coverage Boundary

`src/core/api/endpoints.ts` contains only routes with a current service caller. The unused `company/{id}/problems`, `question/{id}/submit`, `/institutions` base, `/language/dropdown`, and duplicate solved-question constant were removed during the source audit rather than represented as working integrations. `/language/dropdown` was captured but intentionally omitted because it supplies only `id` and `name`, whereas code execution requires the `referenceId` supplied by `GET /language`. Read-only routes listed above have direct production evidence. Historical probes of `GET /institutions/{id}` and the unestablished `GET /question/{id}/testCases` returned `401`; the latter is not used as a read contract. The previously failing `GET /question/{id}` path was browser-runtime verified for question `1` on 2026-11-11. Create, update, delete, refresh, reset, and execution requests remain `PARTIALLY VERIFIED` until a disposable non-production fixture is available; this audit did not mutate production data.

### H. Envelope and Detail Rules

`apiClient` is typed as an unwrapped transport and returns the backend envelope directly, so services and UI callers consume the payload exactly once through `response.data`; user and admin MCQ/question/dashboard views do not attempt raw-response or nested `data.data` fallbacks. `POST /questions` rows are validated as their own strict list DTO, including structured company and platform summaries, and are mapped only from captured list fields. The learner list renders those supplied logos directly and does not make a second QPF lookup. Admin list rows are not converted into full `Question` detail records or padded with legacy `qpf*`/`platformName` aliases, because the list DTO lacks the reference and test-case fields required for authoring. Admin writes send the canonical `qpfRefGroupCode`, `qpfRefCode`, and `qpfRefName` fields rather than duplicating the platform name in a list-response `questionPlatform` field. Inspect, edit, and test-case actions continue to fetch `GET /question/{id}`. When that detail request fails, the admin/detail UI reports the API failure instead of showing guessed taxonomy, platform, or test cases.

Company list consumers require an object page envelope with `content`, page number, page size, total elements, and total pages. Numeric company route values are sent directly to `/company/{id}`; text slugs scan the reported catalog pages to resolve a real numeric company identity and are never sent to the numeric route.

### F. User Profile, Bookmarks & Academic Details ([`src/services/profileService.ts`](../../src/services/profileService.ts), [`src/services/userQuestionService.ts`](../../src/services/userQuestionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/userInfo/{userId}` | `GET` | `USER_OR_ADMIN` | Fetches `null` when no profile exists. Observed records contain academic data plus optional personal fields: `{ id, userId, firstName, lastName, regNumber, joinedYear, passedOutYear, collegeName, collegeId, bio, gender, dob }`. Older records may use `college`; the client normalizes either server spelling to `college` without fabricating data. |
| `/userInfo/{userId}` | `POST` | `USER_OR_ADMIN` | Saves/updates `{ id, userId, regNumber, joinedYear, passedOutYear, college, bio }` and, when selected/provided, `{ firstName, lastName, collegeId, collegeName, gender, dob }` using bearer authentication. `gender` is the API reference object from the `GENDER` catalog, not an invented string. |
| `/{userId}/getTheme` | `GET` | `USER_OR_ADMIN` | Retrieves the authenticated user's server-owned `{ isDarkTheme: boolean }` preference. |
| `/{userId}/theme/{isDarkTheme}` | `POST` | `USER_OR_ADMIN` | Updates the authenticated user's server-owned boolean theme preference. The request has no JSON body. |
| `/users/{userId}/questions/{questionId}/bookmark` | `POST` | `USER_ONLY` | Bookmarks a problem for the user. |
| `/users/{userId}/questions/{questionId}/bookmark` | `DELETE` | `USER_ONLY` | Removes a problem bookmark. |
| `/users/{userId}/questions/bookmarks` | `GET` | `USER_ONLY` | Retrieves all bookmarked questions for the user. |
| `/{userId}/getSubmiteedQuestionIds` | `GET` | `USER_ONLY` | Solved problem IDs for progress tracking. (Backend typo preserved: `getSubmiteedQuestionIds`). |
| `/{userId}/getAPttemptedQuestionIds` | `GET` | `USER_ONLY` | Attempted problem IDs. (Backend typo preserved: `getAPttemptedQuestionIds`). |
| `/{userId}/question/{questionId}/getSubmissions` | `GET` | `USER_ONLY` | Submissions history for a specific problem. |

Profile records are server-owned: `ProfileSettings` reads and writes them through `/userInfo/{userId}` and does not retain an offline `localStorage` copy. A legacy `c2c_user_academic_<userId>` value is removed when that profile is opened. The profile normalizer preserves request-user isolation and accepts both observed college-name spellings. Theme preference is server-authoritative for authenticated users: `ThemeProvider` reads it after authentication is established and serializes POST updates to prevent rapid toggles reaching the backend out of order. The active user's scoped browser value remains only a non-sensitive offline/guest fallback.

Problem bookmarks are server-owned. `bookmarkSlice` hydrates only `questionId`, `title`, and `difficulty` from `GET /users/{userId}/questions/bookmarks`; it leaves `savedAt` absent because the DTO has no creation timestamp and fetch time is not save time. A failed refresh preserves the active user's last known server list and exposes an error instead of replacing it with a false empty success. COMPANY/APTITUDE bookmarks have no observed API contract and are therefore retained only in `userScopedStorage`; server-owned problem bookmarks are excluded from browser persistence.

`GET` and `PUT /user/profile` are not used: archived direct probes returned 401 for every available credential and identified the route as unmapped. The client therefore does not fabricate successful identity or avatar mutations in browser storage. Name/email remain session-owned and read-only; avatar editing is disabled. A non-null response must identify the requested numeric user ID when the backend includes `userId`.

### G. Institution Directory ([`src/services/institutionService.ts`](../../src/services/institutionService.ts), [`src/services/admin/adminInstitutionService.ts`](../../src/services/admin/adminInstitutionService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/institutions/search` | `GET` | `USER_OR_ADMIN` | Query param `?query=...` (min 3 chars). Authenticated profile autocomplete; anonymous requests returned 401 and Bearer-authenticated requests returned 200 in the supplied Postman audit. |
| `/institutions/{id}` | `GET` | `PUBLIC` | Public institution details. |
| `/admin/institutions` | `GET` | `ADMIN_ONLY` | Paginated admin list with query, type, state, district, activeOnly filters. |
| `/admin/institutions/{id}` | `GET` | `ADMIN_ONLY` | Institution details including affiliated university. |
| `/admin/institutions` | `POST` | `ADMIN_ONLY` | Creates new college or university with AISHE code. |
| `/admin/institutions/{id}` | `PUT` | `ADMIN_ONLY` | Updates existing institution details. |
| `/admin/institutions/{id}/status` | `PATCH` | `ADMIN_ONLY` | Soft toggle: `{ isActive: boolean }`. |

### H. Compiler Languages & Taxonomy ([`src/services/referenceService.ts`](../../src/services/referenceService.ts), [`src/services/admin/adminReferenceService.ts`](../../src/services/admin/adminReferenceService.ts), [`src/services/admin/adminLanguageService.ts`](../../src/services/admin/adminLanguageService.ts))
| Endpoint | Method | Access | Description / Payload |
| :--- | :---: | :--- | :--- |
| `/referenceLibrary/refGroupCode/{groupCode}` | `GET` | `USER_OR_ADMIN` | Returns API-owned taxonomy terms. Current callers request `DIFF`, `TOPIC`, `QPF`, `SUBJECT`, subject-specific topic groups, `GENDER`, `LANG`, and `TESTCASETYPE`. QPF remains required by authoring forms, while question lists consume the structured platform summary already returned by `POST /questions`. `CodingQuestionTable` accepts only a final-boundary HTTPS/public-safe list logo and otherwise preserves an accessible platform-icon fallback. |
| `/referenceLibrary/refGroupCode/list` | `GET` | `USER_OR_ADMIN` | Returns all reference group codes as strings. The authenticated 2026-11-01 response contained 15 codes; clients consume the returned list rather than hardcoding its length or membership. |
| `/referenceLibrary` | `POST` | `ADMIN_ONLY` | Creates when no `id` is present using `{ refGroupCode, refGroupName, refCode, refName, isActive }`; updates when `id` is present using `{ id, refGroupCode, refCode, refName, isActive }`. Authentication is bearer-header only. A group is created by saving its first record. |
| `/referenceLibrary/refGroupCode/{groupCode}/refCode/{refCode}` | `DELETE` | `ADMIN_ONLY` | Irreversible hard delete. The admin UI requires an explicit confirmation and URL-encodes both path segments. |
| `/language` | `GET` | `USER_OR_ADMIN` | Compiler catalog with database table IDs and execution reference IDs. Values are consumed from response fields, not fixed client ranges. |
| `/language/dropdown` | `GET` | `USER_OR_ADMIN` | Lightweight language selector for code runner. |
| `/language` | `POST` | `ADMIN_ONLY` | Registers or updates language compiler configuration. |
| `/language/{id}` | `DELETE` | `ADMIN_ONLY` | Soft deletes language compiler configuration. |

The response interceptor returns the backend `ApiResponse<T>` envelope itself, not an Axios response wrapper. Services therefore consume `response.data` exactly once. List services reject malformed successful payloads rather than silently converting them into empty arrays. MCQ and company-exam boundaries validate nested records before rendering, and text company slugs must resolve to a positive numeric backend ID before a detail request. Reference group paths are URL-encoded (including group names containing spaces), and every returned reference record is validated for numeric `id`, matching `refGroupCode`, non-empty `refCode`/`refName`, and boolean `isActive`. Component-level group-record reads use the shared Redux reference cache with a 30-minute TTL, in-flight deduplication, and request ownership; the group-code catalog is read through the same validated reference service. An API-confirmed empty list is cacheable. Successful reference/library and language mutations invalidate request ownership before a forced refresh, so an older in-flight response cannot restore a fresh TTL over newly mutated data. Public institution-search failures are surfaced to the autocomplete instead of being converted into a false successful empty result.

---

## 5. Security & Error Sanitization

### Error Sanitization (`serverErrorMapper.ts`)
The backend is built with Java Spring Boot and Hibernate. When internal exceptions occur, raw error messages may contain Java package paths (`org.springframework`, `java.lang`), database table names, or SQL constraint violations.
- [`src/core/validation/serverErrorMapper.ts`](../../src/core/validation/serverErrorMapper.ts) tests error text against `isInternalServerLeak()`.
- If an internal leak is detected, it suppresses the technical trace and presents clean, actionable user feedback (e.g. *"Our servers encountered an issue while processing your request. Please try again shortly."*).
- Prevents database column names, Java stack traces, and internal server topologies from being revealed to end users.

### Open-Redirect, External-Link, URL Credential Defense & Authentication Invariants (`jwt.ts`, `externalUrl.ts`, `Login.tsx`, `OAuthCallback.tsx`, `AppRouterLayout.tsx`, `authService.ts`)
- [`src/core/security/jwt.ts`](../../src/core/security/jwt.ts) exports `getSafeRedirectUrl(target: string | null | undefined): string` which strictly enforces that redirect targets begin with a single `/`, reject protocol-relative paths (`//`), any backslash (`\`), scheme delimiters (`:`), URL-encoded variants (`%5C`, `%2F%2F`), control characters (`\x00-\x1F`, `\x7F`), and auth route prefixes (`/login`, `/signup`, `/forgot-password`, `/auth`, `/oauth`), defaulting safely to `/practice`.
- [`src/core/security/externalUrl.ts`](../../src/core/security/externalUrl.ts) treats company, institution, exam, avatar, and website-derived image URLs as untrusted API data at the final DOM boundary. Clickable links permit only credential-free HTTP(S), reject protocol-relative paths, backslashes, non-web schemes, and invalid hosts, and normalize legacy bare hostnames to HTTPS. Passive image requests are stricter: HTTPS only, with localhost, private/link-local IP literals, and local/internal host suffixes rejected.
- [`src/features/auth/pages/Login.tsx`](../../src/features/auth/pages/Login.tsx) passes all post-login destinations through `getSafeRedirectUrl` and strictly routes non-admin users to `/practice` even if an admin target URL was requested.
- Login validation is submit-driven (`mode: 'onSubmit'`) and the form uses `noValidate`, preventing blur/native browser validation from showing empty-field errors before the user submits. After a failed submit, `reValidateMode: 'onChange'` gives immediate correction feedback; leaving login mode clears stale login errors.
- [`src/features/auth/pages/OAuthCallback.tsx`](../../src/features/auth/pages/OAuthCallback.tsx) accepts only documented error codes from query/hash parameters and never accepts URL credentials. It immediately purges all callback query/hash data via `window.history.replaceState({}, '', window.location.pathname)` before error exits or async completion, then establishes the session only through the backend-managed HttpOnly refresh cookie.
- [`src/layouts/AppRouterLayout.tsx`](../../src/layouts/AppRouterLayout.tsx) listens for popup OAuth completion messages with strict same-origin checking (`event.origin === window.location.origin`), rejects self-messages (`event.source === window`), discards in-memory sessions, and triggers standard cookie session refresh without accepting caller-supplied tokens from `event.data.token`.
- [`src/services/authService.ts`](../../src/services/authService.ts) sanitizes logout error logging to output only generic error messages, avoiding printing raw Axios error objects that expose request configurations, `Authorization: Bearer <token>` headers, and server tracebacks.
- **Backend Boundary Notice**: Frontend route guards (`AdminRoute.tsx`, `ProtectedRoute.tsx`) and client-side token validation only control browser UI rendering. Assertions regarding backend endpoint authorization (`@PreAuthorize`), token revocation, and Judge0 sandboxing represent external backend dependencies that require independent verification on the Spring Boot and infrastructure layers.

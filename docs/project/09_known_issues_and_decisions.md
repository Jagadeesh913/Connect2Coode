# 09. Known Issues, Architectural Decisions & Trade-Offs

## 1. Known Backend Quirks & Observed Defects

### 1. `POST /api/v1/submitCode` NPE on `TestCase.getType()`
- **Observed Behavior**: Probing `POST /submitCode` or `POST /admin/submitCode` with complete code execution payloads returns HTTP 500 (`NullPointerException: Cannot invoke "TestCase.getType()" because "testCase" is null`).
- **Root Cause**: In the remote Spring Boot backend, the submission evaluator attempts to read `getType().getRefName()` on test case entities without verifying nullability or handling incomplete test case fixtures in the database.
- **Frontend Mitigation**:
  - Sample test case execution (`POST /runCode` and `POST /admin/testCode`) works reliably and evaluates properly.
  - The frontend maps HTTP 500 cleanly via [`src/core/validation/serverErrorMapper.ts`](../../src/core/validation/serverErrorMapper.ts) so no raw Java stack traces are exposed to users.

### 2. Numeric Question Details vs Text Slugs & Specific Question 500s
- **Verified Behavior**: The archived direct HTTP inventory records `GET /question/1` as `PASS`/`VERIFIED` and returning full question details. The earlier claim that every numeric details request returned 500 was stale.
- **Specific Record Defects**: Certain questions (such as `GET /question/6`) fail on the remote Spring Boot backend with HTTP 500 (`"statusCode": 500, "message": "Question Fetch Unsuccessfull"`), likely due to internal null relationship references in the question entity.
- **Remaining Constraint**: `GET /question/{slug}` fails because the Spring controller expects a numeric `Long` path variable.
- **Frontend Mitigation**: Numeric IDs try `GET /question/{id}` first. If it fails with 500 or if a text slug is used, `problemService.getProblemById` and `questionService.getById` transparently fall back to the paginated `/questions` catalog and extract visible examples from the returned description. They do not add a speculative `GET /question/{id}/testCases` request because that route returned `401` for the authenticated temporary account. Abort errors are rethrown and never converted into a generic not-found result.

### 3. Backend `@PathVariable Long id` vs String Slugs
- **Observed Behavior**: Calling `GET /company/tcs` or `GET /question/two-sum` returns HTTP 401/404 because the Spring Boot controller declares `@PathVariable Long id`.
- **Frontend Mitigation**:
  - Services detect numeric IDs vs string slugs.
  - When a text slug is supplied, the service queries the list endpoint (`/company/list` or `/questions`), maps the entity, and resolves the numerical ID.

### 4. Backend Typographical Endpoint Names
- **Observed Behavior**: User progress endpoints are spelled with idiosyncrasies on the backend:
  - `/{userId}/getSubmiteedQuestionIds` (note spelling `getSubmiteedQuestionIds`)
  - `/{userId}/getAPttemptedQuestionIds` (note spelling `getAPttemptedQuestionIds`)
- **Frontend Mitigation**:
  - [`src/core/api/endpoints.ts`](../../src/core/api/endpoints.ts) explicitly maps these exact strings to match the Spring Boot controller routes.

### 5. `POST /api/v1/questions` HTTP 500 on Oversized `pageSize` (`pageSize: 1000`)
- **Observed Behavior**: In `/admin/dashboard`, `POST /api/v1/questions` failed with HTTP 500 when requesting `pageSize: 1000`. Meanwhile, the identical endpoint in `/admin/questions` succeeded with HTTP 200 using standard `pageSize: 10`.
- **Root Cause**: `UNKNOWN`. The response proves that this request size is not supported by the deployed service, but does not establish whether the failure is caused by query, memory, serialization, or another backend limit.
- **Frontend Mitigation**:
  - [`src/features/admin/pages/AdminDashboard.tsx`](../../src/features/admin/pages/AdminDashboard.tsx) now requests `pageSize: 10` matching `/admin/questions` and reads the total question count directly from `res.data.totalElements`.
  - Difficulty breakdown (`easyCount`, `mediumCount`, `hardCount`) is obtained via concurrent level-filtered queries (`level: [1]`, `level: [2]`, `level: [3]`) with `pageSize: 1`, extracting `totalElements` from each. A failed filtered query retains the previous unknown/known value and raises a warning; a ten-row sample is never presented as a global total.
  - [`src/features/admin/components/dashboard/DashboardCodeRunner.tsx`](../../src/features/admin/components/dashboard/DashboardCodeRunner.tsx) sets `pageSize: 10` for its playground selector to ensure consistent stability.

---


## 2. Key Architectural Decisions & Rationale

### Decision 1: Local Recruiter Logos in `public/companies/`
- **Context**: The backend company records contain empty or broken remote logo URLs.
- **Decision**: Keep 121 vector SVG and high-resolution PNG files in `public/companies/` as the first source, expose every unique bundled brand through `companyLogoRegistry.ts`, and ignore arbitrary backend logo URLs. For new companies, derive candidates from the validated website domain: optional Brandfetch, Simple Icons, official favicon, then a deterministic monogram.
- **Benefits**: Known brands retain fast same-origin assets and consistent aspect ratios, while new API-created companies receive useful branding without a frontend release. The terminal monogram keeps the UI stable when a remote source is unavailable.
- **Limitation**: Brandfetch's advertised 95%+ core-brand coverage is vendor-reported, not a measured guarantee for Connect2Code. Production coverage depends on a configured public client ID, valid API website fields, provider availability, and the actual company population.

### Decision 2: Deep Purge of Duplicate Token Fields in `apiClient`
- **Context**: Different legacy API calls sent either `token` or `jwtToken`. The backend rejected duplicate fields.
- **Decision**: Implement `purgeDuplicateTokenFields` in `apiClient.ts` request interceptor.
- **Benefits**: Centrally strips any lowercase `token`, `jwttoken`, or `jwt_token` key from nested request bodies and guarantees only `jwtToken` is transmitted across all 37+ platform APIs without having to edit dozens of individual UI components.

### Decision 3: Option-Level `isCorrect` Flag for MCQs
- **Context**: In the MCQ Bank, questions contain top-level fields (`correctOption: "A"`, `correctAnswer: "15"`) and an array `options: [{ optionLabel: "A", isCorrect: false }, { optionLabel: "B", isCorrect: true }]`. When an author updates an MCQ to change the correct option from A to B, the backend updates `options[].isCorrect` but may leave the top-level `correctOption` unchanged.
- **Decision**: In `mcqUtils.ts` and `AdminMcqs.tsx`, option correctness is determined strictly by checking `isCorrect: true` on individual option objects. Admin saves serialize only `id`, `optionLabel`, `optionText`, and `isCorrect`; stale top-level strings and unverified aliases (`correct`, `is_correct`, `optionId`) are neither read as authority nor sent.
- **Benefits**: Editing an MCQ's correct option works reliably and immediately in the UI.

### Decision 4: Java Class Renaming to `Main` for Judge0
- **Context**: Judge0 Java compiler expects a class with a `public static void main` method located in a class named `Main`. Students frequently write LeetCode-style code with `public class Solution`.
- **Decision**: [`src/services/executionService.ts`](../../src/services/executionService.ts) automatically substitutes `public class Solution` with `public class Main` before dispatching code to `/runCode`.

### Decision 5: Language Reference ID Mapping
- **Context**: The database language table assigns IDs 1-4 (e.g. 1 = Java, 2 = C++, 3 = Python, 4 = C). However, the Judge0 execution engine expects Reference IDs 5-8 (5 = Java, 6 = C++, 7 = Python, 8 = C).
- **Decision**: `executionService.resolveLanguageReferenceId` maps a table ID or already-resolved reference ID only when it is present in the dynamic `/language` catalog. Static ID ranges and positive-ID pass-through were removed because they could execute code with a wrong backend reference after registry changes.

### Decision 6: Cookie-Only Session Persistence and Server-Owned Academic Records
- **Context**: The previous client mirrored credentials and profile objects into `localStorage` and `sessionStorage`, while the profile page retained an unscoped academic-record cache. This contradicted the documented storage policy and could leave sensitive data after a session.
- **Decision**: Keep the established cookie/in-memory session contract for the backend that returns tokens in JSON, remove web-storage reads/writes for credentials and profile metadata, clean legacy copies on session writes/logout, and fetch academic records solely through `/userInfo/{userId}`.
- **Guardrail**: An expired access token with a refresh session remains in `LOADING` until refresh succeeds or fails, so session restoration is not erased or redirected prematurely.

### Decision 7: Server Authority for Admin Test Cases and Submission History
- **Context**: Admin question metadata and test cases were overridden or retained in browser storage, and two hard-coded fixtures included hidden evaluation cases. `ProblemDetails` also mirrored submitted source code and results even though the submission-history endpoint is available.
- **Decision**: Use API payloads as the sole source for admin question metadata, test cases, and authenticated submission history. A failed test-case save reports an error and leaves the modal open. Visible examples and sample test cases may still be parsed from problem descriptions or provided for standard catalog problems (e.g. Reverse an Array) to guide student inputs, but hidden evaluation fixtures are never bundled into the client.
- **Boundary**: Problem bookmarks remain server-authoritative. COMPANY/APTITUDE bookmarks have no corresponding API endpoint and use only user-scoped browser persistence; the persistence middleware explicitly excludes server-owned problem bookmarks.

### Decision 8: Deterministic Redux State and Request Ownership
- **Context**: Bookmark/progress reducers wrote browser storage directly; bookmark identity ignored item type; async profile/progress responses could apply after the active user changed; and token-only refresh responses could replace complete user metadata.
- **Decision**: Keep server-owned bookmarks only in Redux memory, key mutations by `type:itemId`, and guard user-specific async results with request/user ownership. Authentication merges token-only refresh responses with the current profile.
- **Benefits**: Reducers stay deterministic, independent mutations compose safely, and late network responses cannot leak or overwrite another user's state.

### Decision 9: Shared Reference Taxonomy and API-Only Platform Metadata
- **Context**: Forms independently fetched the same reference groups, valid empty responses were fetched repeatedly, and question IDs were mapped to hard-coded platform names.
- **Decision**: All reference-library consumers use `referenceSlice` through `useReferenceGroup`, with TTL, force invalidation, and per-group request ownership. Problem platform code/name comes only from returned question fields (`questionPlatform`, `qpfRefCode`, `qpfRefName`, `examPlatform`, `platformName`, or `platform`); missing metadata stays unspecified.
- **Benefits**: Navigation and Strict Mode no longer amplify identical reference calls, and the UI cannot silently assign a platform based on a question ID or title.

### Decision 10: Assessment Integrity Is a Client Deterrent, Not a Trust Boundary
- **Context**: The student coding workspace previously exposed copy controls and allowed normal clipboard/context-menu/drag-drop operations despite being used for coding assessments. Its custom-input control also did not send the API-supported `customInput` field.
- **Decision**: The workspace uses `useAssessmentIntegrity` to restrict clipboard events, context menu, drag/drop, Print Screen, source-view/print, and common developer-tool shortcuts. It retains normal left-click, editor typing, undo, and execution shortcuts so the product stays operable. The runner sends `customInput` only for the explicit custom-input action and normalizes incomplete execution response envelopes without inventing a verdict.
- **Boundary**: Client JavaScript cannot prevent DevTools, screenshots, another browser/device, or modified clients. There is no verified backend endpoint for proctoring telemetry, violation storage, or exam session enforcement, so the client only displays/detects best-effort events and never claims malpractice prevention.

### Decision 11: Security Overrides and Direct Upgrades Track Published Fixes
- **Context**: The Monaco editor's transitive DOMPurify dependency received newly published critical advisories, and the direct Zod 3 dependency was later reported vulnerable to memory exhaustion while validating oversized constrained collections.
- **Decision**: Keep the existing root `overrides` mechanism and pin DOMPurify to `3.4.17`. Upgrade the direct Zod dependency independently to `4.6.7`, migrate its error/type APIs, and verify form behavior rather than using an unreviewed bulk `npm audit fix --force`.
- **Verification**: `npm audit --omit=dev` reported `0 vulnerabilities` on 2026-10-24; all validation tests, type checking, lint, and the production build passed after the Zod 4 migration.

### Decision 12: Credential-Free Cross-Tab Session Synchronization
- **Context**: Browser cookies are shared between tabs, but Redux state and the in-memory access-token cache are per tab. Logging out in one tab previously left another tab displaying an authenticated session until reload or a failed request.
- **Decision**: Publish only `{ type, occurredAt }` session lifecycle events via `BroadcastChannel`, with a transient `storage` event fallback for unsupported browsers. Recipients clear per-tab memory and Redux state on logout, or discard memory and rehydrate from the cookie-backed session after sign-in/refresh. Tokens, refresh tokens, and user data are never placed in the signal.
- **Boundary**: This synchronizes tabs in the same browser origin. Server-side token revocation remains authoritative for other devices, browsers, or sessions.

### Decision 13: API-Field Audit Uses Captured Backend Evidence
- **Context**: Read-only production captures on 2026-10-23 established exact DTOs for authentication, languages, references, MCQs, question lists, company reads, user progress lists, and institution search. The temporary account subsequently returned `401 Invalid Email or Password`, so no production mutation was attempted or inferred.
- **Decision**: Strictly map the captured `GET /language` field `languageName` (not an undocumented `name` alias) and company read fields `name`, `logo`, and `website` (not `companyName`, `logoUrl`, or `websiteUrl`). The MCQ path remains strict: it consumes and sends only `id`, `optionLabel`, `optionText`, and boolean `isCorrect`. Uncaptured mutation and detail contracts remain `UNKNOWN`.
- **Reason**: Captured DTOs permit targeted correction without inventing admin write contracts or deleting necessary compatibility behavior where the backend response remains unavailable.

### Decision 14: Do Not Retry a Known-Unauthorized Test-Case Read
- **Context**: A direct authenticated `GET /question/{id}/testCases` returned `401 Authentication required` on 2026-10-23, while `GET /question/{id}` returned the backend's separate `500 Question Fetch Unsuccessfull` error for a current catalog record.
- **Decision**: Catalog fallback no longer issues the test-case GET after a failed detail request. It maps only cases returned in the catalog DTO and visible description content. The separate `POST /question/{id}/testCases` admin mutation is retained unchanged.
- **Benefits**: Removes a predictable failed request from each affected question-detail fallback without replacing server-owned cases with mock or browser data.

### Decision 15: List DTOs Are Not Detail DTOs
- **Context**: `POST /questions` provides list fields such as `difficultyName`, `topicName`, and `questionPlatform`, but does not establish the full admin `Question` DTO. Historical code constructed missing reference codes, platform aliases, and test cases from that list response.
- **Decision**: The problem-list mapper now consumes only captured list fields. `questionService.getById` makes the numeric detail request and propagates its error rather than fabricating a full result from the list fallback. Admin and user pages consume one API envelope layer (`response.data`) only.
- **Benefits**: A backend detail defect is visible and actionable, while list pages remain correctly populated from their actual API contract.

### Decision 16: Company Read DTOs Do Not Use URL Aliases
- **Context**: Live `POST /company/list` and `GET /company/{id}` records expose `logo` and `website`; the admin form and views incorrectly read/write local `logoUrl` and `websiteUrl` aliases.
- **Decision**: The shared company type, admin validation form, list/detail views, and company save payload use `logo` and `website` only. This exact request shape is `PARTIALLY VERIFIED` because no production mutation was made.
- **Benefits**: Read data is visible in admin editing and display paths without an alias fallback, and request construction is constrained to the server's observed entity names.

### Decision 17: Postman MCP Limitation Is Not Contract Evidence
- **Context**: The required Postman MCP authentication succeeded, but `getEnabledTools` repeatedly returned an auth-handshake message and the discovered surface exposed workspace-resource operations rather than a live request sender.
- **Decision**: No Postman collection, example, or summary was treated as contract authority. This repository retains only direct live read evidence and labels unexecuted mutation contracts as unverified.

---

## 3. Unresolved Questions & Future Work

0. **MCQ Option Data Is Missing for Existing Records**: `POST /mcq` on 2026-10-23 returned 10 records with option counts `4, 4, 4, 0, 0, 0, 0, 0, 0, 0`. `GET /mcq/4` likewise returned `options: []`. The aptitude UI is correctly rendering the API's empty collection and must not fabricate answer choices or correctness. Repair requires populating those MCQ option rows through the admin authoring API or backend data migration, then verifying `GET /mcq/{id}` returns the documented `options[].id`, `optionLabel`, `optionText`, and `isCorrect` fields.

1. **Backend Submission Patch**: Coordinate with backend engineering to add null safety checks to `TestCase.getType()` in Spring Boot code submission service to enable full submission execution.
2. **Real-Time Notification Websocket**: Currently notifications and progress updates are pulled via HTTP; evaluate Stomp/Websocket integration if live multi-user contests are introduced.
3. **Draft Features Activation**: The `/interviews` and `/roadmaps/:slug` features are toggle-gated behind `VITE_SHOW_COMING_SOON`. Once backend endpoints for roadmaps are finalized, toggle `VITE_SHOW_COMING_SOON=false` to promote them to production.
4. **Base Profile and Avatar Mutation**: `/user/profile` is unmapped in the available direct probes. Name/email are session-derived and read-only, and avatar editing is disabled until the backend exposes a verified mutation contract.
5. **Exam Section Reference IDs**: Admin exam-section forms currently use IDs observed in the existing payload implementation (`sectionType` 99/100 and `questionType` 87/88/89). No verified reference-library group for these fields exists in the repository evidence; backend confirmation is required before replacing them with a dynamic group.
6. **High-Stakes Proctoring Contract**: A secure assessment mode requires backend-owned exam-session state, server-side attempt/time limits, signed audit events, and a reviewed proctoring/privacy policy. No such verified API contract is present in this repository.

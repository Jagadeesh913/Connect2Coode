# 09. Known Issues, Architectural Decisions & Trade-Offs

## Public prerendering and indexing boundary (updated 2026-10-30)

- **Status**: `PARTIALLY VERIFIED`
- **Decision**: The crawler-only User-Agent rewrite and metadata-only response were removed. [`scripts/generate-seo-assets.mjs`](../../scripts/generate-seo-assets.mjs) now produces meaningful route-specific HTML for the five stable public hubs, so browsers and crawlers receive the same document before React mounts. It also emits the canonical apex sitemap, a separate noindex application shell, and a noindex `404.html`.
- **Privacy and failure behavior**: [`vercel.json`](../../vercel.json) allowlists valid SPA deep links, sends `X-Robots-Tag` headers for authentication, authenticated, admin, API-backed detail, coming-soon, and error routes, and rewrites those routes to the noindex shell. Unknown paths no longer use a catch-all 200 rewrite. The client metadata owner still replaces route metadata on SPA navigation and accepts dynamic names only from a successful current-route response.
- **Authenticated dynamic-data boundary**: The documented question/company/exam list and detail contracts require bearer authentication; a deployment build must not receive or expose a user credential. Those detail URLs are therefore excluded from the sitemap and remain `noindex` until the backend provides an approved public read contract or the application gains credential-safe server rendering. No slugs or entity data are fabricated when API calls fail.
- **Deployment boundary**: Build output and routing configuration are regression-tested locally, but Vercel response status/header behavior, production DNS, apex/`www` redirects, and social-debugger fetches remain `PARTIALLY VERIFIED` until a deployment owner validates them. Production must set `VITE_SITE_URL=https://connect2code.in`; indexing is a later Google-controlled outcome and is never implied by a successful build.

---

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
- **Frontend Mitigation**: Numeric IDs require a valid `GET /question/{id}` detail response and preserve any backend failure. Only legacy text slugs scan the paginated `/questions` catalog to resolve a numeric identity. A catalog row is never presented as a complete numeric detail DTO.

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

### 5. `POST /api/v1/questions` HTTP 500 on Oversized `pageSize` & Paginated Slices (Corrupted Records 24..47)
- **Observed Behavior**: Historical frontend workarounds assumed certain `/questions` page slices failed and attempted to stitch smaller responses. Those observations are not treated as a backend contract because the backend source and complete DTO contract were unavailable for this audit.
- **Decision**: The hard-coded 24/50 record counts, slice stitching, tail probes, per-record micro-batching, and client-side filtered recovery were removed. One requested page now produces one API request, successful metadata is preserved as returned, and malformed or failed responses remain failures.
- **Release boundary**: This prevents a frontend request storm and false success, but it does not repair corrupt backend data. Every page and filter must work through the normal contract before question discovery is production-ready.

### 8. Admin authorization returns HTTP 500 for an ordinary user
- **Observed Behavior**: Historical Postman evidence shows the admin institution read succeeds for an ADMIN account, while a separate USER request returns HTTP 500. It does **not** establish that the USER obtained admin data.
- **Required Backend Repair**: Enforce authorization before handler/database work and return 403 for an authenticated non-admin (401 only when unauthenticated). Repeat the matrix across every admin endpoint with confirmed USER and ADMIN identities.
- **Frontend Boundary**: Route guards are presentation controls, not authorization. The frontend preserves the backend error and cannot prove or implement server-side RBAC.

### 9. Postman workspace contract and credential hygiene
- **Status**: `NOT WORKING`
- **Observed State**: The former “All 32” collection contains only five requests. It has now been renamed as the canonical contract, parameterized with `{{base_url}}` and an empty `{{access_token}}`, and verified free of legacy Render URLs, literal JWT-like values, and request-level Authorization headers. Other diagnostic collections remain fragmented, some assertions pass unconditionally, and the credential previously embedded in collection data still requires owner-side revocation/rotation.
- **Required Operations**: Revoke/rotate the exposed credential, remove all secrets, consolidate one canonical environment and collection against `https://api.connect2code.in/api/v1`, replace unconditional tests with contract assertions, and version the result. The current workspace is historical evidence, not a complete authoritative specification.


### 6. Learning Sheet Section 4 Question Read Returns HTTP 500
- **Observed Behavior (2026-10-25)**: An authenticated `GET /api/v1/user/learningSheet/section/4/questions` reaches the production Spring Boot handler but returns HTTP 500 with `"Error while retrieving Learning Sheet Questions"` and only the generic error `"An unexpected error occurred"`. The same route without authentication correctly returns HTTP 401, confirming that the failing request is past the authentication boundary.
- **Root-Cause Boundary**: The exception is produced inside the remote backend before a question-link array is returned. This frontend repository contains no learning-sheet controller, entity, repository, mapper, database migration, or backend logs, and the generic response removes the underlying exception. The exact server defect is therefore `UNKNOWN` until the backend exception trace and the section-4 association rows are inspected. Likely candidates that must be distinguished server-side are an empty-section branch incorrectly treated as exceptional, an orphaned `learning_sheet_question` association, or an incomplete linked question that fails nested DTO mapping.
- **Required Backend Repair**: Inspect the exception for this request and the section-4 link rows; return `200` with `data: []` when the section exists but has no links, return `404` when the section does not exist, and reject or skip orphaned/incomplete associations without dereferencing nullable relationships. The link-creation service should validate the section and question before persisting and the database should enforce foreign keys. Any corrupt association should be removed by its link ID only after it is positively identified.
- **Frontend Boundary**: [`learningSheetService.getSectionQuestions`](../../src/services/learningSheetService.ts) intentionally preserves the backend failure. It must not translate HTTP 500 into a successful empty list because that would hide corruption and falsely tell users that a populated section is empty.

### 7. Reference Library Cache Deployment Failure (Backend; Repair Reported)
- **Observed Behavior (2026-11-01)**: An authenticated Postman MCP run confirmed `GET /api/v1/referenceLibrary/refGroupCode/list` returns HTTP 200 with 15 group codes. In the same authenticated session, a per-group record read returned HTTP 500 because Spring could not find cache `referenceCodesByGroup`; the user-supplied `DIFF` response demonstrates the intended five-field DTO but the current deployment is not consistently serving it.
- **Current Verification Boundary**: Authentication and the group-code catalog are `RUNTIME-VERIFIED`. Per-group records and all reference mutations remain `NOT WORKING`/`PARTIALLY VERIFIED` at the live-backend boundary until the missing cache is configured. No production create, update, or hard-delete mutation was executed during verification.
- **Frontend Boundary**: The per-group URL did not change. The frontend continues to use it for dropdown records and uses `/refGroupCode/list` only to discover group names. It surfaces backend failures, validates successful DTOs, and never converts a 500 into a false empty result or static fallback.


---


## 2. Key Architectural Decisions & Rationale

### Decision 0: Learning Sheet API as the DSA Sheet Product Boundary
- **Context**: The backend exposes a generic `learningSheet` name, but the supplied product scope is DSA preparation only. The section-question response also returns `sectionId: null`, even though the request path already identifies the owning section; no sheet delete or child-section read endpoint was supplied. Admin editing reuses the existing save POSTs by including the resource/association `id` only in edit mode.
- **Decision**: Present the feature exclusively as **DSA Sheet** in routes and UI while preserving the backend endpoint names in services. Treat the outer question-link `id` as the association deletion ID, navigate to problems using nested `question.id`, retain only top-level sections (`parentSectionId: null`), and do not invent editing, sheet deletion, or nested-section behavior.
- **Authentication Boundary**: Every authenticated method uses the bearer token automatically attached by `apiClient`; request bodies contain business fields only and bodyless DELETE requests remain bodyless.
- **Verification Boundary**: Endpoint formatting, response validation, ordering, and DELETE request shape are locally runtime-tested. Live production reads and admin mutations remain `PARTIALLY VERIFIED` because this implementation did not mutate production data.

### Decision 1: Local Recruiter Logos in `public/companies/`
- **Context**: The backend company records contain empty or broken remote logo URLs.
- **Decision**: Keep 121 vector SVG and high-resolution PNG files in `public/companies/` as the first source, expose every unique bundled brand through `companyLogoRegistry.ts`, and ignore arbitrary backend logo URLs. For new companies, derive candidates from the validated website domain: optional Brandfetch, Simple Icons, official favicon, then a deterministic monogram.
- **Benefits**: Known brands retain fast same-origin assets and consistent aspect ratios, while new API-created companies receive useful branding without a frontend release. The terminal monogram keeps the UI stable when a remote source is unavailable.
- **Limitation**: Brandfetch's advertised 95%+ core-brand coverage is vendor-reported, not a measured guarantee for Connect2Code. Production coverage depends on a configured public client ID, valid API website fields, provider availability, and the actual company population.

### Decision 2: Central, Non-Mutating Request and Response Ownership
- **Context**: Legacy services independently read credentials, injected multiple token spellings, supplied Axios-specific DELETE bodies, and guessed whether a result was an Axios response, a backend envelope, or a nested payload. That distributed transport policy caused duplicates, inconsistent names, caller-payload mutation risk, and false empty states.
- **Decision**: `apiClient` authenticates exclusively with the bearer header and recursively removes `jwtToken`, `token`, `jwttoken`, and `jwt_token` from every outgoing body. Its TypeScript facade models the response interceptor's unwrapped `ApiResponse<T>` behavior; services send business fields and consume one envelope layer only. Live comparison proved body-token-only authentication returns 401.
- **Benefits**: Authentication and envelope rules now have one owner, service payloads remain reusable and testable, and malformed successful responses fail explicitly instead of passing through compatibility guesses.

### Decision 3: Option-Level `isCorrect` Flag for MCQs
- **Context**: In the MCQ Bank, questions contain top-level fields (`correctOption: "A"`, `correctAnswer: "15"`) and an array `options: [{ optionLabel: "A", isCorrect: false }, { optionLabel: "B", isCorrect: true }]`. When an author updates an MCQ to change the correct option from A to B, the backend updates `options[].isCorrect` but may leave the top-level `correctOption` unchanged.
- **Decision**: In `mcqUtils.ts` and `AdminMcqs.tsx`, option correctness is determined strictly by checking `isCorrect: true` on individual option objects. Admin saves serialize only `id`, `optionLabel`, `optionText`, and `isCorrect`; stale top-level strings and unverified aliases (`correct`, `is_correct`, `optionId`) are neither read as authority nor sent.
- **Benefits**: Editing an MCQ's correct option works reliably and immediately in the UI.

### Decision 4: Java Class Renaming to `Main` for Judge0
- **Context**: Judge0 Java compiler expects a class with a `public static void main` method located in a class named `Main`. Students frequently write LeetCode-style code with `public class Solution`.
- **Decision**: [`src/services/executionService.ts`](../../src/services/executionService.ts) automatically substitutes `public class Solution` with `public class Main` before dispatching code to `/runCode`.
- **Editor ownership**: `AppRouterLayout` is the only assessment-integrity event owner. `ProblemDetails` retains a plain workspace ref for fullscreen targeting, avoiding duplicate capture listeners around Monaco. Historical submission source is restored into the language identified by the submission's table/reference ID; unavailable runtimes are reported instead of silently loading code into a different selected language.

### Decision 5: Language Reference ID Mapping
- **Context**: The database language table assigns IDs 1-4 (e.g. 1 = Java, 2 = C++, 3 = Python, 4 = C). However, the Judge0 execution engine expects Reference IDs 5-8 (5 = Java, 6 = C++, 7 = Python, 8 = C).
- **Decision**: `executionService.resolveLanguageReferenceId` maps a table ID or already-resolved reference ID only when it is present in the dynamic `/language` catalog. Static ID ranges and positive-ID pass-through were removed because they could execute code with a wrong backend reference after registry changes.

### Decision 6: Backend-Owned Refresh Cookie and Memory-Only Access Session
- **Context**: The previous client mirrored credentials and profile objects into `localStorage` and `sessionStorage`, while the profile page retained an unscoped academic-record cache. This contradicted the documented storage policy and could leave sensitive data after a session.
- **Decision**: Access tokens and session identity remain only in memory/Redux. Login/refresh responses must contain a non-empty access token (`token` or the backend compatibility alias `accessToken`), `id`, `role`, and `email`; the authentication boundary normalizes either access-token spelling to canonical `token`. The frontend exposes no refresh-token storage API and sends no refresh token in refresh/logout bodies; the backend owns the HttpOnly cookie and its rotation/revocation. Startup refresh is unconditional, and refresh rotation is serialized both within and across tabs. Logout clears memory, Redux caches, and the departing user's persisted cache while preserving only theme preference.
- **Guardrail**: Only refresh HTTP 401 proves the cookie invalid and clears authentication. Network, malformed response, and 5xx failures preserve an active session or enter the startup retry gate. Legacy readable refresh-cookie cleanup remains a backend `Set-Cookie` migration responsibility because frontend JavaScript must not manage that cookie.

### Decision 7: Server Authority for Admin Test Cases and Submission History
- **Context**: Admin question metadata and test cases were overridden or retained in browser storage, and two hard-coded fixtures included hidden evaluation cases. `ProblemDetails` also mirrored submitted source code and results even though the submission-history endpoint is available.
- **Decision**: Use API payloads as the sole source for admin question metadata, test cases, and authenticated submission history. A failed test-case save reports an error and leaves the modal open. Visible Input/Output examples may be parsed from backend descriptions for display, but missing test-case classification fields remain blank and must be selected from backend reference data. ID/title-based sample fixtures and invented hidden cases are prohibited.
- **Boundary**: Problem bookmarks remain server-authoritative. COMPANY/APTITUDE bookmarks have no corresponding API endpoint and use only user-scoped browser persistence; the persistence middleware explicitly excludes server-owned problem bookmarks.

### Decision 8: Deterministic Redux State and Request Ownership
- **Context**: Bookmark/progress reducers wrote browser storage directly; bookmark identity ignored item type; async profile/progress responses could apply after the active user changed; and incomplete refresh responses could not safely restore authorization after reload.
- **Decision**: Keep server-owned bookmarks only in Redux memory, key mutations by `type:itemId`, and guard user-specific async results with request/user ownership. Authentication rejects refresh responses that omit required identity/role fields. Logout clears the prior user's persisted scope so cached progress, bookmarks, and drafts do not survive the session.
- **Benefits**: Reducers stay deterministic, independent mutations compose safely, and late network responses cannot leak or overwrite another user's state.

### Decision 9: Shared Reference Taxonomy and API-Only Platform Metadata
- **Context**: Forms independently fetched the same reference groups, valid empty responses were fetched repeatedly, question IDs were mapped to hard-coded platform names, and exam sections embedded numeric classification IDs.
- **Decision**: All component-level reference group-record consumers use `referenceSlice` through `useReferenceGroup`, with TTL, force invalidation, and per-group request ownership. The separate group-code catalog remains a validated service read. Difficulty, platform, exam-section type, question type, and other taxonomy values come only from API records; missing records stay unavailable rather than being replaced by static DTOs or legacy numeric IDs. Problem platform identity comes only from returned question fields (`qpfId`, `questionPlatform`, `qpfRefCode`, `qpfRefName`, `examPlatform`, `platformName`, or `platform`).
- **Benefits**: Navigation and Strict Mode no longer amplify identical reference calls, and the UI cannot silently assign a taxonomy value based on an old constant, question ID, or title.

### Decision 10: Assessment Integrity Is a Client Deterrent, Not a Trust Boundary
- **Context**: The site previously allowed normal clipboard/context-menu/drag-drop operations, and the coding workspace could transfer source through the operating-system clipboard. Its custom-input control also did not send the API-supported `customInput` field.
- **Decision**: `AppRouterLayout` applies `useAssessmentIntegrity` and the protected-surface CSS class only outside the `/admin` route tree. Learner-facing routes restrict native clipboard events, selection/export affordances, context menus, middle-click paste, drag/drop, Print Screen and known screenshot shortcuts, plus source/open/save/print browser exports; admin pages retain normal clipboard, selection, context-menu, drag/drop, print, and browser behavior. Developer Tools and their standard shortcuts remain available everywhere by product decision. On protected problem workspaces, Monaco alone receives an editor-local clipboard backed only by an in-memory string; Ctrl/Cmd+C, X, and V never read or write the OS clipboard. Protected-route print suppression, a focus-loss privacy curtain, and opt-in fullscreen/keyboard-lock secure mode add capture and navigation deterrence without rendering a watermark. Deployment headers deny framing and in-page capture APIs. The runner sends `customInput` only for the explicit custom-input action, restores drafts through user-scoped problem/language keys, sanitizes infrastructure URLs from execution failures, and never invents runtime/memory quality labels.
- **Boundary**: Client JavaScript cannot reliably prevent extensions, operating-system screenshots, cameras, another browser/device, or modified clients. There is no verified backend endpoint for proctoring telemetry, violation storage, or exam session enforcement. Strong enforcement therefore requires a managed kiosk or secure assessment browser and server-owned audit/session policy; the web client reports only best-effort deterrence.

### Decision 11: Security Overrides and Direct Upgrades Track Published Fixes
- **Context**: The Monaco editor's transitive DOMPurify dependency received newly published critical advisories, and the direct Zod 3 dependency was later reported vulnerable to memory exhaustion while validating oversized constrained collections.
- **Decision**: Keep the existing root `overrides` mechanism and pin DOMPurify to `3.4.17`. Upgrade the direct Zod dependency independently to `4.6.7`, migrate its error/type APIs, and verify form behavior rather than using an unreviewed bulk `npm audit fix --force`.
- **Verification**: `npm audit --omit=dev` reported `0 vulnerabilities` on 2026-10-24; all validation tests, type checking, lint, and the production build passed after the Zod 4 migration.

### Decision 12: Credential-Free Cross-Tab Session Synchronization
- **Context**: Browser cookies are shared between tabs, but Redux state and the in-memory access-token cache are per tab. Logging out in one tab previously left another tab displaying an authenticated session until reload or a failed request.
- **Decision**: Publish only `{ type, occurredAt }` lifecycle events. The subscriber attaches to the same singleton `BroadcastChannel` used by the publisher in that tab: `BroadcastChannel` does not echo to its sending object, preventing a successful login from being mistaken for a remote-tab update and immediately discarded. Other tabs use distinct objects and still reconcile through a cookie-backed refresh. Recipients clear per-tab memory/Redux on logout or refresh-401. The browser's atomic Web Locks API serializes rotating-cookie refresh requests without placing tokens or user data in the signal. A `localStorage` lease was rejected because read/write operations cannot implement atomic mutual exclusion. Browsers without Web Locks fail refresh safely before issuing the request. Ordinary token rotation does not broadcast another refresh cascade.
- **Boundary**: This synchronizes tabs in the same browser origin when Web Locks are supported. Server-side token revocation remains authoritative for other devices, browsers, or sessions. Two-tab behavior and deployed cookie rotation remain `PARTIALLY VERIFIED` until exercised against the live backend.

### Decision 13: API-Field Audit Uses Captured Backend Evidence
- **Context**: Read-only production captures on 2026-10-23 established exact DTOs for authentication, languages, references, MCQs, question lists, company reads, user progress lists, and institution search. The temporary account subsequently returned `401 Invalid Email or Password`, so no production mutation was attempted or inferred.
- **Decision**: Strictly map the captured `GET /language` field `languageName` (not an undocumented `name` alias) and company read fields `name`, `logo`, and `website` (not `companyName`, `logoUrl`, or `websiteUrl`). The MCQ path remains strict: it consumes and sends only `id`, `optionLabel`, `optionText`, and boolean `isCorrect`. Uncaptured mutation and detail contracts remain `UNKNOWN`.
- **Reason**: Captured DTOs permit targeted correction without inventing admin write contracts or deleting necessary compatibility behavior where the backend response remains unavailable.

### Decision 14: Do Not Retry a Known-Unauthorized Test-Case Read
- **Context**: A direct authenticated `GET /question/{id}/testCases` returned `401 Authentication required` on 2026-10-23, while `GET /question/{id}` returned the backend's separate `500 Question Fetch Unsuccessfull` error for a current catalog record.
- **Decision**: Numeric detail failures are propagated unchanged. A catalog row is never promoted to successful detail data, and no speculative test-case request follows the failure. The separate `POST /question/{id}/testCases` admin mutation is retained unchanged.
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
- **Context**: Earlier sessions could inspect workspace resources but not execute live collection requests. On 2026-11-03 `getEnabledTools` reported the full 233-tool MCP surface; live read-only contract probes were executed with Postman CLI because the MCP collection itself is incomplete and contains legacy-host requests.
- **Decision**: Collection metadata remains discovery evidence only. Request/response claims require a completed live read or an executable repository test; unexecuted mutation contracts remain unverified.

### Decision 18: Async Lists Own Their Visible Query

- **Context**: Problem, aptitude, and admin catalog pages could retain records and totals from an earlier filter or page while a different request was pending. Rapid DSA admin selection changes could also allow a superseded section or question response to render under the new selection.
- **Decision**: An uncached query clears mismatched visible records and renders its existing skeleton state; same-query refreshes may retain data. Page controls lock while pending. DSA admin reads abort superseded sheet, section, linked-question, and question-option requests, and mutation handlers reject duplicate submissions.
- **Accessibility**: Filter choices are keyboard-operable toggle buttons. Shared destructive confirmations use safe initial focus, focus containment/restoration, unique accessible IDs, and scroll locking.
- **Verification boundary**: Reducer transitions and source interaction contracts are automated. Live authenticated admin mutations and assistive-technology browser sessions remain `PARTIALLY VERIFIED`.

### Decision 19: URL State, Scroll, and Loading Geometry

- **Context**: Company pagination was previously simulated by downloading every backend page and slicing a locally filtered array. Live probes later proved that `/company/list` supports pagination but ignores all attempted search fields and provides no industry filter contract.
- **Decision**: Company page state round-trips through the URL and each page change calls `/company/list`. Unsupported search and industry controls were removed rather than presented as server filters. Explicit page changes scroll the result boundary into view, while React Router's `ScrollRestoration` remains authoritative for route back/forward restoration. Route chunks, admin refreshes, DSA hierarchy loads, company modal subresources, and detail records use geometry-matched shimmer states until the owning response arrives.

### Decision 23: Server Pagination and Filter Ownership

- **Context**: Practice requested only `{ page: 1, limit: 100 }` and locally filtered/sliced the returned rows. Company lists loaded all 57 companies, and company detail tabs fetched fixed first pages (50 questions or 20 exams) before filtering locally. These patterns produced plausible but incomplete totals and controls that made no request.
- **Decision**: Every visible catalog page control now changes a request page. Every visible question/MCQ filter maps to an observed backend field and numeric reference ID. Practice uses `level`, `topic`, `companies`, `platform`, `searchText`, and `pageRequest`; company-detail MCQs use `subject`, `difficulty`, `companies`, `searchText`, and `pageRequest`. Unsupported company search/industry and client-only difficulty sort/status catalog filters are not shown. This is runtime-verified with read-only Postman probes and regression-tested at source-contract level.
- **Concurrency**: Problem queries begin in a layout effect so a changed URL cannot paint the previous query's rows for one frame. DSA hierarchy selection uses current-selection refs and abort ownership so a refresh cannot leave a downstream loader stuck.

### Decision 20: Dynamic Admin Dashboard Metrics & Code Execution Sandbox Overhaul

- **Context**: `/admin/dashboard` previously rendered static starter code hardcoded for Problem #1 ("Find the Largest Element from the Array") across all languages and problems. The question catalog in the sandbox clamped page loading to 25 items (`Math.min(totalPages - 1, 4)`), while problem detail and test case endpoints on Spring Boot periodically threw 500 or 401 for specific IDs (e.g. ID 6). Additionally, difficulty metrics hardcoded numerical indices (`[1]`, `[2]`, `[3]`) without matching reference codes (`DIFF`), and MCQ count queries crashed with 500 when passing empty filter arrays.
- **Decision**:
  - **Dynamic Starter Code**: Generated dynamically per selected problem title, ID, and runtime language (`java`, `python`, `cpp`, `javascript`). Question-specific working solutions are not bundled in the admin client.
  - **Scoped Code Drafts**: Preserves edited code drafts in local state indexed by `${questionId}_${languageId}`, preventing edits from being overwritten when toggling between problems or languages.
  - **Authoritative Question Loading**: Numeric detail errors remain errors; catalog/cache rows are not substituted as full detail DTOs. Test-case classification values are preserved only when supplied by the API/reference selection.
  - **Authoritative Metrics & Difficulty Resolution**: Dynamically maps difficulty levels through `useReferenceGroup('DIFF')` instead of assuming sequential IDs. A metric request is omitted when its API reference is unavailable; no legacy fallback ID is sent. Integrates `learningSheetService.getSheets` to populate the 8th metric card (`DSA Sheets`) in a balanced 4x2 grid.
  - **Safe MCQ Pagination Contract**: Sanitizes `adminMcqService.getMcqs` payload to include full `pageRequest` and empty filter arrays, preventing Spring Boot 500 NPEs.

### Decision 21: CodeRabbit Frontend Review Remediation Boundaries

- **Context**: The local CodeRabbit report grouped seven actionable frontend findings and used F-08 for two different UI concerns. Its F-09 claim treated the code-runner draft state as unused even though functional state updates read and preserve that cache.
- **Decision**: Confirm findings against source and callers before editing. `ProfileSettings` remains limited to session identity and `/userInfo/{userId}` fields. Authentication no longer decodes JWT expiry/roles for refresh or authorization routing: protected HTTP 401 drives refresh and backend response role drives UI routing. Question-bank recovery cannot publish partial pages as success.
- **Not applicable**: F-09 requires no code change because `_codeDrafts` is the previous-state value used by functional `setCodeDrafts` updates. Removing it would discard existing per-question/per-language drafts.
- **Boundary**: No Spring Boot implementation, endpoint, request field, or API contract was changed. The two F-08 descriptions are tracked independently: carousel background motion is covered with the carousel remediation, while mobile option alignment is covered in the aptitude UI.

### Decision 22: CodeRabbit N-01–N-08 Follow-Up Ownership

- **Theme ownership (N-01/N-02)**: `theme_pref` is authoritative in `userScopedStorage`. A legacy global theme may seed the guest scope without being consumed, then migrates once into an authenticated account scope and is removed. Direct setters and toggles use one scoped persistence path.
- **Profile continuity (N-03/N-04)**: The personal modal uses the same session identity fallbacks as the profile header. Token-only session refresh actions preserve the current identity, fetched-null marker, and `/userInfo` cache; an explicit account change still clears them.
- **Runner concurrency (N-05/N-06)**: Catalog merges update a ref without retriggering question details. Reload, search, and load-more responses are generation-owned; superseding operations clear stale loading flags, empty searches preserve catalog pagination, and search filtering covers every service-matched list field. Per-question/per-language draft state remains required and regression-tested, so F-09 is still not applicable.
- **Accessibility and iconography (N-07/N-08)**: Reduced-motion users receive a truthful disabled-control label. Inactive carousel slides are inert, hidden from assistive technology, and excluded from the tab order. Aptitude correctness marks use `lucide-react` `Check` and `X` components.

### Decision 24: Authentication Contract and Data-Recovery Remediation Boundary

- **Context**: The supplied source audit identified authentication-contract violations, unsafe partial filtered-question recovery, a degraded question-detail fallback, unscoped company search recovery, synthesized classification metadata, and missing-identity paths that reported false empty data. Each claim was rechecked against active source and callers; project documentation and Postman artifacts were not treated as contract evidence.
- **Decision**: Filtered and paginated `/questions` recovery is accepted only when completeness is proven; numeric detail failures are never hidden by catalog rows. Authentication follows the backend-owned HttpOnly refresh-cookie contract, uses same-tab and cross-tab locking, and distinguishes refresh 401 from temporary failures. Missing required user IDs reject rather than returning fake empty data. Company-ID question requests never fall back to an unscoped text search.
- **Verification boundary**: Source and unit/runtime regression tests cover these frontend behaviors. The Spring Boot source was not present in the public repository and no live integration or mutation was executed; unprovided backend DTOs remain `UNKNOWN` and admin mutation endpoints remain `PARTIALLY VERIFIED`.

---

## 3. Unresolved Questions & Future Work

0. **MCQ Option Data Is Missing for Existing Records**: `POST /mcq` on 2026-10-23 returned 10 records with option counts `4, 4, 4, 0, 0, 0, 0, 0, 0, 0`. `GET /mcq/4` likewise returned `options: []`. The frontend now checks detail when an affected question is opened, but a detail response with no options correctly remains unanswerable. Repair still requires populating those option rows through the admin authoring API or backend data migration, then verifying `GET /mcq/{id}` returns documented `options[].id`, `optionLabel`, `optionText`, and `isCorrect` fields.

1. **Backend Submission Patch**: Coordinate with backend engineering to add null safety checks to `TestCase.getType()` in Spring Boot code submission service to enable full submission execution.
2. **Real-Time Notification Websocket**: Currently notifications and progress updates are pulled via HTTP; evaluate Stomp/Websocket integration if live multi-user contests are introduced.
3. **Draft Features Activation**: The `/interviews` and `/roadmaps/:slug` features are toggle-gated behind `VITE_SHOW_COMING_SOON`. Once backend endpoints for roadmaps are finalized, toggle `VITE_SHOW_COMING_SOON=false` to promote them to production.
4. **Base Profile and Avatar Mutation**: `/user/profile` is unmapped in the available direct probes. Name/email are session-derived and read-only, and avatar editing is disabled until the backend exposes a verified mutation contract.
5. **High-Stakes Proctoring Contract**: A secure assessment mode requires backend-owned exam-session state, server-side attempt/time limits, signed audit events, and a reviewed proctoring/privacy policy. No such verified API contract is present in this repository.
6. **Deployed Refresh Response**: Verify that `POST /api/v1/auth/refresh` returns non-empty `token`, `id`, `role`, and `email`, and rotates the HttpOnly refresh cookie with the intended `Secure`, `SameSite`, Domain, and Path attributes. The frontend intentionally rejects incomplete identity payloads; this frontend checkout cannot prove the deployed Spring response.
7. **Live Multi-Tab Rotation**: Run two real same-origin browser tabs against the deployed backend and verify that Web Locks allow only one in-flight refresh-cookie rotation, including simultaneous protected 401 responses. The automated lock test is not a substitute for observing real `Set-Cookie` behavior.
### Decision 25: Post-remediation CodeRabbit residual race and error-state fixes (2026-11-04)

- A login now claims authentication-session epoch ownership before its request without clearing an existing valid session. This makes an older refresh result stale while preserving protection from a later logout or newer login.
- OAuth provider error callbacks retain any existing authenticated Redux session instead of creating a cookie/Redux split-brain state.
- Admin dashboard difficulty-reference failures are reported once rather than copied into both reference and metric error channels.
- Refresh-thunk cleanup is epoch-owned, so an older failed refresh cannot clear or invalidate a newer login attempt.
- Practice-list request dependencies are stable by resolved filter value, preventing reference hydration from aborting and resending an equivalent `/questions` request.
- Profile loading always requests the session-owned profile even when no numeric user ID is available; numeric IDs remain required only for user-info and progress endpoints.
- Admin company autofill uses the complete paginated company catalog rather than only the currently visible admin table page.
- Sanitized `FormData` requests clear the inherited JSON content type so Axios/browser multipart handling supplies the required boundary.
- The legacy theme key is migration-only; all new guest/account preferences remain in `userScopedStorage`, and auth-status transitions reload the correct scope after startup refresh success or failure.

### Decision 26: Phase 1 frontend contract remediation boundary (2026-11-05)

- **Authentication**: `/institutions/search` is protected because the supplied Postman audit observed anonymous 401 and Bearer-authenticated 200. The detail endpoint remains unchanged because its authentication requirement was not separately re-verified.
- **MCQ list/detail split**: List rows without options remain valid catalog rows. Aptitude fetches `/mcq/{id}` only after the user asks to load that card's options; Company Preparation fetches detail when the solve modal opens. Detail errors remain visible and retryable, and an empty detail `options` array remains unanswerable.
- **Execution normalization and secrecy**: Observed `time`, `memory`, `errors`, `stderr`, `stdout`, `compileOutput`, `message`, and `status` fields are retained without assigning unverified units. Hidden-case input, expected output, actual output, and case diagnostic text are stripped in the shared normalizer. A normal-USER live `/submitCode` response was not available in this checkout, so actual backend hidden-value exposure remains `UNKNOWN`; frontend masking is not a substitute for backend access control.
- **Bookmark and dashboard truthfulness**: Server bookmarks omit `savedAt` when the backend omits it. Admin system information now reports configured authentication and the session-supplied role without claiming live token validation or RBAC health.
- **Question pagination boundary (M-03)**: Offset recovery, hard-coded historical counts, tail probes, micro-batching, and client-side filter recovery were removed because they amplified failures and fabricated success. Backend repair and complete authenticated pagination verification remain release requirements.
- **Evidence boundary**: The connected Postman workspace was inspected, but its fragmented legacy collections and embedded credential prevent treating it as a canonical executable contract. No production mutation or complete live acceptance run was performed during this remediation.

### Decision 27: Phase 1 truthfulness, stale-response, and accessibility boundary (2026-11-06)

- **API authority**: Question catalog rows resolve identity only; numeric detail and embedded test cases come from one authoritative detail response. The speculative test-case GET, dashboard catalog-detail fabrication, and hardcoded question-specific working solution were removed.
- **Isolation**: Identity-changing auth transitions reset protected slices, and problem/DSA reducers require exact request ownership before any cache write. Same-user refresh retains appropriate state without allowing a pre-logout response to repopulate it.
- **UI truthfulness**: Fake newsletter success, unsupported resource labels, unmeasured adoption/content totals, named unverified testimonials, simulated compiler success, and live-health claims were removed or replaced with explicitly illustrative/configuration wording.
- **Accessibility**: Shared dialog lifecycle behavior covers login, profile editing, company MCQ solving, and admin focus restoration. Admin form labels were statically associated with their controls and multi-control sections received group semantics; an assistive-technology/browser run remains required before production certification.
- **External release requirements**: Approved privacy/terms/legal content, deployed-header/browser validation, an update policy for immutable GitHub Action pins, sanitized canonical Postman artifacts, and live backend authorization/execution acceptance remain outside the evidence available in this checkout.

### Decision 28: Untrusted external-link rendering boundary (2026-11-07)

- **Context**: Admin forms validate newly entered website URLs, but company, institution, and exam records returned by the API may predate those validators or be modified outside this frontend. Rendering those stored values directly in `href` left the browser boundary dependent on backend data hygiene.
- **Decision**: `getSafeExternalUrl` is the rendering guard for API-supplied external anchors. It permits only credential-free HTTP(S), rejects protocol-relative, backslash, invalid-host, and non-web-scheme values, and upgrades legacy bare hostnames to HTTPS. `getSafeRemoteImageUrl` additionally requires HTTPS and rejects local/private/link-local targets before session avatars or website-derived logos can trigger passive browser requests. Unsafe values fall back to non-clickable text, initials, or local logo assets.
- **Verification boundary**: Source coverage and regression cases were added, but the final test/typecheck/lint/build/browser matrix has not been executed in an OS-level sandbox, so this remediation remains `PARTIALLY VERIFIED`.

### Decision 29: Phase 1 boundary hardening and cache supersession (2026-11-07)

- **Network authority**: Production API and OAuth destinations are pinned to `https://api.connect2code.in`; build-time configuration cannot redirect authenticated traffic to an arbitrary origin. Development/preview overrides remain available only in local mode.
- **Account isolation**: User-scoped storage now versions and encodes the complete canonical identity instead of truncating it to a collision-prone 32-bit FNV value. Legacy hash keys are not read into the new scope because doing so could reintroduce collision data.
- **Untrusted DTOs and errors**: Error messages/status codes are type-guarded before string operations. MCQ pages/details and company exam/role/section payloads are mapped before rendering, and text company routes reject catalog records without a numeric backend ID instead of recursively reloading the catalog.
- **Request ownership**: Reference/language invalidation clears stale request ownership and forced refreshes can supersede in-flight reads. Admin question/MCQ detail controllers now reach the transport. Company practice data is lazy by selected tab; the admin company modal loads only its active tab, cancels on switch/close, and reads exam pages sequentially rather than with unbounded fan-out. Admin Questions owns one abortable company catalog request and passes that result into its form instead of downloading the same catalog again when the modal opens.
- **Sensitive browser output**: Expected API failures retain visible error/retry state without logging raw transport objects. Avatar and external links are HTTP(S)-guarded; avatar requests suppress the referrer.
- **Verification boundary**: Regression cases and static graph extraction cover these changes, but the full executable verification matrix and live backend/browser acceptance remain pending.

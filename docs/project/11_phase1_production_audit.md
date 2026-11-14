# Phase 1 — Production Readiness Audit Ledger

## 1. Meaning of completion

Phase 1 covers the frontend API-contract and production-readiness audit started at commit `afd62865dfc215705a34688d8f17ccfe1881d115`.

`COMPLETE` is permitted only when every frontend-owned item below is verified and every backend/deployment-owned item has objective acceptance evidence. A successful build alone is insufficient. “No possible defect exists” is not a testable claim; the release gate is **no known unresolved critical/high defect, no fabricated API data, and no unverified production-critical flow**.

Status vocabulary follows the repository standard: `VERIFIED`, `RUNTIME-VERIFIED`, `PARTIALLY VERIFIED`, `INFERRED`, `UNKNOWN`, and `NOT WORKING`.

## Company API/logo follow-up (2026-11-09)

- `POST /company/list` is verified with the paginated envelope and exact company fields `id`, `name`, `logo`, `website`, and `isActive`; user and admin logo surfaces use the validated API `logo` before fallback art.
- `/admin/companies` is a frontend route, not a verified backend endpoint. The active mutation target is `POST /admin/company`, while historical `POST /company` evidence conflicts; fresh authenticated admin evidence is still required before changing that endpoint.

## 2. Original checkpoint checklist

| ID | Original item | Current disposition | Status |
| :--- | :--- | :--- | :---: |
| H-01 / T-01 | Institution search must use protected authentication and attach Bearer credentials | Service and contract test were corrected. Live unauthenticated/authenticated acceptance still requires a fresh controlled run. | `PARTIALLY VERIFIED` |
| H-02 / T-04 | MCQ list rows without options must obtain detail before an answer UI is shown; correctness uses only `options[].isCorrect` | Aptitude and company flows now fetch detail on demand and expose loading/retry/empty states without inventing options. | `PARTIALLY VERIFIED` |
| M-01 / T-03 | Normalize execution fields, diagnostics, nullable values, and units from the observed contract | Shared normalizer handles `time`, `memory`, `errors`, `stderr`, `stdout`, `compileOutput`, `message`, and explicit-unit fields. A successful live submit contract is still unavailable. | `PARTIALLY VERIFIED` |
| M-02 / T-02 | Mask hidden execution input/expected/actual output in the shared boundary and verify normal-user behavior | Shared normalizer masks all three values when `isHidden === true`. Backend non-disclosure remains mandatory and needs a successful ordinary-user submit test. | `PARTIALLY VERIFIED` |
| M-03 | Remove hard-coded question totals, offset stitching, tail probes, and per-record fan-out after addressing the backend defect | Frontend workaround was removed. One requested page now produces one API request and real failures remain failures. The backend pagination/data defect is still an external release blocker. | `PARTIALLY VERIFIED` |
| M-04 | Do not fabricate server bookmark timestamps | Server records omit timestamps the API did not return. | `PARTIALLY VERIFIED` |
| L-01 | Do not label configured auth/RBAC as live-validated system health | Misleading labels and invented fallback role were removed. | `PARTIALLY VERIFIED` |
| Gate | Tests, typecheck, lint, build, architecture and docs checks pass after all changes | Fresh final-tree execution passed 402/402 tests, TypeScript, oxlint, Vite production build, architecture verification, documentation integrity, and `git diff --check`. Browser/password-manager/IME acceptance remains a separate manual gate. | `RUNTIME-VERIFIED` |
| Gate | No existing behavior is broken and final remediation report exists | Requires runtime journeys and external acceptance checks below. | `UNKNOWN` |

## 3. Deep-audit remediation checklist

### Authentication, authorization, and isolation

| ID | Check | Resolution / evidence required | Status |
| :--- | :--- | :--- | :---: |
| AUTH-01 | Login and refresh accept the deployed access-token field without exposing refresh credentials | The boundary now accepts the workspace-evidenced `token` and `accessToken` spellings and emits only canonical `token`; refresh-token fields remain discarded. Live 2026-11-07 evidence shows startup refresh reaches the backend but returns HTTP 401 `Refresh token missing` immediately after login/reload. The active `www` production origin passes credentialed CORS preflight, so backend login cookie issuance/attributes remain a release blocker. | `NOT WORKING` |
| AUTH-02 | A failed startup refresh cannot permanently hide login | Guest recovery retains the safe retry path and adds an explicit **Sign in instead** action that clears client access/profile memory and stale-response ownership without touching the HttpOnly cookie. Final interaction/browser verification is pending. | `PARTIALLY VERIFIED` |
| AUTH-03 | A startup or same-tab reconciliation refresh cannot overwrite a completed credential login | Reducer request ownership ignores stale startup settlement, and the cross-tab transport now shares one channel object per tab so the origin tab cannot consume its own login event and discard the new session. Static regressions cover both protections; browser confirmation remains pending. | `PARTIALLY VERIFIED` |
| AUTH-04 | Navbar and feature gates agree on authenticated state | Redux `isAuthenticated` is the sole navbar authority; nullable profile data no longer forces guest buttons during an authenticated session. Final rendered-browser confirmation remains pending. | `PARTIALLY VERIFIED` |
| AUTH-05 | Login fields do not show required-field errors before submission | Login validation now starts on submit, revalidates corrections on change, disables native form validation, and clears stale errors when leaving login mode. Final browser interaction confirmation remains pending. | `PARTIALLY VERIFIED` |
| AUTH-06 | Password typing cannot move focus to the modal close button or crash the global key handler | The dialog lifecycle no longer restarts when a close callback identity changes, login declares the email input as its initial-focus target, and shortcut classification safely accepts missing/non-string keyboard keys. Source regressions cover both root causes; password-manager/IME/mobile-browser acceptance remains pending. | `PARTIALLY VERIFIED` |
| UI-SELECT-01 | Dropdowns use product UI rather than default browser popups | `C2CSelect` provides a keyboard-accessible themed listbox for the code-editor language selector. Global CSS customizable-select picker styling also themes all existing native single-select menus in supporting browsers while retaining native accessibility fallback elsewhere. Cross-browser visual acceptance remains required. | `PARTIALLY VERIFIED` |
| UI-INTEGRITY-01 | Inactive-window assessment curtain matches product policy | The root router no longer renders the full-page “Assessment content protected” curtain when focus leaves the window. Clipboard/capture deterrence, tab-switch observation, and the explicit problem-workspace secure-mode control remain in place. | `VERIFIED` |
| THEME-01 | Authenticated theme preference uses the supplied API contract | `ThemeProvider` reads `GET /{userId}/getTheme` after authentication and serializes bodyless `POST /{userId}/theme/{isDarkTheme}` updates through `profileService` and the shared authenticated client. Service URL, payload, and response-shape tests cover the client boundary; live authenticated endpoint evidence remains pending. | `PARTIALLY VERIFIED` |
| UI-NOTIFY-01 | Notifications never stack stale messages or expose excessive text | All first-party callers use the single notification boundary, which dismisses the current message before rendering the replacement and limits visible message text to 140 characters. Browser visual/assistive-technology acceptance remains pending. | `PARTIALLY VERIFIED` |
| ADMIN-LOAD-01 | Admin list loading distinguishes first load from refresh | Shared `AdminTable` renders geometry-matched skeleton rows only when no data exists. During refetch it preserves usable rows and shows an `aria-busy` refresh indicator, avoiding destructive flicker while still communicating work in progress. | `PARTIALLY VERIFIED` |
| P1-01 | Public signup cannot choose an authorization role | `role` was removed from `SignUpPayload`; request construction writes `USER` after spreading caller data. Backend must independently ignore/reject caller role fields. | `PARTIALLY VERIFIED` |
| P1-07 | Refresh behavior on browsers without Web Locks is intentional and tested | Current policy fails closed when safe rotating-cookie coordination is unavailable. Product browser-support approval and cross-tab runtime tests remain required. | `PARTIALLY VERIFIED` |
| P1-08 | Logout/account switch cannot be undone by stale auth or protected-cache responses | Refresh is epoch/request-owned, identity changes reset protected slices, and problem/DSA cache writes require exact ownership. Final reducer/browser tests remain pending. | `PARTIALLY VERIFIED` |
| SEC-01 | Ordinary users receive 401/403—not 500—from admin endpoints | Prior Postman evidence shows a USER request to admin institutions returned 500. This is a backend authorization/error-handling defect; a bypass was **not** proven. | `NOT WORKING` |
| SEC-02 | Hidden test inputs/outputs never enter an ordinary user response | Frontend masking is defense-in-depth only. Verify the network response for successful submit and question detail using a USER account. | `UNKNOWN` |
| SEC-03 | User-ID path endpoints enforce ownership server-side | Client passes authenticated user IDs but cannot establish object-level authorization. Test same-user and cross-user IDs for progress, bookmarks, profile, and submissions. | `UNKNOWN` |
| SEC-04 | CSP restricts executable and network sources | Deployment CSP now defines default, script, style, font, image, connect, worker, object, frame, form and base policies. Validate Monaco workers, OAuth, fonts, logos, and API calls in deployed browsers. | `PARTIALLY VERIFIED` |
| SEC-05 | API-supplied links/images cannot execute schemes or passively probe local targets | Anchors pass through a credential-free HTTP(S) guard; avatars and website-derived logos additionally require HTTPS and reject local/private/link-local targets. Final automated/browser verification is pending. | `PARTIALLY VERIFIED` |
| SEC-06 | Production configuration cannot redirect API/OAuth traffic to an arbitrary origin | Non-local builds accept only the exact canonical HTTPS API base; OAuth derives from that validated base. Final production bundle/browser inspection is pending. | `PARTIALLY VERIFIED` |
| SEC-07 | Distinct authenticated identities cannot collide in browser-storage scope | Storage keys now contain a versioned encoding of the complete canonical identity; a regression uses a known collision pair from the removed 32-bit scheme. Final tests are pending. | `PARTIALLY VERIFIED` |

### API authority and data integrity

| ID | Check | Resolution / evidence required | Status |
| :--- | :--- | :--- | :---: |
| P1-03 | Successful server progress replaces stale local values | Local progress is used only for a failed resource; a successful empty response is authoritative. Regression coverage was added. | `PARTIALLY VERIFIED` |
| P1-04 | Bookmark synchronization scope is explicit | Problem bookmarks are server-owned. COMPANY/APTITUDE bookmarks remain user-scoped local data because no API contract exists. Cross-device sync requires backend endpoints and is not claimed. | `PARTIALLY VERIFIED` |
| P1-05 | Company questions are not capped at 50 | Service follows every reported page and deduplicates by question ID. | `PARTIALLY VERIFIED` |
| P1-06 | Company catalog and slug lookup are not capped at 100 | Full-catalog callers use all reported pages; dashboard count uses a one-row metadata request. | `PARTIALLY VERIFIED` |
| P1-07 | API-backed coding-question listings do not drift visually or behaviorally | Practice is the source-of-truth `CodingQuestionTable`; Company Prep, learner DSA Sheet, admin company questions, and the admin coding-question bank adapt verified DTOs into that component. Admin title/action slots retain CRUD controls without a second table implementation. MCQ flows remain purpose-built, and static roadmap content is explicitly not represented as API-driven. Deployed browser acceptance remains required. | `PARTIALLY VERIFIED` |
| P2-06 / P2-07 | Question page metadata accepts the observed `pageNumber` / `pageSize` contract | Shared question-page boundary accepts observed fields or Spring aliases, requires authoritative totals/page identity, and rejects missing metadata instead of synthesizing it. | `PARTIALLY VERIFIED` |
| DATA-01 | Profile renders and saves only contract-supported user-info fields | Legacy college ID/name, gender, date-of-birth, avatar, and personal-edit paths were removed; exact DTO mapping and payload tests cover the frontend boundary. | `PARTIALLY VERIFIED` |
| DATA-02 | Removing a company from an existing question persists | Current backend save behavior inserts associations and rejects duplicates; no verified removal contract exists. The UI must not claim this mutation is supported until backend replace/remove semantics are supplied. | `NOT WORKING` |
| DATA-03 | Question list/detail and nullable fields have separate boundary handling | Numeric details require a valid detail DTO; legacy text slugs scan real pages; nullable hints/test cases are handled without fabricated values. | `PARTIALLY VERIFIED` |
| DATA-04 | Company pages and slugs use verified metadata/identity | Page envelopes require complete metadata; numeric IDs are direct and text slugs resolve through the real paginated catalog. | `PARTIALLY VERIFIED` |
| DATA-05 | Malformed error/MCQ/company-exam payloads fail safely at service boundaries | Error fields are type-guarded; MCQ records/options and nested exam/role/section DTOs are mapped; slug matches without numeric IDs reject without recursion. Final tests/live payload acceptance are pending. | `PARTIALLY VERIFIED` |

### Requests, caching, performance, and reliability

| ID | Check | Resolution / evidence required | Status |
| :--- | :--- | :--- | :---: |
| PERF-01 | A failed question page cannot create a request storm | Recovery fan-out and synthetic totals were removed; one page maps to one request. | `PARTIALLY VERIFIED` |
| PERF-02 | Dashboard does not duplicate the initial question-list request | The code runner owns the question query and reports its total to the dashboard; dashboard counts companies through metadata instead of downloading the catalog. | `PARTIALLY VERIFIED` |
| PERF-03 | DSA sheet requests are deduplicated and stale responses cannot win | Per-resource request IDs, thunk conditions, abort handling, and stale-result guards were added. | `PARTIALLY VERIFIED` |
| PERF-04 | Company admin selector and visible page do not download overlapping catalogs unnecessarily | The two datasets serve different UI needs, but selector loading should be demand-driven or server-search-backed when the backend supports it. | `INFERRED` |
| PERF-05 | Code execution payloads are bounded before transport | Positive integer IDs, non-empty code, 200,000-character source limit, and 64,000-character custom-input limit are enforced client-side. Backend limits remain required. | `PARTIALLY VERIFIED` |
| PERF-06 | Large pages/components do not cause unacceptable render or bundle cost | The production build proves feature-route lazy chunks and keeps the locally bundled Monaco editor core outside the 491.31 kB application entry. Monaco remains a 3,622.38 kB raw / 926.02 kB gzip lazy chunk; deployed transfer, browser-memory, React profiling, and list-scale acceptance are still required. | `PARTIALLY VERIFIED` |
| PERF-07 | Duplicate question/test-case reads and dead business stacks are removed | Dashboard detail uses one authoritative request, test cases reuse detail, the unused company-problems thunk/cache and legacy ProblemList were removed, and shared dialog behavior replaces repeated focus logic. | `PARTIALLY VERIFIED` |
| PERF-08 | Post-mutation cache refresh cannot be rejected or overwritten by an older read | Reference/language force refreshes supersede in-flight reads and invalidation clears ownership before refreshing. Final reducer tests are pending. | `PARTIALLY VERIFIED` |
| PERF-09 | Hidden tabs and admin catalogs do not create unnecessary request bursts | Company questions load only on the Practice tab; admin company modal loads only the active tab, aborts on switch/close, and reads exam pages sequentially; Admin Questions shares one company catalog with its form. Final browser/network verification is pending. | `PARTIALLY VERIFIED` |
| EDITOR-01 | Monaco receives one integrity controller, starts under CSP, and restores historical source into the correct runtime | Duplicate workspace-level integrity listeners were removed; the root shell remains authoritative. Monaco 0.55.1 and same-origin workers are locally bundled inside lazy editor consumers, removing the blocked jsDelivr loader. Submission restore resolves table/reference language IDs and rejects unavailable mappings. Tests and production build pass; deployed browser interaction remains pending. | `PARTIALLY VERIFIED` |

### Admin, profile, company, DSA, and execution journeys

| ID | Journey | Acceptance requirement | Status |
| :--- | :--- | :--- | :---: |
| J-01 | Signup, login, OAuth, refresh, logout, account switch | Supported-browser desktop/mobile run; stale session and cross-tab cases included. | `UNKNOWN` |
| J-02 | Academic profile search/edit/save | Authenticated search plus selected/free-text institution save validation. | `UNKNOWN` |
| J-03 | Aptitude and company MCQ answering | List row without options, detail success, empty detail, retry, and correctness persistence. | `UNKNOWN` |
| J-04 | Question list/detail/search/filter/pagination | Every page/filter must return correct real metadata; known corrupt backend rows must be repaired. | `NOT WORKING` |
| J-05 | Run and submit code | Accepted, wrong answer, compile error, runtime error, timeout, custom input, and hidden-case response. | `UNKNOWN` |
| J-06 | Admin questions and test cases | Create/edit, visible/hidden cases, company add/remove, and mutation refresh. | `UNKNOWN` |
| J-07 | Admin companies/exams/roles/sections | CRUD and relationship updates with USER/ADMIN authorization checks. | `UNKNOWN` |
| J-08 | DSA sheet admin and learner workflow | Frontend follows the supplied three-level API contract: documented sheet detail, sections, and section-question reads; POST create/update with mapping IDs; mapping-ID removal; and Redux cache ownership. Live authenticated reads/mutations and backend inactive/relationship/ADMIN enforcement remain required. | `PARTIALLY VERIFIED` |
| J-11 | Practice platform filtering | QPF reference data exists for display/authoring, but no verified `/questions` request field filters it. The old undocumented payload behavior is intentionally not restored because it could show unfiltered server pages under a selected platform. | `NOT WORKING` |
| J-09 | Responsive and accessibility pass | Dialog focus/Escape/scroll behavior, reduced-motion controls, and admin label/group associations are implemented. Keyboard, screen-reader, and responsive browser acceptance remains pending. | `PARTIALLY VERIFIED` |
| J-10 | Public UI claims and navigation are truthful | Fake newsletter success, mismatched footer resources, simulated execution, unmeasured totals, and unverified testimonial claims were removed/reworded. Approved legal pages/content are still absent. | `PARTIALLY VERIFIED` |

### Supply chain, deployment, and external API evidence

| ID | Check | Resolution / evidence required | Status |
| :--- | :--- | :--- | :---: |
| OPS-01 | CI uses the lockfile toolchain | Typecheck uses the installed package script; checkout and setup-node are pinned to reviewed immutable v7 SHAs. A CI run and dependency-update policy remain required. | `PARTIALLY VERIFIED` |
| OPS-02 | Runtime version is reproducible | `package.json` now declares Node `>=22.12.0 <23`; deployment and CI must use that range. | `PARTIALLY VERIFIED` |
| OPS-03 | Postman workspace is an authoritative, secret-free contract source | The five-request collection was renamed as the canonical contract, moved to `{{base_url}}`, changed to collection-level `{{access_token}}`, and verified to contain no legacy Render host, literal JWT-like value, or explicit Authorization header. The workspace remains fragmented and incomplete; rotate the formerly exposed credential, consolidate the remaining endpoints, and add meaningful assertions before treating it as authoritative. | `PARTIALLY VERIFIED` |
| OPS-04 | Dependency/build/security checks run on the final tree | Tests, typecheck, lint, architecture/docs checks, production build, diff validation, and `npm audit --omit=dev` (0 vulnerabilities) pass on the final tree. A clean install, preview smoke, and deployed header/browser checks remain required. | `PARTIALLY VERIFIED` |
| OPS-05 | Development proxy verifies upstream TLS | All proxy targets use default TLS certificate verification; final dev proxy smoke is pending. | `PARTIALLY VERIFIED` |

## 4. Release-blocking external work

1. Repair the backend `/questions` data/pagination/filter failures; the frontend no longer hides them.
2. Make USER requests to every admin endpoint return 401/403 and verify ADMIN success.
3. Prove hidden test data is absent from USER network responses.
4. Define company-question replace/remove semantics and verify removals persist.
5. Repair the learning-sheet section-question 500 and the submit-code null test-case failure.
6. Rotate the credential formerly exposed in Postman, consolidate the fragmented workspace into the sanitized canonical collection/environment, and add meaningful assertions for the complete API surface.
7. Execute the final verification matrix and supported-browser production journeys.
8. Supply reviewed privacy/terms/legal content and add routes only after approval; complete the assistive-technology/browser audit.
9. Define the update policy for the now-immutable GitHub Action pins and verify the workflow on the final tree.

## 5. Current Phase 1 verdict

**Phase 1 is not complete.** The frontend remediation is materially advanced, but production certification remains blocked by the `NOT WORKING` and `UNKNOWN` items above. This ledger is the single checklist for continuing the audit; additional findings must be added here with evidence rather than split into many informal phases.

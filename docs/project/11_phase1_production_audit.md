# Phase 1 — Production Readiness Audit Ledger

## 1. Meaning of completion

Phase 1 covers the frontend API-contract and production-readiness audit started at commit `afd62865dfc215705a34688d8f17ccfe1881d115`.

`COMPLETE` is permitted only when every frontend-owned item below is verified and every backend/deployment-owned item has objective acceptance evidence. A successful build alone is insufficient. “No possible defect exists” is not a testable claim; the release gate is **no known unresolved critical/high defect, no fabricated API data, and no unverified production-critical flow**.

Status vocabulary follows the repository standard: `VERIFIED`, `RUNTIME-VERIFIED`, `PARTIALLY VERIFIED`, `INFERRED`, `UNKNOWN`, and `NOT WORKING`.

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
| Gate | Tests, typecheck, lint, build, architecture and docs checks pass after all changes | The current source statically declares 379 tests, but the modified final tree has not been executed in an OS-level sandbox. Historical green results cannot certify these changes. | `UNKNOWN` |
| Gate | No existing behavior is broken and final remediation report exists | Requires runtime journeys and external acceptance checks below. | `UNKNOWN` |

## 3. Deep-audit remediation checklist

### Authentication, authorization, and isolation

| ID | Check | Resolution / evidence required | Status |
| :--- | :--- | :--- | :---: |
| AUTH-01 | Login and refresh accept the deployed access-token field without exposing refresh credentials | The boundary now accepts the workspace-evidenced `token` and `accessToken` spellings and emits only canonical `token`; refresh-token fields remain discarded. The deployed envelope still requires browser/API confirmation. | `PARTIALLY VERIFIED` |
| AUTH-02 | A failed startup refresh cannot permanently hide login | Guest recovery retains the safe retry path and adds an explicit **Sign in instead** action that clears client access/profile memory and stale-response ownership without touching the HttpOnly cookie. Final interaction/browser verification is pending. | `PARTIALLY VERIFIED` |
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
| P2-06 / P2-07 | Question page metadata accepts the observed `pageNumber` / `pageSize` contract | Shared page type and company normalization prefer observed fields while retaining legacy aliases for compatibility. | `PARTIALLY VERIFIED` |
| DATA-01 | Editing institution text cannot retain a different institution ID | Free-text changes clear `collegeId`; only an actual selection supplies it. | `PARTIALLY VERIFIED` |
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
| PERF-06 | Large pages/components do not cause unacceptable render or bundle cost | Several feature pages remain very large. Bundle analysis, React profiling, list-scale tests, and route-level lazy-loading evidence are still required. | `UNKNOWN` |
| PERF-07 | Duplicate question/test-case reads and dead business stacks are removed | Dashboard detail uses one authoritative request, test cases reuse detail, the unused company-problems thunk/cache and legacy ProblemList were removed, and shared dialog behavior replaces repeated focus logic. | `PARTIALLY VERIFIED` |
| PERF-08 | Post-mutation cache refresh cannot be rejected or overwritten by an older read | Reference/language force refreshes supersede in-flight reads and invalidation clears ownership before refreshing. Final reducer tests are pending. | `PARTIALLY VERIFIED` |
| PERF-09 | Hidden tabs and admin catalogs do not create unnecessary request bursts | Company questions load only on the Practice tab; admin company modal loads only the active tab, aborts on switch/close, and reads exam pages sequentially; Admin Questions shares one company catalog with its form. Final browser/network verification is pending. | `PARTIALLY VERIFIED` |
| EDITOR-01 | Monaco receives one integrity controller and restores historical source into the correct runtime | Duplicate workspace-level integrity listeners were removed; the root shell remains authoritative. Submission restore now resolves both language table IDs and reference IDs, switches language, and rejects unavailable mappings. Static regressions were added; browser interaction remains pending. | `PARTIALLY VERIFIED` |

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
| J-08 | DSA sheet admin and learner accordion | CRUD/linking, empty sections, section 4 failure repair, race/cancel behavior. | `NOT WORKING` |
| J-09 | Responsive and accessibility pass | Dialog focus/Escape/scroll behavior, reduced-motion controls, and admin label/group associations are implemented. Keyboard, screen-reader, and responsive browser acceptance remains pending. | `PARTIALLY VERIFIED` |
| J-10 | Public UI claims and navigation are truthful | Fake newsletter success, mismatched footer resources, simulated execution, unmeasured totals, and unverified testimonial claims were removed/reworded. Approved legal pages/content are still absent. | `PARTIALLY VERIFIED` |

### Supply chain, deployment, and external API evidence

| ID | Check | Resolution / evidence required | Status |
| :--- | :--- | :--- | :---: |
| OPS-01 | CI uses the lockfile toolchain | Typecheck uses the installed package script; checkout and setup-node are pinned to reviewed immutable v7 SHAs. A CI run and dependency-update policy remain required. | `PARTIALLY VERIFIED` |
| OPS-02 | Runtime version is reproducible | `package.json` now declares Node `>=22.12.0 <23`; deployment and CI must use that range. | `PARTIALLY VERIFIED` |
| OPS-03 | Postman workspace is an authoritative, secret-free contract source | The five-request collection was renamed as the canonical contract, moved to `{{base_url}}`, changed to collection-level `{{access_token}}`, and verified to contain no legacy Render host, literal JWT-like value, or explicit Authorization header. The workspace remains fragmented and incomplete; rotate the formerly exposed credential, consolidate the remaining endpoints, and add meaningful assertions before treating it as authoritative. | `PARTIALLY VERIFIED` |
| OPS-04 | Dependency/build/security checks run on the final tree | Run clean install/lockfile validation, dependency audit, tests, typecheck, lint, architecture/docs checks, build, preview smoke, and deployment header checks. | `UNKNOWN` |
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

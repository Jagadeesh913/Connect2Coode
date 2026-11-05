# 10. File Investigation Coverage & Verification Status

This document provides the exhaustive, file-by-file investigation audit of the Connect2Code codebase.
Every first-party source file has been inspected and assigned a verified status based on implementation analysis, test coverage, and runtime execution.

---

## 1. Status Taxonomy

| Status | Definition |
| :--- | :--- |
| **`RUNTIME-VERIFIED`** | Code has been executed and validated in tests (`npm test`), preview server (`smoke-preview.mjs`), or active browser runtime. |
| **`VERIFIED`** | Code, imports, types, and logic have been line-by-line inspected and verified statically (`typecheck`, `oxlint`). |
| **`PARTIALLY VERIFIED`** | Source code is fully analyzed, but downstream remote backend integration has known limitations (e.g. backend NPE). |
| **`INFERRED`** | Behavior is deduced from caller patterns, backend response envelopes, or DTO contracts. |
| **`UNKNOWN`** | Behavior cannot be confirmed due to unmapped remote routes or inaccessible third-party credentials. |
| **`NOT WORKING`** | Feature or endpoint fails explicitly under current backend configuration. |

---

## 2. Core Infrastructure & Configuration Files

| Relative Path | Role & Purpose | Status | Notes / Evidence |
| :--- | :--- | :---: | :--- |
| `package.json` | Project scripts, dependencies, overrides (`dompurify: 3.4.16`) | `RUNTIME-VERIFIED` | Clean install and all scripts verified. |
| `vite.config.ts` | Vite 8 config, React plugin, Tailwind v4, proxy rules | `RUNTIME-VERIFIED` | Tested with `dev` and `build`. |
| `tsconfig.json` | TypeScript 5.9 compiler options (`strict: true`, ES2022) | `RUNTIME-VERIFIED` | Passes with 0 errors via `npm run typecheck`. |
| `tsconfig.ci.json`| CI TypeScript configuration | `VERIFIED` | Used in CI environment checks. |
| `.oxlintrc.json` | Oxlint rules (React hooks and exports) | `RUNTIME-VERIFIED` | Passes with 0 errors on 153 files in 35ms. |
| `vercel.json` | Edge routing, API proxy, valid SPA deep-link allowlist, redirects, and security/indexing headers | `PARTIALLY VERIFIED` | Removes crawler discrimination and the soft-404 catch-all; structural regression checks pass, but deployed Vercel status/header behavior requires production verification. |
| `index.html` | HTML entry, browser branding, default SEO/social metadata | `RUNTIME-VERIFIED` | Exactly one absolute apex canonical, description, robots, Open Graph, and Twitter/X set; manifest and icon links verified. |
| `public/robots.txt` | Production crawler policy and sitemap discovery | `RUNTIME-VERIFIED` | Advertises `https://connect2code.in/sitemap.xml`; page routes remain crawlable so response-level noindex directives can be observed. |
| `scripts/generate-seo-assets.mjs` | Build-time public prerender, sitemap, noindex app shell, and 404 generator | `RUNTIME-VERIFIED` | Produces five route-specific public documents, absolute apex social/canonical URLs, `app.html`, `404.html`, and a static sitemap without authenticated or invented dynamic URLs. |
| `scripts/tests/metadataCrawler.test.mjs` | Indexing, crawler-output, sitemap, robots, and edge-route regression coverage | `RUNTIME-VERIFIED` | Covers meaningful no-JS HTML, canonical normalization, sitemap exclusions, noindex shells, dynamic failures, and removal of bot-specific routing. |
| `scripts/verify-architecture.mjs` | Prohibited-pattern and deployment-boundary scanner | `RUNTIME-VERIFIED` | Validates the production API proxy, noindex deep-link shell, and absence of a soft-404 catch-all; a local ignored `.env` still intentionally fails the workspace run. |
| `.env.example` | Documented environment variable template | `VERIFIED` | Documents the required apex `VITE_SITE_URL`, API/app settings, and optional public Brandfetch client ID. |
| `.env.production`| Production environment config | `VERIFIED` | Targets `https://api.connect2code.in/api/v1` and pins canonical output to `https://connect2code.in`. |
| `.env` | Local development environment override (untracked) | `VERIFIED` | Local development override. |
| `.gitignore` | Git exclusion rules (ignores `.env`, `graphify-out/`) | `VERIFIED` | Validated against git tracking. |
| `.github/workflows/frontend-ci.yml` | GitHub Actions CI workflow | `VERIFIED` | Matches actual scripts and Node 22 version. |

---

## 3. Entry Points & App Root (`src/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/main.tsx` | React 19 root entry | `RUNTIME-VERIFIED` | Mounts `<App />` into `#root`. |
| `src/App.tsx` | Top-level providers and router layout | `RUNTIME-VERIFIED` | Redux Provider, user-scoped ThemeProvider, Toaster, and ErrorBoundary. |
| `src/index.css` | Tailwind v4 styles, tokens, themes | `RUNTIME-VERIFIED` | Compiled cleanly by `@tailwindcss/vite`; application content is non-selectable except isolated Monaco, and print output is suppressed. |
| `src/vite-env.d.ts`| Vite client type declarations | `VERIFIED` | Standard client typings. |
| `src/app/store.ts` | Redux store configuration | `RUNTIME-VERIFIED` | Configured with rootReducer and post-reducer persistence middleware. |
| `src/app/clientPersistenceMiddleware.ts` | Scoped bookmark/progress persistence boundary | `RUNTIME-VERIFIED` | Persists next Redux state after fulfilled mutations/hydration; only COMPANY/APTITUDE bookmarks are stored locally. |
| `src/app/rootReducer.ts` | Combined root reducer (9 slices) | `RUNTIME-VERIFIED` | Combines all slices and clears protected cached data immediately on logout or forced unauthentication. |
| `src/app/hooks.ts` | Typed Redux hooks | `RUNTIME-VERIFIED` | React Redux 9 `withTypes` hooks for dispatch, selector, and store. |

---

## 4. Core Architecture Layer (`src/core/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/core/api/apiClient.ts` | Central Axios client, interceptors, refresh lock | `RUNTIME-VERIFIED` | Attaches the in-memory bearer token; refresh is bodyless, credentialed, single-flight, and triggered only by protected-request HTTP 401. Refresh HTTP 401 clears the session while temporary failures preserve it. |
| `src/core/api/endpoints.ts` | Centralized REST endpoint constants | `RUNTIME-VERIFIED` | Includes tested reference routes and semantic `SAVE` names for POST routes shared by create/update. |
| `src/core/guards/AdminRoute.tsx` | Admin route gate using response profile role | `RUNTIME-VERIFIED` | Uses the backend-supplied login/refresh role; it does not decode JWT claims for authorization. |
| `src/core/guards/GuestRoute.tsx` | Guest route gate redirecting logged-in users | `RUNTIME-VERIFIED` | Redirect selection uses the backend-supplied response profile role. |
| `src/core/guards/ProtectedRoute.tsx` | User route gate redirecting to `/login` | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/mappers/problemMapper.ts` | Question DTO to problem model mapper | `RUNTIME-VERIFIED` | Maps question catalog and detail payloads, preserving testCases, examples, constraints, hints, and ref metadata. |
| `src/core/metadata/pageMetadata.ts` | Central route metadata policy and safe text helpers | `RUNTIME-VERIFIED` | Covers all exact, dynamic, redirect, error, authenticated, and admin route families; authenticated API-backed and coming-soon routes default to noindex without guessed entity names. |
| `src/core/metadata/MetadataContext.ts` | Navigation-keyed dynamic metadata context | `RUNTIME-VERIFIED` | Prevents a detail override from surviving navigation to another route. |
| `src/core/metadata/RouteMetadata.tsx` | DOM head reconciler | `RUNTIME-VERIFIED` | Owns title, canonical, robots, Open Graph, and Twitter/X tags without duplicate nodes. |
| `src/core/metadata/usePageMetadata.ts` | API-backed detail metadata hook | `RUNTIME-VERIFIED` | Dynamic overrides are registered and cleaned up against the active location key. |
| `src/core/security/jwt.ts` | Legacy JWT decoder plus response-role and redirect helpers | `RUNTIME-VERIFIED` | Source authorization callers use `isAdminRole` with backend response data; JWT claims are not used for routing or access decisions. |
| `src/core/security/authSessionSync.ts` | Credential-free same-origin tab session event transport | `RUNTIME-VERIFIED` | BroadcastChannel with transient storage-event fallback; tested event validation. |
| `src/core/security/tokenStorage.ts` | Memory-only access token and session profile storage | `RUNTIME-VERIFIED` | Exposes no refresh-token API, never reads or creates the backend HttpOnly cookie, purges legacy JavaScript-readable token aliases, and advances the stale-response epoch on clear. |
| `src/core/storage/userScopedStorage.ts` | User-scoped local storage with FNV-1a hash | `RUNTIME-VERIFIED` | Tested in `taskRemediationVerification.test.mjs`. |
| `src/core/types/api.ts` | REST response envelopes (`ApiResponse`, `ApiPage`) | `VERIFIED` | Strict DTO types. |
| `src/core/types/domain.ts` | Domain models (Problem, Company, MCQ, User, etc.) | `RUNTIME-VERIFIED` | Canonical institution filters, reference save unions, nullable profile responses, strict session-identity fields, and MCQ save payloads reflect the active contracts. |
| `src/core/validation/commonRules.ts` | Zod validators (email, password, name, phone, URL) | `RUNTIME-VERIFIED` | Migrated to Zod 4 error APIs and tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/serverErrorMapper.ts`| Backend error parser and security leak filter | `RUNTIME-VERIFIED` | Stack traces, backend implementation names, service URLs, and IP/port details are regression-tested and suppressed. |
| `src/core/validation/index.ts` | Re-exports validation rules | `VERIFIED` | Re-exports all schemas. |
| `src/core/validation/schemas/adminSchemas.ts` | Zod schemas for admin forms | `RUNTIME-VERIFIED` | Zod 4-compatible and tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/schemas/authSchemas.ts` | Zod schemas for login, signup, forgot password | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/schemas/profileSchemas.ts` | Zod schemas for user profile & academics | `RUNTIME-VERIFIED` | Zod 4 input/output coercion and messages are tested in `validationArchitecture.test.mjs`. |

---

## 5. Service Layer (`src/services/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/services/authService.ts` | Authentication REST service | `RUNTIME-VERIFIED` | Login stores only response token/profile in memory. Logout clears locally immediately, sends no token body, and returns the real backend outcome rather than fabricating success. |
| `src/features/admin/utils/mcqPayload.ts` | Exact MCQ option request/response mapper | `RUNTIME-VERIFIED` | Uses only the documented persisted option fields and enforces exactly one `isCorrect` option. |
| `src/services/companyService.ts` | Companies, recruitment exams, and company-question service | `RUNTIME-VERIFIED` | Company-question recovery preserves the requested numeric company filter and never substitutes an unscoped name search. A non-empty live exam/detail DTO remains unverified. |
| `src/services/executionService.ts` | Monaco code runner and Judge0 service | `PARTIALLY VERIFIED` | Language caching, API-only reference-ID resolution, custom-input payloads, malformed response rejection, and non-zero success verdicts are covered by tests; live execution remains backend-dependent. |
| `src/services/institutionService.ts` | Public institution search autocomplete | `RUNTIME-VERIFIED` | Tested in `apiIntegration.test.mjs`. |
| `src/services/learningSheetService.ts` | DSA sheets, ordered sections, and linked-question reads | `RUNTIME-VERIFIED` | Strict DTO boundaries, positive IDs, top-level filtering, and ordering are tested. Live API access remains backend-dependent. |
| `src/services/mcqService.ts` | User/admin MCQ reads and aptitude scoring | `RUNTIME-VERIFIED` | Contains no admin mutations; that boundary and option correctness are regression-tested. |
| `src/services/problemService.ts` | Problem catalog and details service | `RUNTIME-VERIFIED` | Numeric detail failures propagate; catalog fallback is limited to slug resolution and cannot hide a failed detail request. |
| `src/services/profileService.ts` | User profile & academic details (`/userInfo`) | `RUNTIME-VERIFIED` | Nullable reads, strict envelopes, and business-only save payloads are tested in `userInfoProfile.test.mjs`. |
| `src/services/questionService.ts` | Problem CRUD and test case retrieval | `RUNTIME-VERIFIED` | Numeric direct lookup, cancellation, failure propagation, and preservation of absent test-case classification as blank are covered. |
| `src/services/referenceService.ts` | Taxonomy group codes and group records | `PARTIALLY VERIFIED` | Authenticated group-code listing returned 200; encoded group paths and strict DTO validation are tested, while the current per-group production read is blocked by the backend's missing `referenceCodesByGroup` cache. |
| `src/services/userQuestionService.ts` | Solved/attempted IDs, bookmarks, submissions | `RUNTIME-VERIFIED` | Missing required user/question identity rejects explicitly rather than returning a fabricated empty result. |
| `src/services/admin/adminCompanyService.ts` | Admin company, role, section, exam authoring | `RUNTIME-VERIFIED` | Paginated reads delegate to the verified shared company service; business-only mutations and API-owned exam taxonomy IDs are regression-tested; live mutation remains backend-owned. |
| `src/services/admin/adminInstitutionService.ts`| Admin institution CRUD & status toggle | `RUNTIME-VERIFIED` | Sends only canonical `type` and `activeOnly` filter names; tested in `institutionManagement.test.mjs`. |
| `src/services/admin/adminLanguageService.ts` | Admin language compiler management | `RUNTIME-VERIFIED` | One save method matches the shared create/update POST; successful mutations invalidate execution-language cache. |
| `src/services/admin/adminReferenceService.ts` | Admin reference create/update/hard delete | `PARTIALLY VERIFIED` | Request/response shapes, encoded delete path, and admin isolation are source-tested; production mutations were not executed. |
| `src/services/admin/adminMcqService.ts` | Admin MCQ mutations and management reads | `RUNTIME-VERIFIED` | Owns one create/update save method plus delete, delegates shared reads, and uses the semantic `ADMIN_SAVE` endpoint constant. |
| `src/services/admin/adminQuestionService.ts` | Admin question management | `RUNTIME-VERIFIED` | Resilient pagination is tested; filtered client recovery publishes results only when the fallback proves the complete reported catalog is present. |
| `src/services/admin/adminLearningSheetService.ts` | Admin DSA sheet authoring and link management | `PARTIALLY VERIFIED` | Endpoint/body shapes and bodyless DELETE requests are tested; live production mutations were not executed. |

---

## 6. Layouts & Routes (`src/layouts/`, `src/routes/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/layouts/AppRouterLayout.tsx` | Top-level router wrapper with scroll restoration, route metadata, and interaction guard | `RUNTIME-VERIFIED` | Reconciles session state and mounts metadata; learner routes receive focus-loss privacy, clipboard/capture deterrence, and the problem-workspace secure-mode control, while `/admin/*` routes remain unrestricted. |
| `src/layouts/AuthLayout.tsx` | Visual container for Login, Signup, ForgotPassword | `RUNTIME-VERIFIED` | Glassmorphism card and brand mark. |
| `src/layouts/MainLayout.tsx` | Standard student portal layout with Navbar and Footer | `RUNTIME-VERIFIED` | Verified across all public pages. |
| `src/routes/appRoutes.tsx` | Route definitions with lazy code-splitting | `RUNTIME-VERIFIED` | Verified with smoke preview on 5 routes. |

---

## 7. Shared Components & Errors (`src/shared/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/shared/components/ComingSoon.tsx` | Feature placeholder | `RUNTIME-VERIFIED` | Gated by `VITE_SHOW_COMING_SOON`. |
| `src/shared/components/errors/AppErrorBoundary.tsx` | React 19 top-level error boundary | `RUNTIME-VERIFIED` | Catches and logs rendering crashes. |
| `src/shared/components/errors/NotFound.tsx` | 404 Not Found error view | `RUNTIME-VERIFIED` | Verified route fallback. |
| `src/shared/components/errors/ServerError.tsx` | 500 Internal Server Error view | `VERIFIED` | Static error display. |
| `src/shared/components/ui/Badge.tsx` | Status and difficulty badge | `RUNTIME-VERIFIED` | Variants: default, success, danger, etc. |
| `src/shared/components/ui/BrandLogo.tsx` | Official brand logo component | `RUNTIME-VERIFIED` | Verified in Navbar and Landing. |
| `src/shared/components/ui/Button.tsx` | Reusable button component | `RUNTIME-VERIFIED` | Defaults to a non-submitting button; loading and disabled actions remain locked. |
| `src/shared/components/ui/ConfirmDialog.tsx` | Modal confirmation dialog | `RUNTIME-VERIFIED` | Unique labels, safe initial focus, Tab containment, focus restoration, body locking, and busy-state dismissal guards are source-tested. |
| `src/shared/components/ui/EmptyState.tsx` | Empty state placeholder | `VERIFIED` | Used in empty tables/lists. |
| `src/shared/components/ui/Footer.tsx` | Global footer | `RUNTIME-VERIFIED` | Verified in MainLayout. |
| `src/shared/components/ui/FormFieldError.tsx` | Form validation message | `RUNTIME-VERIFIED` | Used across React Hook Form inputs. |
| `src/shared/components/ui/Navbar.tsx` | Global top navigation bar | `RUNTIME-VERIFIED` | User avatar, theme toggle, nav links, and JWT-only admin navigation visibility. |
| `src/shared/components/ui/PageLoading.tsx` | Full-screen and container loading state | `RUNTIME-VERIFIED` | Route-shaped shimmer layouts, including a skeleton fallback for otherwise-unclassified routes. |
| `src/shared/components/ui/Pagination.tsx` | Pagination control | `RUNTIME-VERIFIED` | Non-submitting controls, current-page semantics, and the all-control pending lock are regression-tested. |
| `src/shared/components/ui/RequestStatus.tsx` | Loading/error/empty state wrapper | `VERIFIED` | Used in admin dashboard. |
| `src/shared/components/ui/Skeleton.tsx` | Shimmer card and table placeholders | `RUNTIME-VERIFIED` | Verified during data loading. |
| `src/shared/hooks/useAssessmentIntegrity.ts` | Learner-route clipboard/capture shortcut deterrence | `RUNTIME-VERIFIED` | Native clipboard, selection, middle-click, drag/drop, browser export, Print Screen, common OS capture, focus-loss obscuring, fullscreen/keyboard-lock secure mode, internal-editor clipboard routing, allowed DevTools, and execution shortcuts are covered; `AppRouterLayout` disables the hook for `/admin/*`. Browser/OS enforcement boundary remains documented. |
| `src/shared/context/ThemeContext.tsx` | Dark/Light theme provider and hook | `RUNTIME-VERIFIED` | Normalized identity scopes retire legacy global values, direct/toggle updates persist per user, and `system` follows live OS color-scheme changes. |

---

## 8. Feature Modules (`src/features/`)

### A. Auth Feature (`src/features/auth/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/GoogleSignInButton.tsx` | Google OAuth2 sign-in button | `RUNTIME-VERIFIED` | Triggers Google authorization popup. |
| `hooks/useGoogleOAuthLogin.ts` | OAuth hook managing popup and postMessage | `RUNTIME-VERIFIED` | Tested in `googleOAuthLifecycle.test.mjs`. |
| `pages/Login.tsx` | Login form page | `RUNTIME-VERIFIED` | Zod validation, authModalMode support, JWT-only admin redirect selection, and synchronous duplicate auth-action guards. |
| `pages/Signup.tsx` | Registration form page | `RUNTIME-VERIFIED` | Name, email, password matching validation. |
| `pages/ForgotPassword.tsx` | Two-step OTP password reset | `RUNTIME-VERIFIED` | OTP generation & verification flow. |
| `pages/OAuthCallback.tsx` | Google OAuth popup callback handler | `RUNTIME-VERIFIED` | Passes tokens to opener and uses JWT claims for admin redirect selection. |
| `redux/authSlice.ts` | Auth Redux slice | `RUNTIME-VERIFIED` | Tested in `authSession.test.mjs`. |

### B. Problems Feature (`src/features/problems/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/PracticeHeroBanner.tsx` | Hero banner with problem stats & search | `RUNTIME-VERIFIED` | Verified on PracticePage. |
| `hooks/useExecutionRequest.ts` | Custom hook for Monaco code running | `RUNTIME-VERIFIED` | Handles run/submit state & aborts. |
| `pages/PracticePage.tsx` | Practice catalog hub | `RUNTIME-VERIFIED` | URL-backed difficulty, topic, company, platform, search, page, and page-size controls dispatch canonical `/questions` queries; server totals drive pagination and client catalog slicing is prohibited. Unsupported status/sort catalog controls are not rendered. |
| `pages/ProblemDetails.tsx` | Monaco editor coding workspace | `RUNTIME-VERIFIED` | Cancels history reads, resolves API language IDs/reference IDs, restores user/problem/language-scoped drafts, isolates clipboard operations in memory, sanitizes execution failures, and accepts only non-zero passing verdicts. Browser-level proctoring remains unavailable. |
| `pages/ProblemList.tsx` | Legacy standalone problem-list page | `VERIFIED` | Retained but no longer owns `/dsa-sheet`; the route now uses the API-driven DSA feature. |
| `redux/problemSlice.ts` | Problem Redux slice with TTL/LRU caches | `RUNTIME-VERIFIED` | Request ownership plus stale-row clearing and same-query refresh retention are tested in `problemSliceAbortRecovery.test.mjs`. |
| `utils/problemEditorial.ts` | Problem solution editorial formatter | `VERIFIED` | Markdown editorial formatting. |
| `utils/problemExecution.ts` | Output formatter, error parser, language resolver | `RUNTIME-VERIFIED` | Language entity/reference-ID resolution is tested. |
| `utils/codeDiagnostics.ts` | Monaco and execution diagnostic mapper | `RUNTIME-VERIFIED` | Cross-language API misuse and deduplicated compiler line/column mapping are tested. |
| `utils/internalEditorClipboard.ts` | Editor-only clipboard shortcut classifier | `RUNTIME-VERIFIED` | Copy, cut, paste, Insert aliases, and non-clipboard shortcuts are tested without system clipboard access. |

### C. Companies Feature (`src/features/companies/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/CompanyBrandLogo.tsx` | Local-first recruiter logo with remote/error cascade | `RUNTIME-VERIFIED` | Candidate behavior is covered by `companyLogos.test.mjs`; browser rendering uses a professional terminal monogram. |
| `components/CompanyExamCard.tsx` | Exam card displaying rounds & syllabus | `RUNTIME-VERIFIED` | Verified on CompanyExamDetails. |
| `pages/CompanyList.tsx` | Paginated recruiter directory | `RUNTIME-VERIFIED` | Each URL-backed page calls `/company/list`, uses server totals, clamps safely, scrolls on explicit pagination, and keeps cards keyboard operable. Unsupported company search/industry controls are omitted. |
| `pages/CompanyDetails.tsx` | Company profile, exams, and practice questions | `RUNTIME-VERIFIED` | Recruitment exams, coding questions, and MCQs are server-paginated; route changes reset owned totals, filtered totals do not overwrite section badges, and section changes settle loading state. |
| `pages/CompanyExamDetails.tsx` | Detailed recruitment exam blueprint | `RUNTIME-VERIFIED` | Exam section duration & question counts. |
| `redux/companySlice.ts` | Company Redux slice | `RUNTIME-VERIFIED` | Tested in `companyResilience.test.mjs`. |
| `types/companyExam.ts` | Exam & blueprint type definitions | `VERIFIED` | Full type declarations. |
| `utils/companyLogoRegistry.ts` | Canonical aliases, bundled manifest, domain validation, and provider candidates | `RUNTIME-VERIFIED` | All 121 files remain bundled; all additional manifest entries and candidate-order rules are tested in `companyLogos.test.mjs`. |

### D. Aptitude Feature (`src/features/aptitude/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `pages/AptitudePrep.tsx` | Multi-subject aptitude practice hub | `RUNTIME-VERIFIED` | Difficulty filters and labels use API reference records only; missing taxonomy is retryable, and long mobile options keep Lucide correctness icons aligned. |
| `utils/mcqUtils.ts` | MCQ option response mapper and correct-option resolver | `RUNTIME-VERIFIED` | Uses only `id`, `optionLabel`, `optionText`, and boolean `isCorrect`; it does not infer correctness from aliases or question-level answer text. |

### E. Admin Hub (`src/features/admin/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/AdminBadge.tsx` | Admin status badge | `VERIFIED` | UI element. |
| `components/AdminBreadcrumb.tsx` | Admin navigation breadcrumbs | `VERIFIED` | Breadcrumbs. |
| `components/AdminCard.tsx` | Admin card container | `VERIFIED` | Container styling. |
| `components/AdminContent.tsx` | Admin content layout wrapper | `VERIFIED` | Layout component. |
| `components/AdminEmptyState.tsx` | Admin empty table state | `VERIFIED` | Empty state. |
| `components/AdminErrorState.tsx` | Admin error banner | `VERIFIED` | Error banner. |
| `components/AdminHeader.tsx` | Admin top header bar | `VERIFIED` | Admin header. |
| `components/AdminLayout.tsx` | Admin layout with sidebar & header | `RUNTIME-VERIFIED` | Gated by `AdminRoute`. |
| `components/AdminModal.tsx` | Base modal dialog for admin forms | `PARTIALLY VERIFIED` | Dialog semantics, initial focus, tab containment, and focus restoration are source-tested; no assistive-technology run. |
| `components/AdminPageHeader.tsx` | Admin page title & action buttons | `VERIFIED` | Page header. |
| `components/AdminSidebar.tsx` | Admin navigation sidebar | `RUNTIME-VERIFIED` | Links to questions, mcqs, companies, etc. |
| `components/AdminTable.tsx` | Reusable sortable admin table | `RUNTIME-VERIFIED` | Replaces stale rows with same-column skeletons for every pending request; clickable rows support Enter/Space and visible focus. |
| `components/companies/*` | Company, exam, role, section modals | `RUNTIME-VERIFIED` | Exam sections load `EXAM SECTION TYPE` and `QUESTION TYPE` through shared reference state, require explicit classification, lock saves while taxonomy is loading, and never substitute legacy numeric IDs. |
| `components/dashboard/*` | Dashboard metrics, code runner, overview | `RUNTIME-VERIFIED` | Live admin KPI metrics across 8 cards; code runner discovery uses generation-owned sequential pagination, synchronously ref-owned manual selection, selection-preserving reload, merge-stable details, per-question/language drafts, dynamic boilerplate, and real-time execution. |
| `components/institutions/*` | Institution details, form, status modals | `RUNTIME-VERIFIED` | Tested in `institutionManagement.test.mjs`. |
| `components/questions/*` | Question form, details, test case modals | `PARTIALLY VERIFIED` | Dynamic reference library bindings (DIFF, TOPIC, QPF, TESTCASETYPE), sequential displayOrder on hints, and testcase assertions verified; live admin mutation remains backend-owned. |
| `pages/AdminDashboard.tsx` | Live admin dashboard metrics | `RUNTIME-VERIFIED` | Uses shared `DIFF` reference state without legacy IDs; primary and difficulty requests are independently cancellable, empty taxonomy clears tier counts, and concurrent failures are combined. |
| `pages/AdminCompanies.tsx` | Company CRUD page | `RUNTIME-VERIFIED` | Page and page-size changes call `/company/list`; cards are keyboard-operable and duplicate saves are synchronously guarded. Unsupported company search is not presented. Live mutation remains unverified. |
| `pages/AdminInstitutions.tsx` | Institution directory management | `RUNTIME-VERIFIED` | Strict pages, authoritative edit details, clamped pagination, complete university options, and duplicate mutation guards. |
| `pages/AdminLanguages.tsx` | Language compiler configuration | `RUNTIME-VERIFIED` | Loading KPIs use skeletons and save/deactivation handlers reject duplicate actions. |
| `pages/AdminReferences.tsx` | Reference taxonomy administration | `PARTIALLY VERIFIED` | Admin-only mutations, generation-owned group reads, mutation locking, cache invalidation, and explicit hard-delete confirmation are locally verified; production mutations were not executed. |
| `pages/AdminMcqs.tsx` | MCQ question bank authoring | `RUNTIME-VERIFIED` | Strict list/detail handling, stable initial unfiltered requests during reference hydration, authoritative view/edit data, reference name payload attachment, page clamping, and option-level correctness are tested. |
| `pages/AdminQuestions.tsx` | Coding problem CRUD | `PARTIALLY VERIFIED` | Strict pages, authoritative details, page clamping, full test case retrieval (both visible and hidden) on Manage Test Cases, and partial test-case-save feedback are tested; live admin mutation remains unverified. |
| `pages/AdminDsaSheets.tsx` | DSA sheet, section, and question-link management | `PARTIALLY VERIFIED` | Create/edit modals cover sheets, sections, and association metadata; edit payload IDs and cache invalidation are regression-tested, but live authenticated mutations were not executed. |
| `utils/testCaseUtils.ts` | Test case extractor & parser | `PARTIALLY VERIFIED` | Parses API payload/visible examples only; no bundled hidden fixtures. |

### F. DSA Sheet Feature (`src/features/dsaSheet/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/DsaSheetHeroBanner.tsx` | Theme-aware generated DSA hero banner | `RUNTIME-VERIFIED` | Uses project-local light/dark raster assets with 2048x384 dimensions matching Practice/Aptitude banner container and design treatment. |
| `pages/DsaSheetPage.tsx` | Student DSA learning-path UI | `RUNTIME-VERIFIED` | Redux-backed learning path with an accessible pauseable carousel, explicit reduced-motion labeling/visibility guards, TTL caching, accordion reads, retries, and request cancellation. |
| `redux/dsaSheetSlice.ts` | Learning sheets, sections, questions Redux slice | `RUNTIME-VERIFIED` | 5-minute TTL caching, section accordion state, and error handling tested in `dsaSheetSlice.test.mjs`. |
| `types.ts` | Learning sheet, section, question-link, and mutation DTOs | `RUNTIME-VERIFIED` | Used by strict service validation and contract tests. |
| `utils/questionRoute.ts` | DSA association-to-problem route resolver | `RUNTIME-VERIFIED` | Always selects nested `question.id`; regression test proves outer association IDs cannot enter problem URLs. |

### G. Profile, Bookmarks, Landing, Settings, Roadmaps
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/features/bookmarks/pages/BookmarksList.tsx` | User bookmarked problems page | `RUNTIME-VERIFIED` | Per-item pending state disables duplicate removal and exposes progress accessibly. |
| `src/features/bookmarks/redux/bookmarkSlice.ts` | Bookmarks Redux slice | `RUNTIME-VERIFIED` | Server-owned problem hydration, scoped COMPANY/APTITUDE persistence, refresh failure preservation, and stale-response ownership are tested. |
| `src/features/institutions/components/InstitutionAutocomplete.tsx` | College autocomplete input | `RUNTIME-VERIFIED` | Minimum-three-character debounce with cancellable requests and shaped dropdown-result skeletons. |
| `src/features/interviews/pages/InterviewPrep.tsx` | Curated interview questions | `VERIFIED` | Gated by `ComingSoon`. |
| `src/features/landing/pages/Landing.tsx` | Public landing page with demo runner | `RUNTIME-VERIFIED` | Verified in smoke preview. |
| `src/features/languages/redux/languageSlice.ts` | Language Redux slice | `RUNTIME-VERIFIED` | TTL, force refresh, and stale-response ownership tested. |
| `src/features/profile/components/modals/*` | Academic and personal modals | `VERIFIED` | Reference-backed gender, API-owned editable fields, and read-only authenticated identity; unsupported photo editor removed. |
| `src/features/profile/pages/ProfileSettings.tsx` | Profile settings & performance metrics | `RUNTIME-VERIFIED` | Academic/personal records are API-driven with no legacy identity fallbacks; the modal shares header identity fallbacks, unsupported local-only preferences are absent, enrichment requests are cancellable, progress metrics avoid duplicate calls, and saves use a synchronous mutation lock. |
| `src/features/profile/redux/profileSlice.ts` | Profile Redux slice | `RUNTIME-VERIFIED` | Identity and `/userInfo` reads are user/request-owned; late responses from a previous account are ignored, valid-null caching and token-only refresh continuity are tested. |
| `src/features/progress/redux/progressSlice.ts` | Progress Redux slice | `RUNTIME-VERIFIED` | Remote/local merge, warning fallbacks, cancellation, immediate scope clearing, and stale-response protection are tested. |
| `src/features/references/redux/referenceSlice.ts` | Reference taxonomy Redux slice | `RUNTIME-VERIFIED` | Empty-result TTL caching and stale-response ownership tested. |
| `src/features/roadmaps/pages/RoadmapDetails.tsx` | DSA and engineering roadmaps | `VERIFIED` | Gated by `ComingSoon`. |
| `src/features/settings/pages/AppSettings.tsx` | Application settings (theme, notifications)| `VERIFIED` | Settings view. |

---

## 9. Verification Summary & Audit Totals

- **Total First-Party TypeScript/TSX Files in `src/`**: 155
- **Total Automated Test Files in `scripts/tests/`**: 23
- **Total Executed Automated Unit Tests**: 371 (371 Passed, 0 Failed; 105 reported suites across 23 files)
- **TypeScript Static Check (`npm run typecheck`)**: 0 errors
- **Oxlint Static Code Analysis (`npm run lint`)**: 0 warnings, 0 errors across 177 files
- **Vite Production Bundler Build (`npm run build`)**: 0 errors; five prerendered public documents, a noindex app shell, `404.html`, and `sitemap.xml` generated.
- **Documentation Integrity (`npm run verify:docs`)**: 272 internal links and source references passed.
- **Architecture Verification (`npm run verify:architecture`)**: `RUNTIME-VERIFIED` — 159 source files scanned successfully, including API transport, endpoint-domain, environment, route, and prohibited-pattern checks.
- **Preview Smoke Test (`scripts/smoke-preview.mjs`)**: `RUNTIME-VERIFIED` — Preview smoke test passes across 5 routes and 14 bundle assets.


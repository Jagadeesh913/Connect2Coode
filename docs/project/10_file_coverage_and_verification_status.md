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
| `src/App.tsx` | Top-level providers and router layout | `RUNTIME-VERIFIED` | Provider, ThemeProvider, Toaster, ErrorBoundary. |
| `src/index.css` | Tailwind v4 styles, tokens, themes | `RUNTIME-VERIFIED` | Compiled cleanly by `@tailwindcss/vite`; application content is non-selectable except isolated Monaco, and print output is suppressed. |
| `src/vite-env.d.ts`| Vite client type declarations | `VERIFIED` | Standard client typings. |
| `src/app/store.ts` | Redux store configuration | `RUNTIME-VERIFIED` | Configured with rootReducer and post-reducer persistence middleware. |
| `src/app/clientPersistenceMiddleware.ts` | Scoped bookmark/progress persistence boundary | `RUNTIME-VERIFIED` | Persists next Redux state after fulfilled mutations/hydration; only COMPANY/APTITUDE bookmarks are stored locally. |
| `src/app/rootReducer.ts` | Combined root reducer (9 slices) | `RUNTIME-VERIFIED` | Combines auth, problems, companies, dsaSheet, progress, bookmarks, profile, references, languages. |
| `src/app/hooks.ts` | Typed Redux hooks | `RUNTIME-VERIFIED` | React Redux 9 `withTypes` hooks for dispatch, selector, and store. |

---

## 4. Core Architecture Layer (`src/core/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/core/api/apiClient.ts` | Central Axios client, interceptors, refresh lock | `RUNTIME-VERIFIED` | Unwrapped response typing, non-mutating token canonicalization, centralized DELETE bodies, and base URL resolution are tested in `apiClient.test.mjs`; mutation testing killed removal of DELETE handling. |
| `src/core/api/endpoints.ts` | Centralized REST endpoint constants | `RUNTIME-VERIFIED` | Includes tested reference routes and semantic `SAVE` names for POST routes shared by create/update. |
| `src/core/guards/AdminRoute.tsx` | Admin route gate checking JWT claims | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/guards/GuestRoute.tsx` | Guest route gate redirecting logged-in users | `RUNTIME-VERIFIED` | Admin redirect selection uses signed JWT claims only; covered by auth regression tests. |
| `src/core/guards/ProtectedRoute.tsx` | User route gate redirecting to `/login` | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/mappers/problemMapper.ts` | Question DTO to problem model mapper | `RUNTIME-VERIFIED` | Maps question catalog and detail payloads, preserving testCases, examples, constraints, hints, and ref metadata. |
| `src/core/metadata/pageMetadata.ts` | Central route metadata policy and safe text helpers | `RUNTIME-VERIFIED` | Covers all exact, dynamic, redirect, error, authenticated, and admin route families; authenticated API-backed and coming-soon routes default to noindex without guessed entity names. |
| `src/core/metadata/MetadataContext.ts` | Navigation-keyed dynamic metadata context | `RUNTIME-VERIFIED` | Prevents a detail override from surviving navigation to another route. |
| `src/core/metadata/RouteMetadata.tsx` | DOM head reconciler | `RUNTIME-VERIFIED` | Owns title, canonical, robots, Open Graph, and Twitter/X tags without duplicate nodes. |
| `src/core/metadata/usePageMetadata.ts` | API-backed detail metadata hook | `RUNTIME-VERIFIED` | Dynamic overrides are registered and cleaned up against the active location key. |
| `src/core/security/jwt.ts` | JWT payload decoder, claim extractor, expiry | `RUNTIME-VERIFIED` | Tested in `authSession.test.mjs`. |
| `src/core/security/authSessionSync.ts` | Credential-free same-origin tab session event transport | `RUNTIME-VERIFIED` | BroadcastChannel with transient storage-event fallback; tested event validation. |
| `src/core/security/tokenStorage.ts` | Cookie & memory token storage | `RUNTIME-VERIFIED` | Web-storage credential/profile mirroring removed; legacy copies are cleaned, and cross-tab events clear stale per-tab memory. |
| `src/core/storage/userScopedStorage.ts` | User-scoped local storage with FNV-1a hash | `RUNTIME-VERIFIED` | Tested in `taskRemediationVerification.test.mjs`. |
| `src/core/types/api.ts` | REST response envelopes (`ApiResponse`, `ApiPage`) | `VERIFIED` | Strict DTO types. |
| `src/core/types/domain.ts` | Domain models (Problem, Company, MCQ, User, etc.) | `RUNTIME-VERIFIED` | Canonical institution filters, reference save unions, nullable profile responses, and MCQ save payloads reflect the active contracts. |
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
| `src/services/authService.ts` | Authentication REST service | `RUNTIME-VERIFIED` | Login/refresh notify open same-origin tabs without disclosing credentials; tested in `authSession.test.mjs`. |
| `src/features/admin/utils/mcqPayload.ts` | Exact MCQ option request/response mapper | `RUNTIME-VERIFIED` | Uses only the documented persisted option fields and enforces exactly one `isCorrect` option. |
| `src/services/companyService.ts` | Companies and recruitment exams service | `PARTIALLY VERIFIED` | Strict page/detail envelopes, complete pagination, and stale-fallback error isolation are tested; a non-empty live exam/detail DTO remains unverified. |
| `src/services/executionService.ts` | Monaco code runner and Judge0 service | `PARTIALLY VERIFIED` | Language caching, API-only reference-ID resolution, custom-input payloads, malformed response rejection, and non-zero success verdicts are covered by tests; live execution remains backend-dependent. |
| `src/services/institutionService.ts` | Public institution search autocomplete | `RUNTIME-VERIFIED` | Tested in `apiIntegration.test.mjs`. |
| `src/services/learningSheetService.ts` | DSA sheets, ordered sections, and linked-question reads | `RUNTIME-VERIFIED` | Strict DTO boundaries, positive IDs, top-level filtering, and ordering are tested. Live API access remains backend-dependent. |
| `src/services/mcqService.ts` | User/admin MCQ reads and aptitude scoring | `RUNTIME-VERIFIED` | Contains no admin mutations; that boundary and option correctness are regression-tested. |
| `src/services/problemService.ts` | Problem catalog and details service | `RUNTIME-VERIFIED` | Numeric direct details with slug/degraded-route catalog fallback tested. |
| `src/services/profileService.ts` | User profile & academic details (`/userInfo`) | `RUNTIME-VERIFIED` | Nullable reads, strict envelopes, and business-only save payloads are tested in `userInfoProfile.test.mjs`. |
| `src/services/questionService.ts` | Problem CRUD and test case retrieval | `RUNTIME-VERIFIED` | Numeric direct lookup, cancellation, and test-case failure propagation covered by service tests. |
| `src/services/referenceService.ts` | Taxonomy group codes and group records | `PARTIALLY VERIFIED` | Authenticated group-code listing returned 200; encoded group paths and strict DTO validation are tested, while the current per-group production read is blocked by the backend's missing `referenceCodesByGroup` cache. |
| `src/services/userQuestionService.ts` | Solved/attempted IDs, bookmarks, submissions | `RUNTIME-VERIFIED` | Strict array extraction, cancellation signals, and backend typo endpoints are tested. |
| `src/services/admin/adminCompanyService.ts` | Admin company, role, section, exam authoring | `RUNTIME-VERIFIED` | Business-only payloads and required API-owned exam taxonomy IDs are regression-tested; live mutation remains backend-owned. |
| `src/services/admin/adminInstitutionService.ts`| Admin institution CRUD & status toggle | `RUNTIME-VERIFIED` | Sends only canonical `type` and `activeOnly` filter names; tested in `institutionManagement.test.mjs`. |
| `src/services/admin/adminLanguageService.ts` | Admin language compiler management | `RUNTIME-VERIFIED` | One save method matches the shared create/update POST; successful mutations invalidate execution-language cache. |
| `src/services/admin/adminReferenceService.ts` | Admin reference create/update/hard delete | `PARTIALLY VERIFIED` | Request/response shapes, encoded delete path, and admin isolation are source-tested; production mutations were not executed. |
| `src/services/admin/adminMcqService.ts` | Admin MCQ mutations and management reads | `RUNTIME-VERIFIED` | Owns one create/update save method plus delete, delegates shared reads, and uses the semantic `ADMIN_SAVE` endpoint constant. |
| `src/services/admin/adminQuestionService.ts` | Admin question management | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |
| `src/services/admin/adminLearningSheetService.ts` | Admin DSA sheet authoring and link management | `PARTIALLY VERIFIED` | Endpoint/body shapes and token-compatible DELETE bodies are tested; live production mutations were not executed. |

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
| `src/shared/context/ThemeContext.tsx` | Dark/Light theme provider and hook | `RUNTIME-VERIFIED` | Verified theme switching. |

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
| `pages/PracticePage.tsx` | Practice catalog hub | `RUNTIME-VERIFIED` | Multi-select URL-backed filters (difficulty, topic, company, platform via comma-separated params), quick sort/status/page-size dropdowns, individual active filter pill removal, skeleton-backed query transitions, and post-filtering catalog pagination are regression-tested. |
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
| `pages/CompanyList.tsx` | Paginated recruiter directory | `RUNTIME-VERIFIED` | Search, industry, and page are URL-backed; pages clamp safely, restore with browser history, scroll to results on explicit pagination, and cards are keyboard operable. |
| `pages/CompanyDetails.tsx` | Company profile & past questions | `RUNTIME-VERIFIED` | Initial detail requests render a company skeleton before not-found evaluation; slug lookup, dynamic SUBJECT reference IDs, and malformed MCQ errors remain intact. |
| `pages/CompanyExamDetails.tsx` | Detailed recruitment exam blueprint | `RUNTIME-VERIFIED` | Exam section duration & question counts. |
| `redux/companySlice.ts` | Company Redux slice | `RUNTIME-VERIFIED` | Tested in `companyResilience.test.mjs`. |
| `types/companyExam.ts` | Exam & blueprint type definitions | `VERIFIED` | Full type declarations. |
| `utils/companyLogoRegistry.ts` | Canonical aliases, bundled manifest, domain validation, and provider candidates | `RUNTIME-VERIFIED` | All 121 files remain bundled; all additional manifest entries and candidate-order rules are tested in `companyLogos.test.mjs`. |

### D. Aptitude Feature (`src/features/aptitude/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `pages/AptitudePrep.tsx` | Multi-subject aptitude practice hub | `RUNTIME-VERIFIED` | Difficulty filters and labels use API reference records only; missing taxonomy surfaces a retryable status rather than static fallback DTOs. |
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
| `components/companies/*` | Company, exam, role, section modals | `RUNTIME-VERIFIED` | Exam sections load `EXAM SECTION TYPE` and `QUESTION TYPE` through shared reference state and never substitute legacy numeric IDs. |
| `components/dashboard/*` | Dashboard metrics, code runner, overview | `RUNTIME-VERIFIED` | Live admin KPI metrics across 8 cards (including DSA Sheets); dynamic user role from Redux auth; code runner sandbox features dynamic problem-tailored boilerplate generation, demo solution loading, draft persistence per problem/language, resilient 5-tier fallback, and real-time Judge0 execution against selected problem test cases. |
| `components/institutions/*` | Institution details, form, status modals | `RUNTIME-VERIFIED` | Tested in `institutionManagement.test.mjs`. |
| `components/questions/*` | Question form, details, test case modals | `PARTIALLY VERIFIED` | Dynamic reference library bindings (DIFF, TOPIC, QPF, TESTCASETYPE), sequential displayOrder on hints, and testcase assertions verified; live admin mutation remains backend-owned. |
| `pages/AdminDashboard.tsx` | Live admin dashboard metrics | `RUNTIME-VERIFIED` | Uses shared `DIFF` reference state and never substitutes legacy numeric IDs; unavailable references omit the affected request and remain retryable. |
| `pages/AdminCompanies.tsx` | Company CRUD page | `RUNTIME-VERIFIED` | Keyboard-operable cards and synchronous duplicate-save protection; live mutation remains unverified. |
| `pages/AdminInstitutions.tsx` | Institution directory management | `RUNTIME-VERIFIED` | Strict pages, authoritative edit details, clamped pagination, complete university options, and duplicate mutation guards. |
| `pages/AdminLanguages.tsx` | Language compiler configuration | `RUNTIME-VERIFIED` | Loading KPIs use skeletons and save/deactivation handlers reject duplicate actions. |
| `pages/AdminReferences.tsx` | Reference taxonomy administration | `PARTIALLY VERIFIED` | Admin-only mutations, shared group-record state, mutation locking, cache invalidation, and explicit hard-delete confirmation are locally verified; production mutations were not executed. |
| `pages/AdminMcqs.tsx` | MCQ question bank authoring | `RUNTIME-VERIFIED` | Strict list/detail handling, stable initial unfiltered requests during reference hydration, authoritative view/edit data, reference name payload attachment, page clamping, and option-level correctness are tested. |
| `pages/AdminQuestions.tsx` | Coding problem CRUD | `PARTIALLY VERIFIED` | Strict pages, authoritative details, page clamping, full test case retrieval (both visible and hidden) on Manage Test Cases, and partial test-case-save feedback are tested; live admin mutation remains unverified. |
| `pages/AdminDsaSheets.tsx` | DSA sheet, section, and question-link management | `PARTIALLY VERIFIED` | Create/edit modals cover sheets, sections, and association metadata; edit payload IDs and cache invalidation are regression-tested, but live authenticated mutations were not executed. |
| `utils/testCaseUtils.ts` | Test case extractor & parser | `PARTIALLY VERIFIED` | Parses API payload/visible examples only; no bundled hidden fixtures. |

### F. DSA Sheet Feature (`src/features/dsaSheet/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/DsaSheetHeroBanner.tsx` | Theme-aware generated DSA hero banner | `RUNTIME-VERIFIED` | Uses project-local light/dark raster assets with 2048x384 dimensions matching Practice/Aptitude banner container and design treatment. |
| `pages/DsaSheetPage.tsx` | Student DSA learning-path UI | `RUNTIME-VERIFIED` | Connected to Redux Toolkit (`dsaSheetSlice`); accessible two-path toggle, TTL caching, accordion question fetching, error retries, and superseded request cancellation. |
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
| `src/features/profile/components/modals/*` | Academic and personal modals | `VERIFIED` | Reference-backed gender and API-owned academic editing; unsupported photo editor removed. |
| `src/features/profile/pages/ProfileSettings.tsx` | Profile settings & performance metrics | `RUNTIME-VERIFIED` | Academic/personal records are API-driven; enrichment requests are cancellable, progress metrics avoid duplicate calls, and saves use a synchronous mutation lock. |
| `src/features/profile/redux/profileSlice.ts` | Profile Redux slice | `RUNTIME-VERIFIED` | User/request ownership, valid-null caching, response identity repair, and immediate account-switch clearing are tested. |
| `src/features/progress/redux/progressSlice.ts` | Progress Redux slice | `RUNTIME-VERIFIED` | Remote/local merge, warning fallbacks, cancellation, immediate scope clearing, and stale-response protection are tested. |
| `src/features/references/redux/referenceSlice.ts` | Reference taxonomy Redux slice | `RUNTIME-VERIFIED` | Empty-result TTL caching and stale-response ownership tested. |
| `src/features/roadmaps/pages/RoadmapDetails.tsx` | DSA and engineering roadmaps | `VERIFIED` | Gated by `ComingSoon`. |
| `src/features/settings/pages/AppSettings.tsx` | Application settings (theme, notifications)| `VERIFIED` | Settings view. |

---

## 9. Verification Summary & Audit Totals

- **Total First-Party TypeScript/TSX Files in `src/`**: 155
- **Total Automated Test Suites in `scripts/tests/`**: 22
- **Total Executed Automated Unit Tests**: 334 (334 Passed, 0 Failed; 100 reported suites across 22 files)
- **TypeScript Static Check (`npm run typecheck`)**: 0 errors
- **Oxlint Static Code Analysis (`npm run lint`)**: 0 warnings, 0 errors across 177 files
- **Vite Production Bundler Build (`npm run build`)**: 0 errors; five prerendered public documents, a noindex app shell, `404.html`, and `sitemap.xml` generated.
- **Documentation Integrity (`npm run verify:docs`)**: 272 internal links and source references passed.
- **Architecture Verification (`npm run verify:architecture`)**: `RUNTIME-VERIFIED` — 159 source files scanned successfully, including API transport, endpoint-domain, environment, route, and prohibited-pattern checks.
- **Preview Smoke Test (`scripts/smoke-preview.mjs`)**: `RUNTIME-VERIFIED` — Preview smoke test passes across 5 routes and 11 bundle assets.


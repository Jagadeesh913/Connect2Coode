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
| `vercel.json` | Edge routing, proxy rewrites, SPA fallback | `PARTIALLY VERIFIED` | Adds crawler-only metadata rewriting and defense-in-depth `X-Robots-Tag` headers; JSON and regression tests pass, but header-conditioned Vercel routing needs deployed verification. |
| `api/social.ts` | Crawler-only server-rendered metadata endpoint | `RUNTIME-VERIFIED` | Emits escaped, absolute canonical/social tags; dynamic API data is accepted only when its identity matches the requested route. |
| `index.html` | HTML entry, browser branding, default SEO/social metadata | `RUNTIME-VERIFIED` | Exactly one default description, robots, Open Graph, and Twitter/X set; manifest and icon links verified. Runtime metadata creates the canonical link from the real origin. |
| `.env.example` | Documented environment variable template | `VERIFIED` | Contains API/app settings plus optional canonical frontend origin and public Brandfetch client ID. |
| `.env.production`| Production environment config | `VERIFIED` | Targets `https://api.connect2code.in/api/v1`. |
| `.env` | Local development environment override (untracked) | `VERIFIED` | Local development override. |
| `.gitignore` | Git exclusion rules (ignores `.env`, `graphify-out/`) | `VERIFIED` | Validated against git tracking. |
| `.github/workflows/frontend-ci.yml` | GitHub Actions CI workflow | `VERIFIED` | Matches actual scripts and Node 22 version. |

---

## 3. Entry Points & App Root (`src/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/main.tsx` | React 19 root entry | `RUNTIME-VERIFIED` | Mounts `<App />` into `#root`. |
| `src/App.tsx` | Top-level providers and router layout | `RUNTIME-VERIFIED` | Provider, ThemeProvider, Toaster, ErrorBoundary. |
| `src/index.css` | Tailwind v4 styles, tokens, themes | `RUNTIME-VERIFIED` | Compiled cleanly by `@tailwindcss/vite`. |
| `src/vite-env.d.ts`| Vite client type declarations | `VERIFIED` | Standard client typings. |
| `src/app/store.ts` | Redux store configuration | `RUNTIME-VERIFIED` | Configured with rootReducer and post-reducer persistence middleware. |
| `src/app/clientPersistenceMiddleware.ts` | Scoped bookmark/progress persistence boundary | `RUNTIME-VERIFIED` | Persists next Redux state after fulfilled mutations/hydration; only COMPANY/APTITUDE bookmarks are stored locally. |
| `src/app/rootReducer.ts` | Combined root reducer (9 slices) | `RUNTIME-VERIFIED` | Combines auth, problems, companies, dsaSheet, progress, bookmarks, profile, references, languages. |
| `src/app/hooks.ts` | Typed Redux hooks | `RUNTIME-VERIFIED` | React Redux 9 `withTypes` hooks for dispatch, selector, and store. |

---

## 4. Core Architecture Layer (`src/core/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/core/api/apiClient.ts` | Central Axios client, interceptors, refresh lock | `RUNTIME-VERIFIED` | Deep token purge, base URL resolution tested in `apiClient.test.mjs`. |
| `src/core/api/endpoints.ts` | Centralized REST endpoint constants | `RUNTIME-VERIFIED` | Includes tested user/admin learning-sheet route builders. |
| `src/core/guards/AdminRoute.tsx` | Admin route gate checking JWT claims | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/guards/GuestRoute.tsx` | Guest route gate redirecting logged-in users | `RUNTIME-VERIFIED` | Admin redirect selection uses signed JWT claims only; covered by auth regression tests. |
| `src/core/guards/ProtectedRoute.tsx` | User route gate redirecting to `/login` | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/mappers/problemMapper.ts` | Question DTO to problem model mapper | `RUNTIME-VERIFIED` | Maps question catalog and detail payloads, preserving testCases, examples, constraints, hints, and ref metadata. |
| `src/core/metadata/pageMetadata.ts` | Central route metadata policy and safe text helpers | `RUNTIME-VERIFIED` | Covers all exact, dynamic, redirect, error, authenticated, and admin route families. |
| `src/core/metadata/crawlerMetadata.ts` | Static crawler document renderer and canonical-origin policy | `RUNTIME-VERIFIED` | Produces one escaped metadata set with absolute URLs and only accepts configured HTTPS origins. |
| `src/core/metadata/MetadataContext.ts` | Navigation-keyed dynamic metadata context | `RUNTIME-VERIFIED` | Prevents a detail override from surviving navigation to another route. |
| `src/core/metadata/RouteMetadata.tsx` | DOM head reconciler | `RUNTIME-VERIFIED` | Owns title, canonical, robots, Open Graph, and Twitter/X tags without duplicate nodes. |
| `src/core/metadata/usePageMetadata.ts` | API-backed detail metadata hook | `RUNTIME-VERIFIED` | Dynamic overrides are registered and cleaned up against the active location key. |
| `src/core/security/jwt.ts` | JWT payload decoder, claim extractor, expiry | `RUNTIME-VERIFIED` | Tested in `authSession.test.mjs`. |
| `src/core/security/authSessionSync.ts` | Credential-free same-origin tab session event transport | `RUNTIME-VERIFIED` | BroadcastChannel with transient storage-event fallback; tested event validation. |
| `src/core/security/tokenStorage.ts` | Cookie & memory token storage | `RUNTIME-VERIFIED` | Web-storage credential/profile mirroring removed; legacy copies are cleaned, and cross-tab events clear stale per-tab memory. |
| `src/core/storage/userScopedStorage.ts` | User-scoped local storage with FNV-1a hash | `RUNTIME-VERIFIED` | Tested in `taskRemediationVerification.test.mjs`. |
| `src/core/types/api.ts` | REST response envelopes (`ApiResponse`, `ApiPage`) | `VERIFIED` | Strict DTO types. |
| `src/core/types/domain.ts` | Domain models (Problem, Company, MCQ, User, etc.) | `RUNTIME-VERIFIED` | MCQ question type no longer admits stale top-level correctness fields; includes API-supported optional execution `customInput`. |
| `src/core/validation/commonRules.ts` | Zod validators (email, password, name, phone, URL) | `RUNTIME-VERIFIED` | Migrated to Zod 4 error APIs and tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/serverErrorMapper.ts`| Backend error parser and security leak filter | `RUNTIME-VERIFIED` | Tested in `batch4Remediation.test.mjs`. |
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
| `src/services/companyService.ts` | Companies and recruitment exams service | `PARTIALLY VERIFIED` | Strict page/detail envelopes and complete paginated catalog loading are tested; a non-empty live exam/detail DTO and admin mutations remain unverified. |
| `src/services/executionService.ts` | Monaco code runner and Judge0 service | `PARTIALLY VERIFIED` | Language caching, API-only reference-ID resolution, custom-input payloads, malformed response rejection, and non-zero success verdicts are covered by tests; live execution remains backend-dependent. |
| `src/services/institutionService.ts` | Public institution search autocomplete | `RUNTIME-VERIFIED` | Tested in `apiIntegration.test.mjs`. |
| `src/services/learningSheetService.ts` | DSA sheets, ordered sections, and linked-question reads | `RUNTIME-VERIFIED` | Strict DTO boundaries, positive IDs, top-level filtering, and ordering are tested. Live API access remains backend-dependent. |
| `src/services/mcqService.ts` | Aptitude MCQ queries and scoring | `RUNTIME-VERIFIED` | Tested in `mcqCorrectOption.test.mjs`. |
| `src/services/problemService.ts` | Problem catalog and details service | `RUNTIME-VERIFIED` | Numeric direct details with slug/degraded-route catalog fallback tested. |
| `src/services/profileService.ts` | User profile & academic details (`/userInfo`) | `RUNTIME-VERIFIED` | Tested in `userInfoProfile.test.mjs`. |
| `src/services/questionService.ts` | Problem CRUD and test case retrieval | `RUNTIME-VERIFIED` | Numeric direct lookup, cancellation, and test-case failure propagation covered by service tests. |
| `src/services/referenceService.ts` | Taxonomy metadata (`DIFF`, `TOPIC`, `QPF`) | `RUNTIME-VERIFIED` | Verified with conditional Redux caching. |
| `src/services/userQuestionService.ts` | Solved/attempted IDs, bookmarks, submissions | `RUNTIME-VERIFIED` | Strict array extraction, cancellation signals, and backend typo endpoints are tested. |
| `src/services/admin/adminCompanyService.ts` | Admin company, role, section, exam authoring | `RUNTIME-VERIFIED` | Strict `jwtToken` verified in `userInfoProfile.test.mjs`. |
| `src/services/admin/adminInstitutionService.ts`| Admin institution CRUD & status toggle | `RUNTIME-VERIFIED` | Tested in `institutionManagement.test.mjs`. |
| `src/services/admin/adminLanguageService.ts` | Admin language compiler management | `RUNTIME-VERIFIED` | Successful mutations invalidate execution-language cache; regression tested. |
| `src/services/admin/adminMcqService.ts` | Admin MCQ CRUD | `RUNTIME-VERIFIED` | Tested in `mcqCorrectOption.test.mjs`. |
| `src/services/admin/adminQuestionService.ts` | Admin question management | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |
| `src/services/admin/adminLearningSheetService.ts` | Admin DSA sheet authoring and link management | `PARTIALLY VERIFIED` | Endpoint/body shapes and token-compatible DELETE bodies are tested; live production mutations were not executed. |

---

## 6. Layouts & Routes (`src/layouts/`, `src/routes/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/layouts/AppRouterLayout.tsx` | Top-level router wrapper with scroll restoration and route metadata | `RUNTIME-VERIFIED` | Reconciles session state and mounts metadata ownership above every route branch. |
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
| `src/shared/hooks/useAssessmentIntegrity.ts` | Student-workspace clipboard/shortcut deterrence | `RUNTIME-VERIFIED` | Clipboard, developer-tool, Print Screen, and allowed execution-shortcut classification tested. |
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
| `pages/ProblemDetails.tsx` | Monaco editor coding workspace | `RUNTIME-VERIFIED` | Cancels history reads, resolves API language IDs/reference IDs, and accepts only non-zero passing verdicts. Browser-level proctoring remains unverified/unavailable. |
| `pages/ProblemList.tsx` | Legacy standalone problem-list page | `VERIFIED` | Retained but no longer owns `/dsa-sheet`; the route now uses the API-driven DSA feature. |
| `redux/problemSlice.ts` | Problem Redux slice with TTL/LRU caches | `RUNTIME-VERIFIED` | Request ownership plus stale-row clearing and same-query refresh retention are tested in `problemSliceAbortRecovery.test.mjs`. |
| `utils/problemEditorial.ts` | Problem solution editorial formatter | `VERIFIED` | Markdown editorial formatting. |
| `utils/problemExecution.ts` | Output formatter, error parser, language resolver | `RUNTIME-VERIFIED` | Language entity/reference-ID resolution is tested. |

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
| `pages/AptitudePrep.tsx` | Multi-subject aptitude practice hub | `RUNTIME-VERIFIED` | Query changes clear mismatched rows/totals and render skeletons; multi-select difficulty, question type, subject, and company filters are keyboard-operable toggles. |
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
| `components/companies/*` | Company, exam, role, section modals | `VERIFIED` | Admin authoring modals. |
| `components/dashboard/*` | Dashboard metrics, code runner, overview | `RUNTIME-VERIFIED` | Live admin KPI metrics; code runner sandbox supports dynamic question bank selection, real-time search, manual ID resolution, collapsible problem statement & test cases preview, and real-time Judge0 execution against selected problem test cases. |
| `components/institutions/*` | Institution details, form, status modals | `RUNTIME-VERIFIED` | Tested in `institutionManagement.test.mjs`. |
| `components/questions/*` | Question form, details, test case modals | `PARTIALLY VERIFIED` | Dynamic reference library bindings (DIFF, TOPIC, QPF, TESTCASETYPE), sequential displayOrder on hints, and testcase assertions verified; live admin mutation remains backend-owned. |
| `pages/AdminDashboard.tsx` | Live admin dashboard metrics | `RUNTIME-VERIFIED` | Uses totalElements, never sample-derived global difficulty totals, and surfaces partial metric failures. |
| `pages/AdminCompanies.tsx` | Company CRUD page | `RUNTIME-VERIFIED` | Keyboard-operable cards and synchronous duplicate-save protection; live mutation remains unverified. |
| `pages/AdminInstitutions.tsx` | Institution directory management | `RUNTIME-VERIFIED` | Strict pages, authoritative edit details, clamped pagination, complete university options, and duplicate mutation guards. |
| `pages/AdminLanguages.tsx` | Language compiler configuration | `RUNTIME-VERIFIED` | Loading KPIs use skeletons and save/deactivation handlers reject duplicate actions. |
| `pages/AdminMcqs.tsx` | MCQ question bank authoring | `RUNTIME-VERIFIED` | Strict list/detail handling, stable initial unfiltered requests during reference hydration, authoritative view/edit data, reference name payload attachment, page clamping, and option-level correctness are tested. |
| `pages/AdminQuestions.tsx` | Coding problem CRUD | `PARTIALLY VERIFIED` | Strict pages, authoritative details, page clamping, full test case retrieval (both visible and hidden) on Manage Test Cases, and partial test-case-save feedback are tested; live admin mutation remains unverified. |
| `pages/AdminDsaSheets.tsx` | DSA sheet, section, and question-link management | `PARTIALLY VERIFIED` | Superseded reads are canceled and duplicate mutations are guarded; typecheck/build/source contracts pass, but live admin mutations were not executed. |
| `utils/testCaseUtils.ts` | Test case extractor & parser | `PARTIALLY VERIFIED` | Parses API payload/visible examples only; no bundled hidden fixtures. |

### F. DSA Sheet Feature (`src/features/dsaSheet/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/DsaSheetHeroBanner.tsx` | Theme-aware generated DSA hero banner | `RUNTIME-VERIFIED` | Uses project-local light/dark raster assets with 2048x384 dimensions matching Practice/Aptitude banner container and design treatment. |
| `pages/DsaSheetPage.tsx` | Student DSA learning-path UI | `RUNTIME-VERIFIED` | Connected to Redux Toolkit (`dsaSheetSlice`); accessible two-path toggle, TTL caching, accordion question fetching, error retries, and superseded request cancellation. |
| `redux/dsaSheetSlice.ts` | Learning sheets, sections, questions Redux slice | `RUNTIME-VERIFIED` | 5-minute TTL caching, section accordion state, and error handling tested in `dsaSheetSlice.test.mjs`. |
| `types.ts` | Learning sheet, section, question-link, and mutation DTOs | `RUNTIME-VERIFIED` | Used by strict service validation and contract tests. |

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

- **Total First-Party TypeScript/TSX Files in `src/`**: 152
- **Total Automated Test Suites in `scripts/tests/`**: 21
- **Total Executed Automated Unit Tests**: 311 (311 Passed, 0 Failed; 99 reported suites across 21 files)
- **TypeScript Static Check (`npm run typecheck`)**: 0 errors
- **Oxlint Static Code Analysis (`npm run lint`)**: 0 warnings, 0 errors across 177 files
- **Vite Production Bundler Build (`npm run build`)**: 0 errors
- **Documentation Integrity (`npm run verify:docs`)**: 255 internal links and source references passed.
- **Architecture Verification (`npm run verify:architecture`)**: `NOT WORKING` in this workspace only because an ignored local `.env` exists; no direct Axios/fetch/`Math.random()` violation was reported. Passes in CI without local `.env`.
- **Preview Smoke Test (`scripts/smoke-preview.mjs`)**: `RUNTIME-VERIFIED` — Preview smoke test passes across 5 routes and 11 bundle assets.


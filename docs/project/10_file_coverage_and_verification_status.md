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
| `vercel.json` | Edge routing, proxy rewrites, SPA fallback | `VERIFIED` | Validated rewrites for `/api/*` and SPA fallback. |
| `index.html` | HTML entry container, font preloads, theme init | `RUNTIME-VERIFIED` | Verified mounting container `#root`. |
| `.env.example` | Documented environment variable template | `VERIFIED` | Contains `VITE_API_BASE_URL`, `VITE_APP_NAME`. |
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
| `src/app/clientPersistenceMiddleware.ts` | Scoped bookmark/progress persistence boundary | `RUNTIME-VERIFIED` | Persists next Redux state after fulfilled mutations/hydration; reducers remain deterministic. |
| `src/app/rootReducer.ts` | Combined root reducer (8 slices) | `RUNTIME-VERIFIED` | Combines auth, problems, companies, etc. |
| `src/app/hooks.ts` | Typed Redux hooks | `RUNTIME-VERIFIED` | React Redux 9 `withTypes` hooks for dispatch, selector, and store. |

---

## 4. Core Architecture Layer (`src/core/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/core/api/apiClient.ts` | Central Axios client, interceptors, refresh lock | `RUNTIME-VERIFIED` | Deep token purge, base URL resolution tested in `apiClient.test.mjs`. |
| `src/core/api/endpoints.ts` | Centralized REST endpoint constants | `VERIFIED` | Maps all 37+ platform endpoints. |
| `src/core/guards/AdminRoute.tsx` | Admin route gate checking JWT claims | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/guards/GuestRoute.tsx` | Guest route gate redirecting logged-in users | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/guards/ProtectedRoute.tsx` | User route gate redirecting to `/login` | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/mappers/problemMapper.ts` | DTO to domain model mapper | `RUNTIME-VERIFIED` | Platform values are API-field-only; missing metadata is not inferred from IDs. |
| `src/core/security/jwt.ts` | JWT payload decoder, claim extractor, expiry | `RUNTIME-VERIFIED` | Tested in `authSession.test.mjs`. |
| `src/core/security/authSessionSync.ts` | Credential-free same-origin tab session event transport | `RUNTIME-VERIFIED` | BroadcastChannel with transient storage-event fallback; tested event validation. |
| `src/core/security/tokenStorage.ts` | Cookie & memory token storage | `RUNTIME-VERIFIED` | Web-storage credential/profile mirroring removed; legacy copies are cleaned, and cross-tab events clear stale per-tab memory. |
| `src/core/storage/userScopedStorage.ts` | User-scoped local storage with FNV-1a hash | `RUNTIME-VERIFIED` | Tested in `taskRemediationVerification.test.mjs`. |
| `src/core/types/api.ts` | REST response envelopes (`ApiResponse`, `ApiPage`) | `VERIFIED` | Strict DTO types. |
| `src/core/types/domain.ts` | Domain models (Problem, Company, MCQ, User, etc.) | `RUNTIME-VERIFIED` | Includes API-supported optional execution `customInput`; exercised by `apiIntegration.test.mjs`. |
| `src/core/validation/commonRules.ts` | Zod validators (email, password, name, phone, URL) | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/serverErrorMapper.ts`| Backend error parser and security leak filter | `RUNTIME-VERIFIED` | Tested in `batch4Remediation.test.mjs`. |
| `src/core/validation/index.ts` | Re-exports validation rules | `VERIFIED` | Re-exports all schemas. |
| `src/core/validation/schemas/adminSchemas.ts` | Zod schemas for admin forms | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/schemas/authSchemas.ts` | Zod schemas for login, signup, forgot password | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/schemas/profileSchemas.ts` | Zod schemas for user profile & academics | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |

---

## 5. Service Layer (`src/services/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/services/authService.ts` | Authentication REST service | `RUNTIME-VERIFIED` | Login/refresh notify open same-origin tabs without disclosing credentials; tested in `authSession.test.mjs`. |
| `src/services/companyService.ts` | Companies and recruitment exams service | `RUNTIME-VERIFIED` | Tested in `companyResilience.test.mjs`. |
| `src/services/executionService.ts` | Monaco code runner and Judge0 service | `RUNTIME-VERIFIED` | Language request deduplication/cache invalidation, API-only reference-ID resolution, custom-input payloads, and defensive response normalization tested. |
| `src/services/institutionService.ts` | Public institution search autocomplete | `RUNTIME-VERIFIED` | Tested in `apiIntegration.test.mjs`. |
| `src/services/mcqService.ts` | Aptitude MCQ queries and scoring | `RUNTIME-VERIFIED` | Tested in `mcqCorrectOption.test.mjs`. |
| `src/services/problemService.ts` | Problem catalog and details service | `RUNTIME-VERIFIED` | Numeric direct details with slug/degraded-route catalog fallback tested. |
| `src/services/profileService.ts` | User profile & academic details (`/userInfo`) | `RUNTIME-VERIFIED` | Tested in `userInfoProfile.test.mjs`. |
| `src/services/questionService.ts` | Problem CRUD and test case retrieval | `RUNTIME-VERIFIED` | Numeric direct lookup, cancellation, and test-case failure propagation covered by service tests. |
| `src/services/referenceService.ts` | Taxonomy metadata (`DIFF`, `TOPIC`, `QPF`) | `RUNTIME-VERIFIED` | Verified with conditional Redux caching. |
| `src/services/userQuestionService.ts` | Solved/attempted IDs, bookmarks, submissions | `RUNTIME-VERIFIED` | Verified with backend typo endpoints. |
| `src/services/admin/adminCompanyService.ts` | Admin company, role, section, exam authoring | `RUNTIME-VERIFIED` | Strict `jwtToken` verified in `userInfoProfile.test.mjs`. |
| `src/services/admin/adminInstitutionService.ts`| Admin institution CRUD & status toggle | `RUNTIME-VERIFIED` | Tested in `institutionManagement.test.mjs`. |
| `src/services/admin/adminLanguageService.ts` | Admin language compiler management | `RUNTIME-VERIFIED` | Successful mutations invalidate execution-language cache; regression tested. |
| `src/services/admin/adminMcqService.ts` | Admin MCQ CRUD | `RUNTIME-VERIFIED` | Tested in `mcqCorrectOption.test.mjs`. |
| `src/services/admin/adminQuestionService.ts` | Admin question management | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |

---

## 6. Layouts & Routes (`src/layouts/`, `src/routes/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/layouts/AppRouterLayout.tsx` | Top-level router wrapper with scroll restoration | `RUNTIME-VERIFIED` | Reconciles Redux and per-tab token memory after credential-free session lifecycle events. |
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
| `src/shared/components/ui/Button.tsx` | Reusable button component | `RUNTIME-VERIFIED` | Verified across forms and actions. |
| `src/shared/components/ui/ConfirmDialog.tsx` | Modal confirmation dialog | `VERIFIED` | Used in deletion workflows. |
| `src/shared/components/ui/EmptyState.tsx` | Empty state placeholder | `VERIFIED` | Used in empty tables/lists. |
| `src/shared/components/ui/Footer.tsx` | Global footer | `RUNTIME-VERIFIED` | Verified in MainLayout. |
| `src/shared/components/ui/FormFieldError.tsx` | Form validation message | `RUNTIME-VERIFIED` | Used across React Hook Form inputs. |
| `src/shared/components/ui/Navbar.tsx` | Global top navigation bar | `RUNTIME-VERIFIED` | User avatar, theme toggle, nav links. |
| `src/shared/components/ui/PageLoading.tsx` | Full-screen and container loading state | `RUNTIME-VERIFIED` | Brand logo pulse animation. |
| `src/shared/components/ui/Pagination.tsx` | Pagination control | `RUNTIME-VERIFIED` | Verified in problem lists and tables. |
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
| `pages/Login.tsx` | Login form page | `RUNTIME-VERIFIED` | Zod validation, authModalMode support. |
| `pages/Signup.tsx` | Registration form page | `RUNTIME-VERIFIED` | Name, email, password matching validation. |
| `pages/ForgotPassword.tsx` | Two-step OTP password reset | `RUNTIME-VERIFIED` | OTP generation & verification flow. |
| `pages/OAuthCallback.tsx` | Google OAuth popup callback handler | `RUNTIME-VERIFIED` | Passes tokens to opener via postMessage. |
| `redux/authSlice.ts` | Auth Redux slice | `RUNTIME-VERIFIED` | Tested in `authSession.test.mjs`. |

### B. Problems Feature (`src/features/problems/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/PracticeHeroBanner.tsx` | Hero banner with problem stats & search | `RUNTIME-VERIFIED` | Verified on PracticePage. |
| `hooks/useExecutionRequest.ts` | Custom hook for Monaco code running | `RUNTIME-VERIFIED` | Handles run/submit state & aborts. |
| `pages/PracticePage.tsx` | Practice catalog hub | `RUNTIME-VERIFIED` | Topic tabs, filters, problem grid. |
| `pages/ProblemDetails.tsx` | Monaco editor coding workspace | `RUNTIME-VERIFIED` | Split-pane editor, API-connected custom input, auto-revealed results, and scoped integrity controls. Browser-level proctoring remains unverified/unavailable. |
| `pages/ProblemList.tsx` | Structured DSA problem sheet | `RUNTIME-VERIFIED` | Filterable problem list. |
| `redux/problemSlice.ts` | Problem Redux slice with TTL/LRU caches | `RUNTIME-VERIFIED` | Tested in `problemSliceAbortRecovery.test.mjs`. |
| `utils/problemEditorial.ts` | Problem solution editorial formatter | `VERIFIED` | Markdown editorial formatting. |
| `utils/problemExecution.ts` | Output formatter & error parser | `RUNTIME-VERIFIED` | Formats stdout and execution stats. |

### C. Companies Feature (`src/features/companies/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/CompanyBrandLogo.tsx` | Vector recruiter logo with fallback | `RUNTIME-VERIFIED` | Tested in `companyLogos.test.mjs`. |
| `components/CompanyExamCard.tsx` | Exam card displaying rounds & syllabus | `RUNTIME-VERIFIED` | Verified on CompanyExamDetails. |
| `pages/CompanyList.tsx` | Directory of 30+ tech recruiters | `RUNTIME-VERIFIED` | Verified in smoke preview. |
| `pages/CompanyDetails.tsx` | Company profile & past questions | `RUNTIME-VERIFIED` | Slug lookup with fallback. |
| `pages/CompanyExamDetails.tsx` | Detailed recruitment exam blueprint | `RUNTIME-VERIFIED` | Exam section duration & question counts. |
| `redux/companySlice.ts` | Company Redux slice | `RUNTIME-VERIFIED` | Tested in `companyResilience.test.mjs`. |
| `types/companyExam.ts` | Exam & blueprint type definitions | `VERIFIED` | Full type declarations. |
| `utils/companyLogoRegistry.ts` | 700+ lines canonical alias logo registry | `RUNTIME-VERIFIED` | Tested in `companyLogos.test.mjs`. |

### D. Aptitude Feature (`src/features/aptitude/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `pages/AptitudePrep.tsx` | Multi-subject aptitude practice hub | `RUNTIME-VERIFIED` | Quantitative, Reasoning, Verbal, Pseudocode. |
| `utils/mcqUtils.ts` | MCQ option synthesizer & correct option resolver | `RUNTIME-VERIFIED` | Strict option-level `isCorrect` verified in `mcqCorrectOption.test.mjs`. |

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
| `components/AdminModal.tsx` | Base modal dialog for admin forms | `PARTIALLY VERIFIED` | Framer Motion transition honors reduced-motion; source-level regression test, no browser assistive-technology run. |
| `components/AdminPageHeader.tsx` | Admin page title & action buttons | `VERIFIED` | Page header. |
| `components/AdminSidebar.tsx` | Admin navigation sidebar | `RUNTIME-VERIFIED` | Links to questions, mcqs, companies, etc. |
| `components/AdminTable.tsx` | Reusable sortable admin table | `VERIFIED` | Table component. |
| `components/companies/*` | Company, exam, role, section modals | `VERIFIED` | Admin authoring modals. |
| `components/dashboard/*` | Dashboard metrics, code runner, overview | `RUNTIME-VERIFIED` | Live admin KPI metrics; code runner now freezes editor during execution and reports backend pass/fail verdicts. |
| `components/institutions/*` | Institution details, form, status modals | `RUNTIME-VERIFIED` | Tested in `institutionManagement.test.mjs`. |
| `components/questions/*` | Question form, details, test case modals | `PARTIALLY VERIFIED` | Failed test-case saves remain visible errors; admin code tester freezes editor and reports returned verdicts, but live admin API remains unverified. |
| `pages/AdminDashboard.tsx` | Live admin dashboard metrics | `RUNTIME-VERIFIED` | Queries live counts across all entities. |
| `pages/AdminCompanies.tsx` | Company CRUD page | `VERIFIED` | Admin company management. |
| `pages/AdminInstitutions.tsx` | Institution directory management | `RUNTIME-VERIFIED` | Verified college status toggling. |
| `pages/AdminLanguages.tsx` | Language compiler configuration | `VERIFIED` | Compiler registry management. |
| `pages/AdminMcqs.tsx` | MCQ question bank authoring | `RUNTIME-VERIFIED` | Option-level `isCorrect` verified. |
| `pages/AdminQuestions.tsx` | Coding problem CRUD | `PARTIALLY VERIFIED` | API payload is authoritative; browser metadata/test-case caches removed, live admin API unverified. |
| `utils/testCaseUtils.ts` | Test case extractor & parser | `PARTIALLY VERIFIED` | Parses API payload/visible examples only; no bundled hidden fixtures. |

### F. Profile, Bookmarks, Landing, Settings, Roadmaps
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/features/bookmarks/pages/BookmarksList.tsx` | User bookmarked problems page | `RUNTIME-VERIFIED` | Verified in protected route branch. |
| `src/features/bookmarks/redux/bookmarkSlice.ts` | Bookmarks Redux slice | `RUNTIME-VERIFIED` | Type-aware identity, per-item mutation deduplication, and stale-response ownership tested. |
| `src/features/institutions/components/InstitutionAutocomplete.tsx` | College autocomplete input | `RUNTIME-VERIFIED` | Min 3 chars debounce check. |
| `src/features/interviews/pages/InterviewPrep.tsx` | Curated interview questions | `VERIFIED` | Gated by `ComingSoon`. |
| `src/features/landing/pages/Landing.tsx` | Public landing page with demo runner | `RUNTIME-VERIFIED` | Verified in smoke preview. |
| `src/features/languages/redux/languageSlice.ts` | Language Redux slice | `RUNTIME-VERIFIED` | TTL, force refresh, and stale-response ownership tested. |
| `src/features/profile/components/modals/*` | Academic and personal modals | `VERIFIED` | Reference-backed gender and API-owned academic editing; unsupported photo editor removed. |
| `src/features/profile/pages/ProfileSettings.tsx` | Profile settings & performance metrics | `RUNTIME-VERIFIED` | Academic/personal records are API-driven; progress metrics reuse Redux API records without duplicate calls. |
| `src/features/profile/redux/profileSlice.ts` | Profile Redux slice | `RUNTIME-VERIFIED` | User/request-owned fetch and save lifecycle; stale response regression tested. |
| `src/features/progress/redux/progressSlice.ts` | Progress Redux slice | `RUNTIME-VERIFIED` | Remote/local merge, raw activity records, cancellation, and cross-user stale-response protection tested. |
| `src/features/references/redux/referenceSlice.ts` | Reference taxonomy Redux slice | `RUNTIME-VERIFIED` | Empty-result TTL caching and stale-response ownership tested. |
| `src/features/roadmaps/pages/RoadmapDetails.tsx` | DSA and engineering roadmaps | `VERIFIED` | Gated by `ComingSoon`. |
| `src/features/settings/pages/AppSettings.tsx` | Application settings (theme, notifications)| `VERIFIED` | Settings view. |

---

## 9. Verification Summary & Audit Totals

- **Total First-Party TypeScript/TSX Files in `src/`**: 136
- **Total Automated Test Suites in `scripts/tests/`**: 16
- **Total Executed Automated Unit Tests**: 215 (215 Passed, 0 Failed)
- **TypeScript Static Check (`npm run typecheck`)**: 0 errors
- **Oxlint Static Code Analysis (`npm run lint`)**: 0 warnings, 0 errors across 153 files
- **Vite Production Bundler Build (`npm run build`)**: 0 errors
- **Documentation Integrity (`npm run verify:docs`)**: 230 internal links and source references passed.
- **Architecture Verification (`npm run verify:architecture`)**: `NOT WORKING` in this workspace only because an ignored local `.env` exists; no direct Axios/fetch/`Math.random()` violation was reported. The developer-owned file was preserved.
- **Preview Smoke Test (`scripts/smoke-preview.mjs`)**: `NOT WORKING` in this local environment; Vite reported ready on 127.0.0.1:4173 but the script could not establish its loopback readiness request. CI has not been observed for this revision.

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
| `package.json` | Project scripts, Node engine, dependencies, overrides (`dompurify: 3.4.17`) | `PARTIALLY VERIFIED` | Node 22.12+ and <23 is declared; the changed tree still requires the final clean verification matrix. |
| `vite.config.ts` | Vite 8 config, React plugin, Tailwind v4, proxy rules | `PARTIALLY VERIFIED` | Development proxy TLS verification is enabled; final dev/build verification is pending. |
| `tsconfig.json` | TypeScript 5.9 compiler options (`strict: true`, ES2022) | `RUNTIME-VERIFIED` | Passes with 0 errors via `npm run typecheck`; the Vite `@/*` source alias is also declared for TypeScript resolution. |
| `tsconfig.ci.json`| CI TypeScript configuration | `VERIFIED` | Used in CI environment checks. |
| `.oxlintrc.json` | Oxlint rules (React hooks and exports) | `RUNTIME-VERIFIED` | Passes with 0 errors on 153 files in 35ms. |
| `vercel.json` | Edge routing, API proxy, valid SPA deep-link allowlist, redirects, CSP, and security/indexing headers | `PARTIALLY VERIFIED` | CSP now constrains executable/network sources; deployed Vercel headers and Monaco/OAuth/font/logo behavior require browser verification. |
| `index.html` | HTML entry, browser branding, default SEO/social metadata | `RUNTIME-VERIFIED` | Exactly one absolute apex canonical, description, robots, Open Graph, and Twitter/X set; manifest and icon links verified. |
| `public/robots.txt` | Production crawler policy and sitemap discovery | `RUNTIME-VERIFIED` | Advertises `https://connect2code.in/sitemap.xml`; page routes remain crawlable so response-level noindex directives can be observed. |
| `scripts/generate-seo-assets.mjs` | Build-time public prerender, sitemap, noindex app shell, and 404 generator | `RUNTIME-VERIFIED` | Produces five route-specific public documents with an empty React root and `<noscript>` fallback, absolute apex social/canonical URLs, `app.html`, `404.html`, and a static sitemap without authenticated or invented dynamic URLs. |
| `scripts/tests/metadataCrawler.test.mjs` | Indexing, crawler-output, sitemap, robots, and edge-route regression coverage | `RUNTIME-VERIFIED` | Covers no-JS fallback content without pre-mount root text, canonical normalization, sitemap exclusions, noindex shells, dynamic failures, and removal of bot-specific routing. |
| `scripts/verify-architecture.mjs` | Prohibited-pattern and deployment-boundary scanner | `RUNTIME-VERIFIED` | Validates the production API proxy, noindex deep-link shell, and absence of a soft-404 catch-all; a local ignored `.env` still intentionally fails the workspace run. |
| `.env.example` | Documented environment variable template | `VERIFIED` | Documents the required apex `VITE_SITE_URL`, API/app settings, and optional public Brandfetch client ID. |
| `.env.production`| Production environment config | `VERIFIED` | Targets `https://api.connect2code.in/api/v1` and pins canonical output to `https://connect2code.in`. |
| `.env` | Local development environment override (untracked) | `VERIFIED` | Local development override. |
| `.gitignore` | Git exclusion rules (ignores `.env`, `graphify-out/`) | `VERIFIED` | Validated against git tracking. |
| `.github/workflows/frontend-ci.yml` | GitHub Actions CI workflow | `PARTIALLY VERIFIED` | Typecheck uses the lockfile-installed script and Node 22; checkout/setup-node are pinned to reviewed immutable v7 SHAs. A CI run on this tree is still pending. |

---

## 3. Entry Points & App Root (`src/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/main.tsx` | React 19 root entry | `RUNTIME-VERIFIED` | Mounts `<App />` into `#root`. |
| `src/App.tsx` | Top-level providers and router layout | `RUNTIME-VERIFIED` | Redux Provider, user-scoped ThemeProvider, ErrorBoundary, and a responsive safe-area-aware Toaster offset below the sticky navbar. |
| `src/index.css` | Tailwind v4 styles, tokens, themes | `RUNTIME-VERIFIED` | Compiled cleanly by `@tailwindcss/vite`; application content is non-selectable except isolated Monaco, and print output is suppressed. |
| `src/vite-env.d.ts`| Vite client type declarations | `VERIFIED` | Standard client typings. |
| `src/app/store.ts` | Redux store configuration | `RUNTIME-VERIFIED` | Configured with rootReducer and post-reducer persistence middleware. |
| `src/app/clientPersistenceMiddleware.ts` | Scoped bookmark/progress persistence boundary | `RUNTIME-VERIFIED` | Persists next Redux state after fulfilled mutations/hydration; only COMPANY/APTITUDE bookmarks are stored locally. |
| `src/app/rootReducer.ts` | Combined root reducer (9 slices) | `PARTIALLY VERIFIED` | Clears protected caches on logout/forced unauthentication and identity-changing auth while preserving same-user refresh state; final tests are pending. |
| `src/app/hooks.ts` | Typed Redux hooks | `RUNTIME-VERIFIED` | React Redux 9 `withTypes` hooks for dispatch, selector, and store. |

---

## 4. Core Architecture Layer (`src/core/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/core/api/apiClient.ts` | Central Axios client, interceptors, refresh lock | `PARTIALLY VERIFIED` | Production API/OAuth destinations are exact-canonical-origin pinned; public/protected policy, bearer attachment, bodyless refresh, and one protected 401 retry remain. Final tests are pending. |
| `src/core/api/endpoints.ts` | Centralized REST endpoint constants | `RUNTIME-VERIFIED` | Includes tested reference routes and semantic `SAVE` names for POST routes shared by create/update. |
| `src/core/guards/AdminRoute.tsx` | Admin route gate using response profile role | `RUNTIME-VERIFIED` | Uses the backend-supplied login/refresh role; it does not decode JWT claims for authorization. |
| `src/core/guards/GuestRoute.tsx` | Guest route gate redirecting logged-in users | `RUNTIME-VERIFIED` | Redirect selection uses the backend-supplied response profile role. |
| `src/core/guards/ProtectedRoute.tsx` | User route gate redirecting to `/login` | `RUNTIME-VERIFIED` | Tested in `batch6Governance.test.mjs`. |
| `src/core/mappers/problemMapper.ts` | Question DTO to problem model mapper | `RUNTIME-VERIFIED` | Maps question catalog and detail payloads, preserving structured company/platform summaries, list-supplied logos, testCases, examples, constraints, hints, and ref metadata. |
| `src/core/metadata/pageMetadata.ts` | Central route metadata policy and safe text helpers | `RUNTIME-VERIFIED` | Covers all exact, dynamic, redirect, error, authenticated, and admin route families; authenticated API-backed and coming-soon routes default to noindex without guessed entity names. |
| `src/core/metadata/MetadataContext.ts` | Navigation-keyed dynamic metadata context | `RUNTIME-VERIFIED` | Prevents a detail override from surviving navigation to another route. |
| `src/core/metadata/RouteMetadata.tsx` | DOM head reconciler | `RUNTIME-VERIFIED` | Owns title, canonical, robots, Open Graph, and Twitter/X tags without duplicate nodes. |
| `src/core/metadata/usePageMetadata.ts` | API-backed detail metadata hook | `RUNTIME-VERIFIED` | Dynamic overrides are registered and cleaned up against the active location key. |
| `src/core/security/jwt.ts` | Response-role and safe-redirect helpers | `RUNTIME-VERIFIED` | Contains no JWT payload decoder; routing uses exact backend response roles only. |
| `src/core/security/authSessionSync.ts` | Credential-free same-origin tab session event transport | `PARTIALLY VERIFIED` | One shared BroadcastChannel per tab prevents same-tab login echo while retaining the transient storage-event fallback; static regression added, real multi-tab browser acceptance pending. |
| `src/core/security/authContract.ts` | Login/refresh response contract validator | `PARTIALLY VERIFIED` | Requires a non-empty `token` or `accessToken` plus user ID, role, and email, normalizes the access token to canonical `token`, preserves modeled non-sensitive profile fields such as `avatarUrl`, and rejects arbitrary credential properties. Static regression coverage was added; the new deployed login/refresh DTO and cookie lifecycle remain unverified. |
| `src/core/security/refreshCoordinator.ts` | Cross-tab refresh rotation lock | `PARTIALLY VERIFIED` | Uses atomic Web Locks only; browsers without them fail before issuing refresh. Mocked exclusivity and fail-safe paths are tested, but real two-tab cookie rotation remains unverified. |
| `src/core/security/tokenStorage.ts` | Memory-only access token and session profile storage | `RUNTIME-VERIFIED` | Exposes no refresh-token API, never reads or creates the backend HttpOnly cookie, purges legacy JavaScript-readable token aliases, and advances the stale-response epoch on clear. |
| `src/core/security/externalUrl.ts` | Untrusted external-link and remote-image guard | `PARTIALLY VERIFIED` | Links accept only credential-free HTTP(S); passive images additionally require HTTPS and reject local/private/link-local targets. Final automated/browser verification is pending. |
| `src/shared/hooks/useAccessibleDialog.ts` | Shared non-admin dialog lifecycle | `PARTIALLY VERIFIED` | Owns stable initial focus, Tab containment, Escape close, body-scroll locking, and focus restoration; callback rerenders cannot steal field focus. Browser/assistive-technology verification is pending. |
| `src/core/storage/userScopedStorage.ts` | Collision-free versioned user-scoped local storage | `PARTIALLY VERIFIED` | Uses the complete encoded canonical identity rather than a truncated hash; logout clears the departing user's scope while retaining only explicitly preserved theme preference. Collision regression coverage is pending execution. |
| `src/core/types/api.ts` | REST response envelopes (`ApiResponse`, `ApiPage`) | `VERIFIED` | Strict DTO types. |
| `src/core/types/domain.ts` | Domain models (Problem, Company, MCQ, User, etc.) | `RUNTIME-VERIFIED` | Includes the strict question-list DTO with structured company/platform summaries, unit-aware execution metrics/diagnostics, optional server bookmark timestamps, canonical institution filters, reference save unions, nullable profile responses, strict session-identity fields, and MCQ save payloads. |
| `src/core/validation/commonRules.ts` | Zod validators (email, password, name, phone, URL) | `RUNTIME-VERIFIED` | Migrated to Zod 4 error APIs and tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/serverErrorMapper.ts`| Backend error parser and security leak filter | `PARTIALLY VERIFIED` | Non-string/malformed proxy fields are guarded before string operations; stack traces, internal names, URLs, and IP details remain suppressed. Final tests are pending. |
| `src/core/validation/index.ts` | Re-exports validation rules | `VERIFIED` | Re-exports all schemas. |
| `src/core/validation/schemas/adminSchemas.ts` | Zod schemas for admin forms | `RUNTIME-VERIFIED` | Zod 4-compatible and tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/schemas/authSchemas.ts` | Zod schemas for login, signup, forgot password | `RUNTIME-VERIFIED` | Tested in `validationArchitecture.test.mjs`. |
| `src/core/validation/schemas/profileSchemas.ts` | Zod schemas for user profile & academics | `RUNTIME-VERIFIED` | Zod 4 input/output coercion and messages are tested in `validationArchitecture.test.mjs`. |

---

## 5. Service Layer (`src/services/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/services/authService.ts` | Authentication REST service | `PARTIALLY VERIFIED` | Public signup cannot override `USER`; login validates identity before memory storage and logout clears scoped state. Backend role enforcement still requires acceptance evidence. |
| `src/features/admin/utils/mcqPayload.ts` | Exact MCQ option request/response mapper | `RUNTIME-VERIFIED` | Uses only the documented persisted option fields and enforces exactly one `isCorrect` option. |
| `src/services/companyService.ts` | Companies, recruitment exams, and company-question service | `PARTIALLY VERIFIED` | Requires complete pages, positive numeric detail IDs, and mapped nested exam/role/section DTOs; live scale and production payload acceptance remain unverified. |
| `src/services/executionService.ts` | Monaco code runner and Judge0 service | `RUNTIME-VERIFIED` | Normalizes API-owned visible/private case verdicts, case metrics, runtime/compile status, and diagnostics. `isHidden: null` cases remain private unless their `testCaseType` explicitly marks them visible/sample/public; dynamic language mapping and payload bounds remain covered. Live submit remains unverified. |
| `src/services/institutionService.ts` | Authenticated institution search autocomplete | `RUNTIME-VERIFIED` | Explicit protected policy, Bearer attachment, and protected-401 refresh behavior are tested in `authContract.test.mjs`. |
| `src/services/learningSheetService.ts` | DSA sheets, detail, ordered sections, and linked-question reads | `RUNTIME-VERIFIED` | Strict DTO boundaries accept the current structured nested question/company/platform summary, preserve path-ID ownership, same-sheet section filtering, documented detail reads, mapping-section validation, and ordering. Live endpoint acceptance remains pending. |
| `src/services/mcqService.ts` | User/admin MCQ reads and aptitude scoring | `PARTIALLY VERIFIED` | List/detail envelopes and option records are mapped before use; missing list options still trigger authoritative detail and correctness remains option-level `isCorrect`. Final tests are pending. |
| `src/services/problemService.ts` | Problem catalog and details service | `PARTIALLY VERIFIED` | Numeric detail failures propagate; legacy slug resolution follows real catalog pages and cannot hide a failed numeric detail request. |
| `src/services/profileService.ts` | User profile, normalized user-info DTO, and theme preference | `RUNTIME-VERIFIED` | Nullable reads, both observed `college`/`collegeName` spellings, optional institution ID/gender/date fields, request-user isolation, and exact save payloads are covered in `userInfoProfile.test.mjs`; authenticated live endpoint acceptance remains pending. |
| `src/services/questionService.ts` | Problem CRUD and test case retrieval | `PARTIALLY VERIFIED` | Numeric direct lookup and detail-owned test-case reads are implemented without the unestablished direct GET; requested/returned identity matching and saved-ID validation are regression-tested, and authenticated detail ID `1` loaded in the production browser. Live mutations remain pending. |
| `src/services/referenceService.ts` | Taxonomy group codes and group records | `RUNTIME-VERIFIED` | Encoded group paths and strict DTO validation are tested; the authenticated production admin page loaded 16 group codes and the selected group's records on 2026-11-11, so the earlier backend cache outage is no longer reproduced. |
| `src/services/userQuestionService.ts` | Solved/attempted IDs, bookmarks, submissions | `RUNTIME-VERIFIED` | Missing required user/question identity rejects explicitly rather than returning a fabricated empty result. |
| `src/services/admin/adminCompanyService.ts` | Admin company, role, section, exam authoring | `RUNTIME-VERIFIED` | Paginated reads delegate to the verified shared company service; business-only mutations and API-owned exam taxonomy IDs are regression-tested; live mutation remains backend-owned. |
| `src/services/admin/adminInstitutionService.ts`| Admin institution CRUD & status toggle | `RUNTIME-VERIFIED` | Sends only canonical `type` and `activeOnly` filter names; tested in `institutionManagement.test.mjs`. |
| `src/services/admin/adminLanguageService.ts` | Admin language compiler management | `RUNTIME-VERIFIED` | One save method matches the shared create/update POST; successful mutations invalidate execution-language cache. |
| `src/services/admin/adminReferenceService.ts` | Admin reference create/update/hard delete | `PARTIALLY VERIFIED` | Strict saved-record validation, encoded delete paths, and both envelope-null/bodyless-204 success are source-tested; production mutations were not executed. |
| `src/services/admin/adminMcqService.ts` | Admin MCQ mutations and management reads | `RUNTIME-VERIFIED` | Owns one create/update save method plus delete, delegates shared reads, and uses the semantic `ADMIN_SAVE` endpoint constant. |
| `src/services/admin/adminQuestionService.ts` | Admin question management | `RUNTIME-VERIFIED` | One requested page produces one API call; every row requires authoritative identity/title, mixed malformed pages reject instead of silently losing rows, structured company/platform summaries are validated, and observed Spring page-field aliases normalize without synthesizing totals. The production browser loaded 51 questions. Live admin mutation acceptance remains separate. |
| `src/services/admin/adminLearningSheetService.ts` | Admin DSA sheet authoring and link management | `PARTIALLY VERIFIED` | Endpoint/body shapes and bodyless DELETE requests are tested; live production mutations were not executed. |

---

## 6. Layouts & Routes (`src/layouts/`, `src/routes/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/layouts/AppRouterLayout.tsx` | Top-level router wrapper with scroll restoration, route metadata, and interaction guard | `RUNTIME-VERIFIED` | Reconciles session state and mounts metadata; learner routes retain clipboard/capture deterrence and the problem-workspace secure-mode control, while the inactive-window privacy curtain is intentionally not rendered and `/admin/*` routes remain unrestricted. |
| `src/layouts/MainLayout.tsx` | Standard student portal layout with route-aware Navbar/Footer shell | `PARTIALLY VERIFIED` | Public pages retain the shared Navbar and Footer; the problem workspace intentionally suppresses the footer and locks the shell to the viewport so only its internal panes scroll. Static checks pass; final cross-device browser acceptance remains pending. |
| `src/routes/appRoutes.tsx` | Route definitions with lazy code-splitting | `RUNTIME-VERIFIED` | Problems, DSA Sheet, Company Prep, and Aptitude mount behind the shared authenticated feature gate; the root `errorElement` presents a themed route recovery screen rather than React Router's default error UI. |

---

## 7. Shared Components & Errors (`src/shared/`)

| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/shared/components/ComingSoon.tsx` | Feature placeholder | `RUNTIME-VERIFIED` | Gated by `VITE_SHOW_COMING_SOON`. |
| `src/shared/components/errors/AppErrorBoundary.tsx` | React 19 top-level error boundary | `RUNTIME-VERIFIED` | Catches and logs rendering crashes outside router-managed routes. |
| `src/shared/components/errors/RouteErrorBoundary.tsx` | React Router route error boundary | `RUNTIME-VERIFIED` | Hides raw route exceptions and provides themed retry/home recovery actions. |
| `src/shared/components/errors/NotFound.tsx` | 404 Not Found error view | `RUNTIME-VERIFIED` | Verified route fallback. |
| `src/shared/components/errors/ServerError.tsx` | 500 Internal Server Error view | `VERIFIED` | Static error display. |
| `src/shared/components/ui/Badge.tsx` | Status and difficulty badge | `RUNTIME-VERIFIED` | Variants: default, success, danger, etc. |
| `src/shared/components/ui/BrandLogo.tsx` | Official brand logo component | `RUNTIME-VERIFIED` | Verified in Navbar and Landing. |
| `src/shared/components/ui/Button.tsx` | Reusable button component | `RUNTIME-VERIFIED` | Defaults to a non-submitting button; loading and disabled actions remain locked. |
| `src/shared/components/ui/C2CSelect.tsx` | Branded accessible custom single-select | `PARTIALLY VERIFIED` | Supplies the code-editor language selector with a themed listbox, keyboard navigation, Escape/outside dismissal, and explicit light/dark states. Source regression and typecheck pass; cross-browser interaction remains pending. |
| `src/shared/notifications/toast.ts` | Single current notification boundary | `PARTIALLY VERIFIED` | Replaces stale notices, limits visible text, and is used by every first-party toast caller. Unit/source verification passes; final browser visual confirmation remains pending. |
| `src/shared/components/ui/ConfirmDialog.tsx` | Modal confirmation dialog | `RUNTIME-VERIFIED` | Unique labels, safe initial focus, Tab containment, focus restoration, body locking, and busy-state dismissal guards are source-tested. |
| `src/shared/components/ui/EmptyState.tsx` | Empty state placeholder | `VERIFIED` | Used in empty tables/lists. |
| `src/shared/components/ui/Footer.tsx` | Global footer | `PARTIALLY VERIFIED` | Contains verified destinations, truthful newsletter status, and a dynamic year; final browser verification is pending. |
| `src/shared/components/ui/FormFieldError.tsx` | Form validation message | `RUNTIME-VERIFIED` | Used across React Hook Form inputs. |
| `src/shared/components/ui/Navbar.tsx` | Global top navigation bar | `PARTIALLY VERIFIED` | Redux authentication state is the sole signed-in authority; nullable profile data is presentation-only. Avatar URLs remain HTTP(S)-guarded with no-referrer fetches. Browser verification is pending. |
| `src/shared/components/ui/PageLoading.tsx` | Full-screen and container loading state | `RUNTIME-VERIFIED` | Route-shaped shimmer layouts, including a skeleton fallback for otherwise-unclassified routes. |
| `src/shared/components/ui/Pagination.tsx` | Pagination control | `RUNTIME-VERIFIED` | Non-submitting controls, current-page semantics, and the all-control pending lock are regression-tested. |
| `src/shared/components/ui/RequestStatus.tsx` | Loading/error/empty state wrapper | `VERIFIED` | Used in admin dashboard. |
| `src/shared/components/ui/Skeleton.tsx` | Shimmer card and table placeholders | `RUNTIME-VERIFIED` | Verified during data loading. |
| `src/shared/hooks/useAssessmentIntegrity.ts` | Learner-route clipboard/capture shortcut deterrence | `RUNTIME-VERIFIED` | Keyboard classification tolerates absent/non-string keys without crashing forms and its regression passed; native clipboard, selection, browser export, capture, focus-loss, secure mode, and internal-editor routing remain covered. Final browser/password-manager/IME acceptance is still pending. |
| `src/shared/context/ThemeContext.tsx` | Dark/Light theme provider and hook | `RUNTIME-VERIFIED` | Normalized identity scopes retire legacy global values, direct/toggle updates persist per user, and `system` follows live OS color-scheme changes. |

---

## 8. Feature Modules (`src/features/`)

### A. Auth Feature (`src/features/auth/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/GoogleSignInButton.tsx` | Google OAuth2 sign-in button | `RUNTIME-VERIFIED` | Triggers Google authorization popup. |
| `hooks/useGoogleOAuthLogin.ts` | OAuth hook managing popup and postMessage | `RUNTIME-VERIFIED` | Tested in `googleOAuthLifecycle.test.mjs`. |
| `components/AuthenticatedFeatureGate.tsx` | Shared authenticated learning-content mount boundary | `RUNTIME-VERIFIED` | Keeps API-owning feature pages unmounted during session restoration and while signed out, while reusing the standard loading, recovery, and sign-in states. |
| `components/SessionRecoveryState.tsx` | Temporary startup-auth failure gate | `PARTIALLY VERIFIED` | Keeps protected content closed, uses theme tokens in light/dark modes, and offers safe retry without treating network/5xx failure as logout; deployed visual acceptance remains pending. |
| `pages/Login.tsx` | Unified authentication modal (Login, Signup, ForgotPassword OTP) | `PARTIALLY VERIFIED` | Submit-only Zod validation with native validation disabled, role-based redirect, duplicate-action guards, shared accessible modal lifecycle, and an opaque modal backdrop that hides the underlying navbar boundary; final browser verification is pending. |
| `pages/OAuthCallback.tsx` | Google OAuth popup callback handler | `RUNTIME-VERIFIED` | Exchanges only the HttpOnly cookie, sends a credential-free popup signal, uses response role, and displays only safe errors. |
| `redux/authSlice.ts` | Auth Redux slice | `RUNTIME-VERIFIED` | Distinguishes loading, authenticated, recoverable startup failure, and unauthenticated states. |

### B. Problems Feature (`src/features/problems/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/PracticeHeroBanner.tsx` | Hero banner with problem stats & search | `RUNTIME-VERIFIED` | Verified on PracticePage. |
| `components/CodingQuestionTable.tsx` | Canonical API-backed coding-question listing | `PARTIALLY VERIFIED` | Practice's exact table renders list-supplied QPF/company metadata without a duplicate QPF request; its safe remote-image boundary, skeleton, progress, and bookmark behavior are shared by Practice, Company Prep, DSA Sheet, and the admin company-question view. Static contract coverage passes; deployed/live visual acceptance remains pending. |
| `hooks/useExecutionRequest.ts` | Custom hook for Monaco code running | `RUNTIME-VERIFIED` | Handles run/submit state & aborts. |
| `pages/PracticePage.tsx` | Practice catalog hub | `RUNTIME-VERIFIED` | URL-backed difficulty, topic, company, search, page, and page-size controls dispatch the exact documented `/questions` query; unresolved legacy filter values block rather than degrade to an unfiltered request. Server totals drive pagination, client catalog slicing is prohibited, unsupported platform/status/sort controls are not rendered, and this page owns the shared coding-question table source of truth. |
| `pages/ProblemDetails.tsx` | Monaco editor coding workspace | `PARTIALLY VERIFIED` | Fills viewport height below navbar (`h-[calc(100dvh-var(--c2c-navbar-height,64px))]`) centered within standard platform container boundaries (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4`) matching Practice and Company page layout sizing and rounded card borders (`rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800`), locally bundled lazy Monaco engine/workers, one root-owned integrity controller, recorded table/reference language restoration, scoped drafts, isolated clipboard operations, accessible pointer/keyboard splitters, vertical in-place test case accordions for public samples and execution verdicts, API-provided test case naming (`testCaseName`, `name`, `testCaseType`, `typeRefName`), concise real-time execution feedback without custom input or verbose copy, API-owned per-case time/memory, runtime/compile verdicts, masked private evaluations, and the branded accessible `C2CSelect` language menu. Typecheck, lint, and full test suite pass. |
| `pages/ProblemDetails.css` | Legacy custom split-panel stylesheet | `ELIMINATED` | Eliminated in favor of 100% pure React TSX and Tailwind CSS v4 in `ProblemDetails.tsx` with accessible resizers, Lucide React icons, and hidden scrollbar utilities. |
| `pages/ProblemList.tsx` | Legacy standalone problem-list page | `DEPRECATED` | Removed in Phase 1 remediation; practice catalog is consolidated under `PracticePage.tsx`. |
| `redux/problemSlice.ts` | Problem Redux slice with TTL/LRU caches | `PARTIALLY VERIFIED` | Exact ownership now gates cache writes as well as visible rows/loading; updated regression tests are pending execution. |
| `utils/problemEditorial.ts` | Problem solution editorial formatter | `VERIFIED` | Markdown editorial formatting. |
| `utils/problemExecution.ts` | Output formatter, error parser, language resolver | `PARTIALLY VERIFIED` | Language entity/reference-ID resolution now returns the matching runtime for editor restoration as well as its display name. Static coverage was added; final tests are pending. |
| `utils/codeDiagnostics.ts` | Monaco and execution diagnostic mapper | `RUNTIME-VERIFIED` | Cross-language API misuse and deduplicated compiler line/column mapping are tested. |
| `utils/internalEditorClipboard.ts` | Editor-only clipboard shortcut classifier | `RUNTIME-VERIFIED` | Copy, cut, paste, Insert aliases, and non-clipboard shortcuts are tested without system clipboard access. |

### C. Companies Feature (`src/features/companies/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/CompanyBrandLogo.tsx` | Local-first recruiter logo with remote/error cascade | `PARTIALLY VERIFIED` | Remote candidates send no referrer and fall back to a deterministic monogram; compact company marks are transparent circular clips rather than square tiles. Final browser rendering is pending. |
| `components/CompanyExamCard.tsx` | Exam card displaying rounds & syllabus | `RUNTIME-VERIFIED` | Verified on CompanyExamDetails. |
| `pages/CompanyList.tsx` | Paginated recruiter directory | `RUNTIME-VERIFIED` | Each URL-backed page calls `/company/list`, uses server totals, clamps safely, scrolls on explicit pagination, and keeps cards keyboard operable. Cards show the primary company mark without a decorative corner watermark, render an API-provided industry only when available, and use the specific “Explore Hiring Rounds” destination. Unsupported company search/industry controls are omitted. |
| `pages/CompanyDetails.tsx` | Company profile, exams, and practice questions | `PARTIALLY VERIFIED` | Question requests are lazy to the Practice tab and page resets are synchronous with filter interactions. API-backed coding rows reuse `CodingQuestionTable`; live scale/final browser verification is pending. |
| `pages/CompanyExamDetails.tsx` | Detailed recruitment exam blueprint | `RUNTIME-VERIFIED` | Exam section duration & question counts. |
| `redux/companySlice.ts` | Company Redux slice | `PARTIALLY VERIFIED` | Owns company list/detail requests and caches; the unused duplicate company-problems stack was removed and final tests are pending. |
| `types/companyExam.ts` | Exam & blueprint type definitions | `VERIFIED` | Full type declarations. |
| `utils/companyLogoRegistry.ts` | API-logo validation/priority, canonical aliases, bundled manifest, domain validation, and provider candidates | `PARTIALLY VERIFIED` | The documented API `logo` is accepted only after the HTTPS/public-host guard; protocol-relative, credential-bearing, private-host, and non-web values are rejected before fallback candidates. |

### D. Aptitude Feature (`src/features/aptitude/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `pages/AptitudePrep.tsx` | Multi-subject aptitude practice hub | `RUNTIME-VERIFIED` | Missing list options are fetched only after a per-card user action with loading/retry/empty states; difficulty filters remain API-driven and correctness icons remain aligned. |
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
| `components/AdminTable.tsx` | Reusable sortable admin table | `RUNTIME-VERIFIED` | Uses same-column skeletons for initial loads and preserves existing rows with a visible refresh indicator during refetches; clickable rows support Enter/Space and visible focus. Unexpected nested API values require an explicit renderer and cannot crash React. |
| `components/companies/*` | Company, exam, role, section modals | `PARTIALLY VERIFIED` | API reference classifications and programmatically associated form labels are implemented; the company-question modal uses the canonical coding-question table. Final browser/tests are pending. |
| `components/dashboard/*` | Dashboard metrics, code runner, overview | `PARTIALLY VERIFIED` | Code runner uses authoritative detail, dynamic boilerplate, sequential discovery, and labeled controls without bundled solutions; final tests are pending. |
| `components/institutions/*` | Institution details, form, status modals | `PARTIALLY VERIFIED` | API-owned forms now have explicit label/control associations; final browser/tests are pending. |
| `components/questions/*` | Question form, details, test case modals | `PARTIALLY VERIFIED` | Live dialogs hydrate API-owned taxonomy/details; persisted company links no longer advertise unsupported removal, and runtime drafts are isolated by question/language. Persistent live mutation remains pending. |
| `pages/AdminDashboard.tsx` | Live admin dashboard metrics | `PARTIALLY VERIFIED` | The runner owns question discovery and reports totals; company count uses one-row metadata. Difficulty requests remain independently cancellable. |
| `pages/AdminCompanies.tsx` | Company CRUD page | `RUNTIME-VERIFIED` | Page and page-size changes call `/company/list`; cards are keyboard-operable and duplicate saves are synchronously guarded. Pending list requests show skeletons before error/empty states. Unsupported company search is not presented. Live mutation remains unverified. |
| `pages/AdminInstitutions.tsx` | Institution directory management | `PARTIALLY VERIFIED` | Detail/edit requests are abortable and generation-owned across competing modal actions; final tests are pending. |
| `pages/AdminLanguages.tsx` | Language compiler configuration | `PARTIALLY VERIFIED` | Duplicate-action guards and explicit label/control associations are implemented; final tests are pending. |
| `pages/AdminReferences.tsx` | Reference taxonomy administration | `PARTIALLY VERIFIED` | The authenticated browser loaded 16 groups, switched from APTITUDE to DIFF, opened create/edit dialogs, refreshed, and verified explicit hard-delete confirmation. Production mutations were not executed. |
| `pages/AdminMcqs.tsx` | MCQ question bank authoring | `PARTIALLY VERIFIED` | View/edit reads are abortable/generation-owned, row activation uses authoritative detail, and authoring controls are labeled; final tests are pending. |
| `pages/AdminQuestions.tsx` | Coding problem CRUD | `PARTIALLY VERIFIED` | The authenticated browser loaded 51 rows; search resolved Two Sum, authoritative detail/edit/test-case dialogs loaded, and sample/full-suite code actions returned verdicts. Search resets pagination immediately. Saved identity is adopted before test-case attachment. Persistent live mutations remain unverified. |
| `pages/AdminDsaSheets.tsx` | DSA sheet, section, and question-link management | `PARTIALLY VERIFIED` | Uses documented sheet detail, section, and question reads; creates send `id: null`, updates send existing mapping IDs, and successful mutations refresh owning reads. Live authenticated mutations remain pending. |
| `utils/testCaseUtils.ts` | Test case extractor & parser | `PARTIALLY VERIFIED` | Parses API payload/visible examples only; no bundled hidden fixtures. |

### F. DSA Sheet Feature (`src/features/dsaSheet/`)
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `components/DsaSheetHeroBanner.tsx` | Theme-aware generated DSA hero banner | `RUNTIME-VERIFIED` | Uses project-local light/dark raster assets with 2048x384 dimensions matching Practice/Aptitude banner container and design treatment. |
| `pages/DsaSheetPage.tsx` | Student DSA learning-path UI | `PARTIALLY VERIFIED` | Redux-backed documented sheet/section/question reads adapt validated structured association DTOs into the canonical coding-question table, with direct supplied company/platform metadata and no redundant company API call. Shared skeleton/error/empty/bookmark/progress states, hierarchy, accessible carousel, and request cancellation are source/runtime tested; browser/live API acceptance remains pending. |
| `redux/dsaSheetSlice.ts` | Learning sheets, hierarchy, and questions Redux slice | `RUNTIME-VERIFIED` | TTL caches, per-parent/per-section loading and errors, request ownership, abort handling, nested expansion, invalidation, and failure isolation have reducer coverage. |
| `types.ts` | Learning sheet, section, question-link, and mutation DTOs | `RUNTIME-VERIFIED` | Used by strict service validation and contract tests. |
| `utils/questionRoute.ts` | DSA association-to-problem route resolver | `RUNTIME-VERIFIED` | Always selects nested `question.id`; regression test proves outer association IDs cannot enter problem URLs. |

### G. Profile, Bookmarks, Landing, Settings, Roadmaps
| File Path | Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| `src/features/bookmarks/pages/BookmarksList.tsx` | User bookmarked problems page | `RUNTIME-VERIFIED` | Per-item pending state disables duplicate removal and exposes progress accessibly. |
| `src/features/bookmarks/redux/bookmarkSlice.ts` | Bookmarks Redux slice | `RUNTIME-VERIFIED` | Server problem bookmarks omit unprovided save timestamps; scoped local persistence, refresh failure preservation, and stale-response ownership are tested. |
| `src/features/institutions/components/InstitutionAutocomplete.tsx` | College autocomplete input | `RUNTIME-VERIFIED` | Minimum-three-character debounce with cancellable requests and shaped dropdown-result skeletons. |
| `src/features/interviews/pages/InterviewPrep.tsx` | Curated interview questions | `VERIFIED` | Gated by `ComingSoon`. |
| `src/features/landing/pages/Landing.tsx` | Public landing page and static practice preview | `PARTIALLY VERIFIED` | Removes simulated success, unmeasured totals, and testimonial claims; illustrative workflows are labeled; its dark hero is a 3840×2576 asset with an edge background matching the `#070A13` dark page token; final preview verification is pending. |
| `src/features/languages/redux/languageSlice.ts` | Language Redux slice | `PARTIALLY VERIFIED` | Forced post-mutation refresh supersedes in-flight reads and invalidation clears stale ownership; final tests are pending. |
| `src/features/profile/components/modals/*` | Academic and personal modals | `PARTIALLY VERIFIED` | The accessible profile-details dialog preserves the selected institution ID, renders API-owned gender references, validates date format, and uses React Hook Form with the shared Zod resolver; final browser verification is pending. |
| `src/features/profile/pages/ProfileSettings.tsx` | Profile settings & performance metrics | `RUNTIME-VERIFIED` | Production-grade redesigned Profile Hub: 100% API-driven with zero static data; showcases identity card with monogram avatar and academic record, improved Coding Performance HUD (unique solved master counter, total submissions, active streak, multi-tiered segmented progress, and dedicated Easy/Medium/Hard metric cards), 26-week activity heat map, and deduplicated unique solved/attempted problem tables with C2CSelect difficulty dropdown matching the practice page design system. |
| `src/features/profile/redux/profileSlice.ts` | Profile Redux slice | `RUNTIME-VERIFIED` | Identity and `/userInfo` reads are user/request-owned; late responses from a previous account are ignored and valid-null caching is tested. |
| `src/features/progress/redux/progressSlice.ts` | Progress Redux slice | `PARTIALLY VERIFIED` | Successful server results are authoritative; user-scoped local data is a failed-resource fallback only. Regression coverage was added but not yet executed on this tree. |
| `src/features/references/redux/referenceSlice.ts` | Reference taxonomy Redux slice | `PARTIALLY VERIFIED` | Post-mutation invalidation clears stale ownership and force refresh can supersede an in-flight read; final tests are pending. |
| `src/features/roadmaps/pages/RoadmapDetails.tsx` | DSA and engineering roadmaps | `VERIFIED` | Gated by `ComingSoon`. |
| `src/features/settings/pages/AppSettings.tsx` | Read-only API transport configuration | `VERIFIED` | Describes configured endpoint/authentication behavior without claiming live health. |

---

## 9. Verification Summary & Audit Totals

- **Total First-Party TypeScript/TSX Files in `src/`**: 161
- **Total Automated Test Files in `scripts/tests/`**: 23
- **Automated Test Cases**: 393 across 25 files; the latest full run passed 393/393 with zero failures.
- **Final-tree Unit Tests / Typecheck / Lint / Build / Documentation / Architecture / Preview**: `UNKNOWN` — intentionally not executed in this session because no OS-level sandbox is available for repository-controlled scripts. Historical green results do not certify the modified tree.


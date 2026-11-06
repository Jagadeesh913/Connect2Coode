# 03. Routing, User Roles & End-to-End Journeys

## 1. Route Map & Route Architecture

All routing is defined in [`src/routes/appRoutes.tsx`](../../src/routes/appRoutes.tsx) using React Router v7 `createBrowserRouter`.

```mermaid
graph TD
    Root["/"] --> Landing["Landing Page"]
    Root --> OAuth["/oauth/callback (Google OAuth)"]
    
    subgraph GuestBranch [Guest Only (GuestRoute)]
        AuthL["/login, /signup, /forgot-password"]
    end
    
    subgraph PublicPracticeBranch [Stable URLs, Authenticated Content (MainLayout)]
        Practice["/practice, /dsa-sheet, /problems/:slug"]
        Companies["/companies, /companies/:slug, /companies/exams/:examId"]
        Aptitude["/aptitude, /roadmaps/:slug, /interviews"]
    end
    
    subgraph ProtectedBranch [Authenticated User Only (ProtectedRoute)]
        UserSpace["/profile, /bookmarks, /settings"]
    end
    
    subgraph AdminBranch [Administrator Only (AdminRoute)]
        AdminSpace["/admin/dashboard, /admin/questions, /admin/mcqs, /admin/companies, /admin/languages, /admin/institutions, /admin/references"]
    end

    Root --> GuestBranch
    Root --> PublicPracticeBranch
    Root --> ProtectedBranch
    Root --> AdminBranch
```

### Complete Route Inventory

| Route Path | Component / Target | Access Level | Layout Wrapper | Guard / Condition |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Landing` | Public | None | None |
| `/oauth/callback` | `OAuthCallback` | Public | None | Processes Google OAuth tokens |
| `/login` | `Login` | Guest Only | `AuthLayout` | `GuestRoute` (redirects to `/practice` if authed) |
| `/signup` | `Signup` | Guest Only | `AuthLayout` | `GuestRoute` |
| `/forgot-password` | `ForgotPassword` | Guest Only | `AuthLayout` | `GuestRoute` |
| `/practice` | `PracticePage` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate`; signed-out users see the shared sign-in state |
| `/dsa-sheet` | `DsaSheetPage` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate`; signed-out users see the shared sign-in state |
| `/problems/:slug` | `ProblemDetails` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate`; Monaco workspace is not mounted while signed out |
| `/problems` | Redirect -> `/practice` | Public | N/A | Instant Navigate replace |
| `/companies` | `CompanyList` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate` |
| `/companies/:slug` | `CompanyDetails` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate`; company content is not mounted while signed out |
| `/companies/:companyId/exams/:examId` | `CompanyExamDetails` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate` |
| `/companies/exams/:examId` | `CompanyExamDetails` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate` |
| `/company-patterns` | Redirect -> `/companies` | Public | N/A | Instant Navigate replace |
| `/aptitude` | `AptitudePrep` | Authenticated Content | `MainLayout` | `AuthenticatedFeatureGate`; signed-out users see the shared sign-in state |
| `/logical` | Redirect -> `/aptitude?category=reasoning` | Public | N/A | Query string redirect |
| `/verbal` | Redirect -> `/aptitude?category=verbal` | Public | N/A | Query string redirect |
| `/pseudocode` | Redirect -> `/aptitude?category=pseudocode` | Public | N/A | Query string redirect |
| `/progress` | Redirect -> `/aptitude` | Public | N/A | Redirect |
| `/roadmaps` | Redirect -> `/aptitude` | Public | N/A | Redirect |
| `/roadmaps/:slug` | `RoadmapDetails` or `ComingSoon` | Public | `MainLayout` | Controlled by `VITE_SHOW_COMING_SOON` |
| `/interviews` | `InterviewPrep` or `ComingSoon` | Public | `MainLayout` | Controlled by `VITE_SHOW_COMING_SOON` |
| `/profile` | `ProfileSettings` | Authenticated User | `MainLayout` | `ProtectedRoute` |
| `/bookmarks` | `BookmarksList` | Authenticated User | `MainLayout` | `ProtectedRoute` |
| `/settings` | `AppSettings` | Authenticated User | `MainLayout` | `ProtectedRoute` |
| `/dashboard` | Redirect -> `/practice` | Authenticated User | N/A | Redirect |
| `/admin` | Redirect -> `/admin/dashboard` | Administrator | N/A | `AdminRoute` |
| `/admin/dashboard` | `AdminDashboard` | Administrator | `AdminLayout` | `AdminRoute` |
| `/admin/questions` | `AdminQuestions` | Administrator | `AdminLayout` | `AdminRoute` |
| `/admin/mcqs` | `AdminMcqs` | Administrator | `AdminLayout` | `AdminRoute` |
| `/admin/companies` | `AdminCompanies` | Administrator | `AdminLayout` | `AdminRoute` |
| `/admin/languages` | `AdminLanguages` | Administrator | `AdminLayout` | `AdminRoute` |
| `/admin/institutions`| `AdminInstitutions`| Administrator | `AdminLayout` | `AdminRoute` |
| `/admin/dsa-sheets` | `AdminDsaSheets` | Administrator | `AdminLayout` | `AdminRoute` |
| `/admin/references` | `AdminReferences` | Administrator | `AdminLayout` | `AdminRoute` |
| `/500` | `ServerError` | Public | None | Server error fallback |
| `*` | `NotFound` | Public | None | 404 catch-all |

---

### Route Metadata and Indexing Policy

Every route resolves a title, description, canonical path, robots directive, Open Graph set, and Twitter/X card set through [`src/core/metadata/pageMetadata.ts`](../../src/core/metadata/pageMetadata.ts). Titles use `Page Name | Connect2Code`. The stable public hubs (`/`, `/practice`, `/dsa-sheet`, `/companies`, and `/aptitude`) are indexable. Login/signup/reset pages are `noindex, follow`; OAuth, authenticated, admin, error, unknown, coming-soon, and authenticated API-backed detail routes are `noindex, nofollow`. Redirect aliases canonicalize and permanently redirect at the edge to their destination (`/problems` to `/practice`, `/company-patterns` to `/companies`, and aptitude aliases to `/aptitude`). Dynamic problem, company, and exam titles are applied in the browser only after the current route's API response succeeds; the route remains non-indexable because those API contracts require authentication.

The metadata owner is mounted above all route branches in `AppRouterLayout`, so client navigation, back/forward navigation, deep-link hydration, guard redirects, errors, and unknown routes cannot retain tags from the previous page. The production build also runs [`scripts/generate-seo-assets.mjs`](../../scripts/generate-seo-assets.mjs), producing route-specific metadata and no-JavaScript fallback content for each indexable hub without User-Agent detection. That fallback lives in `<noscript>` beside an empty React root, so JavaScript browsers do not briefly render crawler text before React mounts. Vercel serves a separate noindex app shell for authenticated/dynamic routes, sends matching `X-Robots-Tag` headers, and serves the generated `404.html` with a genuine 404 for paths outside the explicit route allowlist.

---

## 2. User Roles & Authorization Guards

The application distinguishes between two primary user roles:
1. **Regular Student User (`USER`)**: Access to public hubs, coding practice, personal profile, bookmarks, and solved progress tracking.
2. **Platform Administrator (`ADMIN`)**: Access to all student hubs plus the role-gated `/admin/*` management suite.

### Guard Implementation Matrix

| Guard Component | Location | Logic & Gating Rules | Failure Redirect |
| :--- | :--- | :--- | :--- |
| **`ProtectedRoute`** | [`src/core/guards/ProtectedRoute.tsx`](../../src/core/guards/ProtectedRoute.tsx) | Waits for startup restoration, then trusts validated Redux authentication state. Saves the attempted destination in `sessionStorage.getItem('post_auth_redirect')`. JWT contents are never decoded. | Redirects to `/login` only after confirmed unauthentication |
| **`AuthenticatedFeatureGate`** | [`src/features/auth/components/AuthenticatedFeatureGate.tsx`](../../src/features/auth/components/AuthenticatedFeatureGate.tsx) | Waits for startup restoration and keeps the API-owning learning page unmounted until authentication succeeds. Signed-out visitors receive the shared `EmptyState` sign-in UI; temporary failures receive `SessionRecoveryState`. | Inline sign-in prompt; no redirect and no feature API effects while signed out |
| **`GuestRoute`** | [`src/core/guards/GuestRoute.tsx`](../../src/core/guards/GuestRoute.tsx) | Waits for startup refresh, then uses the backend response `role` to select `/admin/dashboard` or `/practice`. JWT claims are not decoded for routing. | Redirects to `/practice` or `/admin/dashboard` |
| **`AdminRoute`** | [`src/core/guards/AdminRoute.tsx`](../../src/core/guards/AdminRoute.tsx) | Requires authenticated Redux state and an exact `ADMIN`/`ROLE_ADMIN` value supplied by the latest login/refresh response. Backend authorization remains authoritative. | Non-admin users -> `/practice`<br>Unauthenticated -> `/login` |

All guard types keep protected/guest decisions closed during `LOADING`. A temporary startup refresh failure enters `RECOVERY_REQUIRED` and renders a safe retry screen; it does not redirect to login, infer that the cookie is invalid, or reveal protected route content. Refresh HTTP 401 alone transitions to `UNAUTHENTICATED`. The cookie-backed `/auth/refresh` remains the required startup session check; the feature gate prevents catalog, reference, company, sheet, aptitude, and problem-detail requests until a session is authenticated.

---

## 3. End-to-End User Journeys

### Journey 1: Student Registration, Profile Completion & AISHE Selection
1. **Landing & Signup**: User arrives at `/` or clicks "Sign Up" navigating to `/signup`.
2. **Form Validation**: Form enforces standard email rules (RFC 5322), minimum 6-character password with match confirmation, and international name support.
3. **Account Creation**: Calls `POST /api/v1/signUp`. On success, automatically proceeds to login or directs user to sign in.
4. **Academic Setup**: User navigates to `/profile` (protected by `ProtectedRoute`).
5. **College Search**: User types college name in `InstitutionAutocomplete`. After 3 characters, it calls `GET /api/v1/institutions/search?query=...` and displays matched institutions with AISHE codes.
6. **Save Profile**: User saves academic details (passing year, graduation year, registration number). Dispatches `POST /api/v1/userInfo/{userId}` with bearer authentication and business fields only.

### Journey 2: DSA Problem Solving & Live Code Compilation
1. **Catalog Navigation**: An authenticated student navigates to `/practice` for the general catalog or `/dsa-sheet` for an ordered learning path. A signed-out visitor sees the shared sign-in state without mounting either API-owning page.
2. **Sheet Navigation**: The DSA page fetches active sheets, top-level sections ordered by `displayOrder`, and loads linked questions when a section is opened.
3. **Filtering**: On `/practice`, the student selects topics, difficulty, and company. On `/dsa-sheet`, search is applied to the loaded question metadata without inventing unreturned questions.
4. **Problem Details**: User clicks a linked problem, navigating to `/problems/{questionId}`.
5. **Catalog Fallback**: The client issues `POST /api/v1/questions` to locate problem metadata when the direct details route is degraded.
6. **Monaco Editor**: Student edits Java code. Editor auto-loads boilerplate with `public class Main`.
7. **Sample Run**: User clicks "Run Code". Client prepares execution payload:
   - Resolves Java Table ID (1) to backend Reference ID (5).
   - Verifies class name is `public class Main`.
   - Sends `POST /api/v1/runCode`.
   - Displays test case results (Passed / Failed, execution time, stdout) in terminal tabs.
8. **Submission**: User clicks "Submit". Dispatches `POST /api/v1/submitCode`. On success, progress slice updates solved status and marks problem solved in `userScopedStorage`.

### Journey 3: Company Recruitment Exam Preparation
1. **Directory Browse**: An authenticated user visits `/companies`. A signed-out visitor sees the shared sign-in state without starting company catalog requests. After authentication, `CompanyBrandLogo` resolves the 121 bundled recruiter assets first, then uses the documented dynamic provider cascade for companies outside the local registry.
2. **Company Blueprint**: User selects TCS (`/companies/tcs`). Page queries `GET /api/v1/company/1` and `POST /api/v1/company/1/exams/list`.
3. **Exam Selection**: User clicks "TCS NQT 2026" (`/companies/1/exams/10`).
4. **Section Breakdown**: Displays exam rounds, durations, marks, and associated technical interview/coding questions.

### Journey 4: Aptitude & MCQ Assessment
1. **Practice Hub**: User visits `/aptitude`. Selects Quantitative Aptitude, Logical Reasoning, Verbal, or Pseudocode.
2. **Question Fetch**: Client calls `POST /api/v1/mcq` with subject group and difficulty codes.
3. **Option Selection**: User interacts with radio options (A, B, C, D). `synthesizeMcqOptions` in `mcqUtils.ts` accurately maps option-level `isCorrect` flags.
4. **Instant Feedback**: User checks explanation or submits mock test to calculate percentile and review incorrect choices.

### Journey 5: Administrator Resource Authoring
1. **Admin Authentication**: Admin logs in at `/login`. `AdminRoute` verifies the backend response role and renders `AdminLayout`; it never derives the role from decoded JWT claims.
2. **Question CRUD**: At `/admin/questions`, admin clicks "Add Question". Enters problem title, description, constraints, and test cases (input, expected output, hidden flag). Dispatches `POST /api/v1/question` and `POST /api/v1/question/{id}/testCases`.
3. **MCQ CRUD**: At `/admin/mcqs`, admin creates MCQ. Marks correct option explicitly. Dispatches `POST /api/v1/admin/mcq`.
4. **Institution Governance**: At `/admin/institutions`, admin reviews colleges, edits AISHE codes, and toggles active status via `PATCH /api/v1/admin/institutions/{id}/status`.
5. **DSA Sheet Authoring**: At `/admin/dsa-sheets`, admin creates or edits sheets, top-level sections, and linked-question ordering/status. Existing resource IDs are sent only in edit mode through the learning-sheet save POSTs; successful mutations invalidate the student DSA cache.

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
    
    subgraph PublicPracticeBranch [Public & Student (MainLayout)]
        Practice["/practice, /dsa-sheet, /problems/:slug"]
        Companies["/companies, /companies/:slug, /companies/exams/:examId"]
        Aptitude["/aptitude, /roadmaps/:slug, /interviews"]
    end
    
    subgraph ProtectedBranch [Authenticated User Only (ProtectedRoute)]
        UserSpace["/profile, /bookmarks, /settings"]
    end
    
    subgraph AdminBranch [Administrator Only (AdminRoute)]
        AdminSpace["/admin/dashboard, /admin/questions, /admin/mcqs, /admin/companies, /admin/languages, /admin/institutions"]
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
| `/practice` | `PracticePage` | Public (with tracking) | `MainLayout` | None |
| `/dsa-sheet` | `DsaSheetPage` | Public (API auth is attached when available) | `MainLayout` | None |
| `/problems/:slug` | `ProblemDetails` | Public (with tracking) | `MainLayout` | Monaco editor coding workspace |
| `/problems` | Redirect -> `/practice` | Public | N/A | Instant Navigate replace |
| `/companies` | `CompanyList` | Public | `MainLayout` | None |
| `/companies/:slug` | `CompanyDetails` | Public | `MainLayout` | Company syllabus & questions |
| `/companies/:companyId/exams/:examId` | `CompanyExamDetails` | Public | `MainLayout` | Detailed exam blueprint |
| `/companies/exams/:examId` | `CompanyExamDetails` | Public | `MainLayout` | Direct exam blueprint route |
| `/company-patterns` | Redirect -> `/companies` | Public | N/A | Instant Navigate replace |
| `/aptitude` | `AptitudePrep` | Public | `MainLayout` | Quantitative, Reasoning, Verbal, Pseudocode |
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
| `/500` | `ServerError` | Public | None | Server error fallback |
| `*` | `NotFound` | Public | None | 404 catch-all |

---

## 2. User Roles & Authorization Guards

The application distinguishes between two primary user roles:
1. **Regular Student User (`USER`)**: Access to public hubs, coding practice, personal profile, bookmarks, and solved progress tracking.
2. **Platform Administrator (`ADMIN`)**: Access to all student hubs plus the role-gated `/admin/*` management suite.

### Guard Implementation Matrix

| Guard Component | Location | Logic & Gating Rules | Failure Redirect |
| :--- | :--- | :--- | :--- |
| **`ProtectedRoute`** | [`src/core/guards/ProtectedRoute.tsx`](../../src/core/guards/ProtectedRoute.tsx) | Checks `isAuthenticated && isTokenValid(token)`. If loading, renders `<PageLoading />`. Saves attempted destination in `sessionStorage.getItem('post_auth_redirect')`. | Redirects to `/login` |
| **`GuestRoute`** | [`src/core/guards/GuestRoute.tsx`](../../src/core/guards/GuestRoute.tsx) | Verifies user is unauthenticated. If already logged in, signed JWT claims alone select `/admin/dashboard`; all other users go to `/practice`. | Redirects to `/practice` or `/admin/dashboard` |
| **`AdminRoute`** | [`src/core/guards/AdminRoute.tsx`](../../src/core/guards/AdminRoute.tsx) | Evaluates `isAuthed`. If true, requires `isJwtAdmin(token)` from signed token claims (`role`, `Role`, `roles`, `authorities`, `scope`). Cached user/profile role strings never authorize an admin route. | Non-admin users -> `/practice`<br>Unauthenticated -> `/login` |

---

## 3. End-to-End User Journeys

### Journey 1: Student Registration, Profile Completion & AISHE Selection
1. **Landing & Signup**: User arrives at `/` or clicks "Sign Up" navigating to `/signup`.
2. **Form Validation**: Form enforces standard email rules (RFC 5322), minimum 6-character password with match confirmation, and international name support.
3. **Account Creation**: Calls `POST /api/v1/signUp`. On success, automatically proceeds to login or directs user to sign in.
4. **Academic Setup**: User navigates to `/profile` (protected by `ProtectedRoute`).
5. **College Search**: User types college name in `InstitutionAutocomplete`. After 3 characters, it calls `GET /api/v1/institutions/search?query=...` and displays matched institutions with AISHE codes.
6. **Save Profile**: User saves academic details (passing year, graduation year, registration number). Dispatches `POST /api/v1/userInfo/{userId}` with `jwtToken`.

### Journey 2: DSA Problem Solving & Live Code Compilation
1. **Catalog Navigation**: Student navigates to `/practice` for the general catalog or `/dsa-sheet` for an ordered learning path.
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
1. **Directory Browse**: User visits `/companies`. `CompanyBrandLogo` resolves the 121 bundled recruiter assets first, then uses the documented dynamic provider cascade for companies outside the local registry.
2. **Company Blueprint**: User selects TCS (`/companies/tcs`). Page queries `GET /api/v1/company/1` and `POST /api/v1/company/1/exams/list`.
3. **Exam Selection**: User clicks "TCS NQT 2026" (`/companies/1/exams/10`).
4. **Section Breakdown**: Displays exam rounds, durations, marks, and associated technical interview/coding questions.

### Journey 4: Aptitude & MCQ Assessment
1. **Practice Hub**: User visits `/aptitude`. Selects Quantitative Aptitude, Logical Reasoning, Verbal, or Pseudocode.
2. **Question Fetch**: Client calls `POST /api/v1/mcq` with subject group and difficulty codes.
3. **Option Selection**: User interacts with radio options (A, B, C, D). `synthesizeMcqOptions` in `mcqUtils.ts` accurately maps option-level `isCorrect` flags.
4. **Instant Feedback**: User checks explanation or submits mock test to calculate percentile and review incorrect choices.

### Journey 5: Administrator Resource Authoring
1. **Admin Authentication**: Admin logs in at `/login`. `AdminRoute` verifies `ADMIN` role from JWT claims and renders `AdminLayout`.
2. **Question CRUD**: At `/admin/questions`, admin clicks "Add Question". Enters problem title, description, constraints, and test cases (input, expected output, hidden flag). Dispatches `POST /api/v1/question` and `POST /api/v1/question/{id}/testCases`.
3. **MCQ CRUD**: At `/admin/mcqs`, admin creates MCQ. Marks correct option explicitly. Dispatches `POST /api/v1/admin/mcq`.
4. **Institution Governance**: At `/admin/institutions`, admin reviews colleges, edits AISHE codes, and toggles active status via `PATCH /api/v1/admin/institutions/{id}/status`.

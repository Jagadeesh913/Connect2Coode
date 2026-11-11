# 04. UI Design System, Themes & Reusable Components

## 1. Design System Tokens & CSS Architecture

The visual architecture is implemented using **Tailwind CSS v4** combined with centralized CSS Custom Properties in [`src/index.css`](../../src/index.css).

### Design Tokens

```css
:root {
  /* Typography */
  --font-sans: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Surfaces & Backgrounds (Light Theme) */
  --bg-page: #FFFFFF;
  --bg-surface: #FFFFFF;
  --bg-surface-subtle: #F8FAFC;
  --bg-surface-elevated: #FFFFFF;
  --bg-surface-muted: #F1F5F9;

  /* Text Colors */
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #64748B;
  --text-subtle: #94A3B8;

  /* Borders */
  --border-primary: #E2E8F0;
  --border-subtle: #F1F5F9;
  --border-strong: #CBD5E1;

  /* Brand Accents */
  --brand-blue: #2563EB;
  --brand-blue-hover: #1D4ED8;
  --brand-blue-subtle: #EFF6FF;
  --brand-violet: #8B5CF6;
  --brand-pink: #EC4899;
  --brand-emerald: #10B981;
  --brand-amber: #F59E0B;
  --brand-rose: #F43F5E;
}

html.dark {
  /* Surfaces & Backgrounds (Dark Theme) */
  --bg-page: #070A13;
  --bg-surface: #0D1322;
  --bg-surface-subtle: #111A2E;
  --bg-surface-elevated: #111A2E;
  --bg-surface-muted: #1E293B;

  /* Text Colors */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-subtle: #475569;

  /* Borders */
  --border-primary: #1E293B;
  --border-subtle: #151E32;
  --border-strong: #334155;
}
```

---

## 2. Theme Switching Mechanics

Theme management is handled by [`src/shared/context/ThemeContext.tsx`](../../src/shared/context/ThemeContext.tsx):
- **Default Theme**: `dark` mode.
- **Storage Key**: `userScopedStorage` key `theme_pref` for the active identity scope.
- **Preference migration and API authority**: `ThemeProvider` applies the active account's scoped value on startup, authentication-status transitions, and account changes. Once authentication supplies a user ID, it reads `GET /{userId}/getTheme`; that backend preference becomes the account's light/dark setting and refreshes the scoped cache. Navbar/header toggles update the UI immediately, then serialize `POST /{userId}/theme/{isDarkTheme}` mutations so rapid toggles cannot persist out of order. Guest/system choices remain local because the supplied API represents only a boolean dark preference. A failed theme API request preserves the non-sensitive scoped fallback and never logs the user out.
- **DOM Integration**: Automatically toggles `.dark` and `.light` class on the root `<html>` element.
- **Form Controls**: Sets `color-scheme: light` or `color-scheme: dark` to ensure native browser selects, scrollbars, and date-pickers render in the matching theme.

---

## 3. Official Brand Assets & `<BrandLogo />` Policy

As defined in [`.agents/rules/brand-logo.md`](../../.agents/rules/brand-logo.md):
- **Asset Files**:
  - Full Official Logo: `/logo.png` and `/logo-full.png` (Transparent PNG with 3D gradient ribbon `< >` / infinity loop mark, "CONNECTTOCODE" heading, and "CODE TOGETHER CONNECT FOREVER" tagline)
  - Horizontal Lockup: `/logo-horizontal.png`
  - Isolated Brand Mark: `/logo-mark.png` and `/logo-mark-transparent.png`
  - Browser Icons: `/favicon.ico`, `/favicon.svg`, `/favicon-32x32.png`, `/favicon-16x16.png`, and the generated 180×180 `/apple-touch-icon.png`
  - Installable App Icons: `/app-icon-192.png`, `/app-icon-512.png`, and safe-zone `/app-icon-maskable-512.png`, registered by `/site.webmanifest`
  - Social Preview: `/social-card.png` (1200×630) built from the official horizontal lockup for Open Graph and Twitter/X cards
- **Component**: `<BrandLogo />` located at [`src/shared/components/ui/BrandLogo.tsx`](../../src/shared/components/ui/BrandLogo.tsx). Supports variants: `mark` (default), `horizontal`, and `full`.
- **Rule**: Never replace official logo assets with generic SVG code, emoji, or external image links.

---

## 4. Reusable Component Catalog

All generic components reside in [`src/shared/components/ui/`](../../src/shared/components/ui/):

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`BrandLogo`** | `src/shared/components/ui/BrandLogo.tsx` | Official brand logo with variants (`mark`, `horizontal`, `full`) and custom sizes. |
| **`Button`** | `src/shared/components/ui/Button.tsx` | Base button supporting variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) and sizes (`sm`, `md`, `lg`). Handles loading spinners automatically and defaults to `type="button"`; form submitters must opt in explicitly. |
| **`Badge`** | `src/shared/components/ui/Badge.tsx` | Status pill with variants (`default`, `success`, `warning`, `danger`, `info`, `purple`). Used for difficulty tiers and test case results. |
| **`Navbar`** | `src/shared/components/ui/Navbar.tsx` | Sticky top navigation bar with search trigger, navigation links, theme toggle, user avatar dropdown, and mobile menu drawer. |
| **`Footer`** | `src/shared/components/ui/Footer.tsx` | Footer with verified internal destinations, a truthful newsletter-coming-soon notice, dynamic copyright year, and brand tagline. It does not advertise unimplemented legal, social, or subscription destinations. |
| **`Pagination`** | `src/shared/components/ui/Pagination.tsx` | Accessible pagination control with non-submitting buttons, previous/next arrows, labeled page numbers, `aria-current="page"`, boundary truncation, and a pending lock that disables every page action while a request owns the result set. |
| **`PageLoading`** | `src/shared/components/ui/PageLoading.tsx` | Route-aware, geometry-preserving shimmer fallback; every route receives a skeleton rather than blank or text-only lazy-loading content. |
| **`Skeleton`** | `src/shared/components/ui/Skeleton.tsx` | Shimmer placeholder for cards, tables, and text lines during data fetching. |
| **`EmptyState`** | `src/shared/components/ui/EmptyState.tsx` | Clean empty state placeholder with customizable icon, title, description, and action button. |
| **`FormFieldError`** | `src/shared/components/ui/FormFieldError.tsx` | Consistent error message display for React Hook Form input validation. |
| **`RequestStatus`** | `src/shared/components/ui/RequestStatus.tsx` | Multi-state wrapper handling loading, error, and empty states before rendering child content. |
| **`RouteErrorBoundary`** | `src/shared/components/errors/RouteErrorBoundary.tsx` | Router-level, token-based recovery screen for unexpected route errors; it deliberately hides raw exception details. |
| **`ConfirmDialog`** | `src/shared/components/ui/ConfirmDialog.tsx` | Modal confirmation dialog for destructive actions. It uses unique accessible labels, initially focuses the safer cancel action, traps Tab focus, restores prior focus, locks body scroll, and blocks dismissal while busy. |
| **`C2CSelect`** | `src/shared/components/ui/C2CSelect.tsx` | Branded accessible single-select/listbox for controls whose opened option menu must match the application UI. Supports keyboard navigation, Escape dismissal, outside-click dismissal, disabled/busy state, and light/dark themes. |
| **`CodingQuestionTable`** | `src/features/problems/components/CodingQuestionTable.tsx` | The canonical Practice-page table for API-backed coding questions. It owns the same responsive columns, list-response QPF platform logos, safe company-logo rendering, bookmark affordance, solved state, and table-row skeleton across Practice, Company Prep, DSA Sheet, and the admin company-question view. The question list supplies platform/company summaries directly, so the table does not issue a duplicate QPF lookup. |

`C2CSelect` is the project-wide standardized single-select and floating listbox component. Because native HTML `<select>` elements render unstyleable browser/OS-owned popup menus that suffer from contrasting operating-system highlights and duplicate chevrons, `C2CSelect` is used uniformly across the entire project (including the language selector in `/problems/1`, the Practice page pagination selector, the Aptitude sorting dropdown, the profile academic year selectors, and all admin filter bars and modal forms). It provides keyboard accessibility, single rotating chevrons, brand icon support, option checkmarks, and theme-aware surfaces across light and dark modes.

`AuthenticatedFeatureGate` composes the shared `EmptyState`, auth modal, `PageLoading`, and `SessionRecoveryState` components into one consistent signed-out experience for Problems, DSA Sheet, Company Prep, and Aptitude. The route gate renders its child page only after authentication succeeds, so signed-out states cannot mount feature effects or issue feature API calls.

`SessionRecoveryState` uses the same `--bg-*`, `--text-*`, and border tokens as the application shell, so a temporary backend outage respects both light and dark themes. A transport/5xx startup refresh failure keeps the existing client session intact and says that the server cannot be reached; it offers retry rather than incorrectly claiming the user was signed out. Only a verified refresh 401 transitions to signed out.

The application-level toaster is offset by the responsive `--c2c-navbar-height` token plus a safe-area inset and visual gap. Notifications therefore begin below the sticky navbar on both mobile and desktop instead of covering navigation controls. [`src/shared/notifications/toast.ts`](../../src/shared/notifications/toast.ts) is the only application notification boundary: it replaces the previous notice before showing the next one and normalizes visible text to 140 characters, preventing stale stacks and raw/overlong backend wording.

`src/features/admin/components/AdminModal.tsx` is the shared admin-form modal. It exposes dialog semantics, an accessible title, initial focus, tab containment, focus restoration, and body-scroll locking. It uses Framer Motion only for its mount/unmount backdrop and dialog transition, and disables those transitions when the operating system requests reduced motion. Other components should not add animation unless it communicates a real state change.

`src/shared/hooks/useAccessibleDialog.ts` provides the same initial-focus, Tab-containment, Escape-close, scroll-lock, and focus-restoration lifecycle to the login, profile-edit, and company-MCQ dialogs. It keeps the latest close callback in a ref so parent rerenders cannot restart the focus lifecycle and move focus away from a field while the user is typing. Dialogs may mark their intended first control with `data-dialog-initial-focus`; login starts in the email field instead of the close button. Dialog containers still own their specific accessible name and `aria-modal` semantics. The login/signup overlay uses an opaque dark surface plus blur so the underlying sticky-navbar border cannot appear as a line across the authentication form backdrop.

In `PracticePage`, `AdminQuestions`, and `AdminMcqs`, the table layout combines the question identifier and difficulty tier into a single unified `#` column using `getDifficultyNumberColor` (e.g. emerald for Easy/Basic, amber for Medium, rose for Hard, sky for Basic). Inactive items (`isActive === false`) render their question container with a distinct red rounded border (`border-rose-400 dark:border-rose-500 rounded-xl`) accompanied by an explicit `Inactive` badge, while preserving readable standard font weight and color for the problem statement.

`DsaSheetPage` follows the practice and aptitude visual language with uniform 2048x384 (16:3) generated light/dark DSA hero banners matching the Practice page aesthetic and dimensions, a two-path accessible tab toggle, and expandable section panels. Its sheet carousel has an explicit pause/resume control, pauses for hover and keyboard focus, stops in hidden tabs, and disables automatic/CSS motion for reduced-motion users; the disabled control announces that operating-system setting instead of offering an unavailable resume action. Section-question associations validate and adapt their structured API-owned company/platform summaries into `CodingQuestionTable`, so its loading, error, empty, bookmark, progress, logo, and navigation states are the same as Practice rather than a look-alike card list. The page renders supplied company/platform metadata directly and does not issue a second company-catalog read. `AdminDsaSheets` uses the established admin component system with explicit edit actions for sheets, sections, and linked-question metadata.

`AdminReferences` uses the same admin page header, table, modal, badge, request-status, and confirmation-dialog system. Group selection and record reads are shared taxonomy operations, while create, update, and hard-delete controls exist only in the admin route. Group-catalog reads are generation-owned so an older initial request cannot overwrite a successful post-mutation refresh. The hard-delete dialog explicitly names the group/code and warns that the operation is irreversible and may affect every dependent dropdown or record.

`AdminDashboard` loads primary platform totals independently from DIFF-reference-dependent difficulty counts. Reference hydration or retry refreshes only the three difficulty metrics, so it cannot abort or duplicate the primary problem, company, institution, MCQ, and sheet requests. A completed empty DIFF catalog clears tier counts and reports the missing taxonomy, while concurrent primary and difficulty failures are shown together.

`DashboardCodeRunner` loads one bounded question page for its initial selector, then exposes sequential **Load more** pagination. Backend search has its own sequential result pagination, manual question-ID lookup remains available, and reload preserves the active loaded selection. Selection commits synchronize their ref before React state and keep manual-input updates outside state updaters, preventing an async catalog response from overwriting a newer manual selection. Request generations discard stale page responses after a reload or search, while catalog merges do not retrigger the selected question-detail request. This keeps the full bank discoverable without request fan-out proportional to its size.

Practice and aptitude filter choices are semantic toggle buttons with `aria-pressed` and visible keyboard focus. List pages replace rows with context-matched skeletons when an uncached filter/page query begins; controls that can issue competing page requests remain disabled until that query settles.

`AdminTable` replaces every visible row with same-column shimmer cells whenever its owning request is pending, including refreshes with prior data. Clickable rows expose equivalent Enter/Space activation and visible focus. Detail modals use shaped skeletons for unavailable records and nested lists rather than text-only spinners.

## 5. Coding Workspace Behavior

`ProblemDetails` is the student coding workspace. It attaches below the shared top navbar, filling the available viewport height (`h-[calc(100dvh-var(--c2c-navbar-height,64px))]`) and centering within the standard platform container (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4`) matching the Practice and Company pages with a rounded card container (`rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800`), while offering an accessible distraction-free fullscreen mode toggle. Desktop uses a problem specification pane (with quick action shortcuts for Description, Test cases, Submissions, Companies, and Hints), an accessible draggable/keyboard vertical splitter, code editor toolbar (`C2CSelect` language picker, fullscreen toggle, Reset, Run, and Submit), Monaco editor, accessible draggable/keyboard horizontal splitter, and an internally scrolling test/result dock; double-click or `Home` restores each splitter's default. Tablet and mobile expose unified Description, Editor, and Test cases views. All internal scrolling remains available with visually hidden scrollbar tracks. Test cases in both public preview and execution verdicts render as vertical in-place accordions utilizing exact API field names (`testCaseName`, `name`, `testCaseType`, `typeRefName`) without synthetic placeholders; hidden test cases display locked verdict rows without exposing internal test vectors. Its Monaco editor uses automatic layout, word wrapping, bracket guides, suggestions, format-on-type/paste, accessibility auto-detection, and a loading skeleton. `monaco-editor` and its workers are bundled from the pinned local dependency and initialized inside lazy editor consumers; the application never requests the jsDelivr AMD loader that deployment CSP blocks. The root application shell is the single owner of assessment-integrity capture listeners; the workspace does not install a second controller around Monaco. While a run or submission is in flight the editor is read-only, which keeps the displayed verdict tied to the submitted source snapshot. User/problem/language-specific drafts are restored from `userScopedStorage` after refresh. Loading historical source resolves the submission's table/reference language ID, switches the editor to that language, and refuses an unavailable language instead of placing source into the currently selected runtime. Results use an ARIA live region, display clean and concise real-time status indicators during execution ("Running...", "Evaluating..."), and present compact pass/fail progress. Runtime and memory values carry units only when the response field names establish them; hidden evaluation values and diagnostics are removed before rendering.

The workspace keeps the verified sample test case execution contract for Run and full-evaluation endpoint for Submit. The admin code runners share the same language registry, disable duplicate actions during a request, and report the returned pass/fail count instead of showing a success toast for failed cases.

Aptitude and Company Preparation never construct answer choices. When an MCQ list row has no `options`, Aptitude offers an explicit per-card load action and Company Preparation loads detail when its solve modal opens. Both surfaces show request progress, a retryable error, or the backend-confirmed empty-option state. Admin system information describes configured JWT/session-role state and does not claim a live token or RBAC health check.

The landing-page code card is an illustrative preview whose only execution action opens `/practice`; it does not simulate a successful compiler response. Learner cards are explicitly labeled illustrative workflows rather than testimonials, and numerical adoption/content claims are not displayed without measured evidence. Their carousel pauses on hover, keyboard focus, explicit pause, hidden documents, and reduced-motion preferences. The dark landing hero uses the 3840×2576 `/hero_illustration_dark_4k.png` asset, whose outer background is exactly `--bg-page` (`#070A13`) to blend into the dark landing surface.

Assessment integrity controls in [`src/shared/hooks/useAssessmentIntegrity.ts`](../../src/shared/hooks/useAssessmentIntegrity.ts) run from the root application shell only for non-admin routes. They restrict native clipboard events, text selection, context menus, middle-click paste, drag/drop, Print Screen and common OS screenshot shortcuts, plus source/open/save/print browser exports. Keyboard classification tolerates an absent/non-string `KeyboardEvent.key` from password managers, IMEs, or synthetic events and treats it as an unknown unrestricted key instead of crashing ordinary form entry. The `/admin` route tree deliberately omits both the event guard and protected-surface CSS class, leaves ordinary selection, clipboard, context-menu, drag/drop, printing, and browser shortcuts available to administrators, and exits learner secure-mode fullscreen when navigating into admin. Developer Tools shortcuts remain available everywhere by product decision. On protected problem workspaces, Monaco uses a separate in-memory clipboard: selected source can be copied, cut, and pasted only inside that editor and never enters the operating-system clipboard. The inactive-window privacy-curtain UI was removed by product request; tab-switch events continue to be observed by the hook, but no focus-loss overlay is rendered. Problem workspaces expose an explicit **Secure mode** control which requests fullscreen plus browser keyboard lock where supported and reports premature fullscreen exit. Normal typing, undo, and Run/Submit shortcuts remain enabled. These are browser-side deterrents, not a proctoring or security boundary; extensions, modified clients, operating-system capture, cameras, and external devices require a managed kiosk or secure assessment browser plus server-side session policy and audit events.


---

## 6. Recruiter Company Logo Registry

Located in [`src/features/companies/utils/companyLogoRegistry.ts`](../../src/features/companies/utils/companyLogoRegistry.ts) and [`src/features/companies/components/CompanyBrandLogo.tsx`](../../src/features/companies/components/CompanyBrandLogo.tsx):
- **121 SVG/PNG Assets**: Stored in `public/companies/`.
- **API-First Resolution**: The verified company DTO field `logo` is the first candidate. It is accepted only after the shared image-URL guard verifies HTTPS and rejects private/local hosts, credentials, protocol-relative paths, and non-web schemes.
- **Dynamic Fallback Cascade**: If a valid API logo is absent or fails, the component tries a bundled asset, then an optional domain-based Brandfetch image (when `VITE_BRANDFETCH_CLIENT_ID` is configured), a Simple Icons CDN slug, and the validated official website favicon. Failed candidates advance automatically without leaving a broken image.
- **Canonical Alias Map**: Resolves company variations and legal suffixes (for example `tcs`, `tata`, `tcs ion`, and `tata consultancy services` to `/companies/tcs.svg`).
- **Professional Monogram Fallback**: If every image source fails, `CompanyBrandLogo` renders a deterministic two-letter gradient badge with accessible labeling. Company watermarks reuse local art in a monochrome treatment.
- **Compact company & platform marks**: `CompanyCircleBadge` is a transparent circular clip around the API-first logo cascade. It deliberately has no white square tile, border, or padding shell, so compact question rows use the actual mark rather than a boxed placeholder. `PlatformCircleBadge` reuses this identical circular design pattern for platform logos (LeetCode, HackerRank, GeeksforGeeks, CodeChef, TCS iON, AON, Mettl) in problem tables and workspaces.
- **Remote-image boundary**: API-logo and website-derived candidates reuse the shared HTTPS/public-host guard and send no referrer. The UI never inserts an unvalidated backend value into `img.src`.

The cascade is designed for broad dynamic coverage, but **95% coverage is not asserted by repository tests**. Brandfetch advertises 95%+ core-brand coverage; that external claim and production CDN availability must be validated with the deployed client ID and the production company dataset. The deterministic monogram remains the guaranteed terminal state.

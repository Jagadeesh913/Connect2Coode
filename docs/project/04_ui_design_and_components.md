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
- **Storage Key**: `localStorage.getItem('c2c_theme')`.
- **DOM Integration**: Automatically toggles `.dark` and `.light` class on the root `<html>` element.
- **Form Controls**: Sets `color-scheme: light` or `color-scheme: dark` to ensure native browser selects, scrollbars, and date-pickers render in the matching theme.

---

## 3. Official Brand Assets & `<BrandLogo />` Policy

As defined in [`.agents/rules/brand-logo.md`](../../.agents/rules/brand-logo.md):
- **Asset Files**:
  - Full Official Logo: `/logo.png` and `/logo-full.png` (Transparent PNG with 3D gradient ribbon `< >` / infinity loop mark, "CONNECTTOCODE" heading, and "CODE TOGETHER CONNECT FOREVER" tagline)
  - Horizontal Lockup: `/logo-horizontal.png`
  - Isolated Brand Mark: `/logo-mark.png` and `/logo-mark-transparent.png`
  - Favicons: `/favicon.ico`, `/favicon.svg`, `/favicon-32x32.png`, `/favicon-16x16.png`, `/apple-touch-icon.png`
- **Component**: `<BrandLogo />` located at [`src/shared/components/ui/BrandLogo.tsx`](../../src/shared/components/ui/BrandLogo.tsx). Supports variants: `mark` (default), `horizontal`, and `full`.
- **Rule**: Never replace official logo assets with generic SVG code, emoji, or external image links.

---

## 4. Reusable Component Catalog

All generic components reside in [`src/shared/components/ui/`](../../src/shared/components/ui/):

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`BrandLogo`** | `src/shared/components/ui/BrandLogo.tsx` | Official brand logo with variants (`mark`, `horizontal`, `full`) and custom sizes. |
| **`Button`** | `src/shared/components/ui/Button.tsx` | Base button supporting variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) and sizes (`sm`, `md`, `lg`). Handles loading spinners automatically. |
| **`Badge`** | `src/shared/components/ui/Badge.tsx` | Status pill with variants (`default`, `success`, `warning`, `danger`, `info`, `purple`). Used for difficulty tiers and test case results. |
| **`Navbar`** | `src/shared/components/ui/Navbar.tsx` | Sticky top navigation bar with search trigger, navigation links, theme toggle, user avatar dropdown, and mobile menu drawer. |
| **`Footer`** | `src/shared/components/ui/Footer.tsx` | Footer with platform links, social channels, copyright, and brand tagline ("CODE TOGETHER CONNECT FOREVER"). |
| **`Pagination`** | `src/shared/components/ui/Pagination.tsx` | Accessible pagination control with non-submitting buttons, previous/next arrows, labeled page numbers, `aria-current="page"`, and boundary truncation. |
| **`PageLoading`** | `src/shared/components/ui/PageLoading.tsx` | Full-screen or container loading state with animated brand logo pulse and gradient spinner. |
| **`Skeleton`** | `src/shared/components/ui/Skeleton.tsx` | Shimmer placeholder for cards, tables, and text lines during data fetching. |
| **`EmptyState`** | `src/shared/components/ui/EmptyState.tsx` | Clean empty state placeholder with customizable icon, title, description, and action button. |
| **`FormFieldError`** | `src/shared/components/ui/FormFieldError.tsx` | Consistent error message display for React Hook Form input validation. |
| **`RequestStatus`** | `src/shared/components/ui/RequestStatus.tsx` | Multi-state wrapper handling loading, error, and empty states before rendering child content. |
| **`ConfirmDialog`** | `src/shared/components/ui/ConfirmDialog.tsx` | Modal confirmation dialog for destructive actions (e.g. deleting a question or institution). |

`src/features/admin/components/AdminModal.tsx` is the shared admin-form modal. It exposes dialog semantics, an accessible title, initial focus, tab containment, focus restoration, and body-scroll locking. It uses Framer Motion only for its mount/unmount backdrop and dialog transition, and disables those transitions when the operating system requests reduced motion. Other components should not add animation unless it communicates a real state change.

In `PracticePage`, `AdminQuestions`, and `AdminMcqs`, the table layout combines the question identifier and difficulty tier into a single unified `#` column using `getDifficultyNumberColor` (e.g. emerald for Easy/Basic, amber for Medium, rose for Hard, sky for Basic). Inactive items (`isActive === false`) render their question container with a distinct red rounded border (`border-rose-400 dark:border-rose-500 rounded-xl`) accompanied by an explicit `Inactive` badge, while preserving readable standard font weight and color for the problem statement.

`DsaSheetPage` follows the same slate/blue light-and-dark palette with a restrained radial hero treatment, sheet selector, progress summary cards, and accessible expandable section panels. Questions reuse shared `Badge`, `Skeleton`, `Button`, and `EmptyState` components. `AdminDsaSheets` uses the established `AdminPageHeader`, `AdminCard`, `AdminModal`, `AdminBadge`, and confirmation-dialog system instead of introducing a parallel admin visual language.

## 5. Coding Workspace Behavior

`ProblemDetails` is the student coding workspace. Its Monaco editor uses automatic layout, word wrapping, accessibility auto-detection, and a loading skeleton. While a run or submission is in flight the editor is read-only, which keeps the displayed verdict tied to the submitted source snapshot. Results use an ARIA live region and scroll into view when the request settles.

The workspace exposes the API-supported optional `customInput` field only from **Run with Custom Input**. Normal Run keeps the verified visible-test-case contract; Submit continues to use the full-evaluation endpoint. The admin code runners share the same language registry, disable duplicate actions during a request, and report the returned pass/fail count instead of showing a success toast for failed cases.

Assessment integrity controls in [`src/shared/hooks/useAssessmentIntegrity.ts`](../../src/shared/hooks/useAssessmentIntegrity.ts) restrict the context menu, clipboard events, drag/drop, Print Screen, source-view/print, and common developer-tool shortcuts on the student coding workspace. Normal left-click interaction, typing, undo, and Run/Submit shortcuts remain enabled. These are browser-side deterrents, not a proctoring or security boundary; a real high-stakes assessment still requires server-side session policy, audit events, and authenticated proctoring.


---

## 6. Recruiter Company Logo Registry

Located in [`src/features/companies/utils/companyLogoRegistry.ts`](../../src/features/companies/utils/companyLogoRegistry.ts) and [`src/features/companies/components/CompanyBrandLogo.tsx`](../../src/features/companies/components/CompanyBrandLogo.tsx):
- **121 SVG/PNG Assets**: Stored in `public/companies/`.
- **Local-First Resolution**: All curated definitions plus the previously unreachable bundled PNG/SVG assets are addressable by normalized company name. Local assets are always attempted first and do not create remote requests when they load.
- **Dynamic Fallback Cascade**: For companies outside the bundle, the component tries an optional domain-based Brandfetch image (when `VITE_BRANDFETCH_CLIENT_ID` is configured), a Simple Icons CDN slug, and the validated official website favicon. Failed candidates advance automatically without leaving a broken image.
- **Untrusted Backend Logo Isolation**: Arbitrary `logo`/`logoUrl` values returned by the backend are not used as image sources. The API `website` field is parsed to a hostname; localhost, bare hostnames, and IP addresses are rejected.
- **Canonical Alias Map**: Resolves company variations and legal suffixes (for example `tcs`, `tata`, `tcs ion`, and `tata consultancy services` to `/companies/tcs.svg`).
- **Professional Monogram Fallback**: If every image source fails, `CompanyBrandLogo` renders a deterministic two-letter gradient badge with accessible labeling. Company watermarks reuse local art in a monochrome treatment.

The cascade is designed for broad dynamic coverage, but **95% coverage is not asserted by repository tests**. Brandfetch advertises 95%+ core-brand coverage; that external claim and production CDN availability must be validated with the deployed client ID and the production company dataset. The deterministic monogram remains the guaranteed terminal state.

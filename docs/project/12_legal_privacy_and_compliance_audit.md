# 12. Legal, Privacy, Cookie & Accessibility Audit

> **Audit date:** 17 November 2026  
> **Scope:** Complete frontend repository, public document shell, routes, API contracts, authentication/session handling, browser storage, third-party browser requests, CI/deployment configuration, and user-facing trust surfaces. Backend, database, Judge0, OAuth provider configuration, hosting account settings, server logs, backups, and production response behavior are external dependencies.  
> **Status language:** `EXISTING`, `IMPLEMENTED`, `NEEDS IMPROVEMENT`, `MISSING — OWNER`, `MISSING — BACKEND`, and `NEEDS VALIDATION`.

This document is an engineering and product-compliance audit, not legal advice. Final legal text and applicability decisions require qualified counsel and the identified service operator.

## 1. Executive Result

The repository had strong frontend authentication/storage controls but no public legal, privacy, support, accessibility, or data-rights routes. This change adds eight project-native public pages, footer/settings access, build-time metadata and prerender coverage, a precise cookie/storage inventory, and an account-scoped local-data clearing control. It deliberately does **not** add a cookie banner: the reviewed frontend contains no analytics, advertising, social-pixel, tag-manager, or behavioral-tracking SDK, and its current storage is required for authentication or user-requested features.

Production legal readiness is still blocked by missing operator identity/contact details, unverified backend retention/deletion/export workflows, unverified refresh-cookie/OAuth/server authorization controls, an incomplete content/logo license register, and the absence of an independently tested accessibility conformance result.

## 2. Requirements Checklist

| Requirement | Before | Current result | Evidence / action |
| :--- | :--- | :--- | :--- |
| Privacy Policy | Missing | **IMPLEMENTED; legal approval required** | `/privacy` describes only source-visible categories, purposes, storage, recipients, retention uncertainty, rights, security, children, and change handling. |
| Cookie & Storage Policy | Missing | **IMPLEMENTED** | `/cookies` inventories the backend refresh cookie, memory token, user-scoped local storage, session storage, and cross-tab transport. Exact server cookie attributes remain `NEEDS VALIDATION`. |
| Terms & Conditions | Missing | **IMPLEMENTED as owner-review draft** | `/terms` covers accounts, acceptable use, code execution, user submissions, third-party rights, availability, and outcome limitations without inventing governing law, liability caps, or operator identity. |
| Disclaimer | Missing | **IMPLEMENTED** | `/disclaimer` distinguishes preparation from recruitment, examination, professional advice, and production-code assurance. |
| Copyright/trademark notice | Footer assertion only | **IMPLEMENTED; asset register missing** | `/copyright` separates original/platform materials from recruiter brands and linked content. Logo/content licenses are `MISSING — OWNER`. |
| Accessibility statement | Missing | **IMPLEMENTED; conformance unverified** | `/accessibility` documents current measures and limitations and targets WCAG 2.2 AA without claiming conformance. |
| Contact/support page | Missing | **IMPLEMENTED with blocker disclosure** | `/support` provides safe troubleshooting and request categories. Verified support/privacy/grievance/security contacts are `MISSING — OWNER`. |
| Data retention disclosure | Missing | **IMPLEMENTED for known client storage** | Browser persistence/removal is described. Server records, logs, backups, replicas, and deletion schedules are `MISSING — BACKEND`. |
| Account/data deletion | Missing | **PARTIALLY IMPLEMENTED** | `/data-rights` clears the active account’s local browser scope with confirmation and explicitly distinguishes this from server deletion. Authenticated deletion/export/request APIs are `MISSING — BACKEND`. |
| Privacy rights request process | Missing | **NEEDS IMPROVEMENT** | Rights and safe identity-verification expectations are explained; a verified intake channel, SLA, grievance/appeal flow, and backend case workflow are missing. |
| Footer legal links | Missing by prior design | **IMPLEMENTED** | Footer now exposes Privacy, Cookies, Terms, Disclaimer, Copyright, Support, Data Rights, and Accessibility on mobile and desktop. |
| Settings privacy entry points | Missing | **IMPLEMENTED** | `/settings` links to privacy, cookie/storage, data-rights, and support surfaces. |
| Legal route metadata | Missing | **IMPLEMENTED** | Central metadata entries, public prerender registry entries, sitemap generation, and clean-URL static documents were added. |
| Cookie consent banner | Missing | **NOT REQUIRED by current frontend behavior** | No optional tracking exists. A banner would create false choice and unnecessary consent storage. Add a prior-choice gate only before introducing non-essential storage or tracking. |
| Cookie preference manager | Missing | **NOT APPLICABLE currently** | There is no optional category to toggle. `/cookies` explains browser controls and the future implementation trigger. |
| Analytics/tracking inventory | Unstated | **EXISTING: none source-visible** | Repository scan found no analytics, ad pixel, tag manager, telemetry SDK, or chat widget. Backend/provider analytics remain `NEEDS VALIDATION`. |
| Essential refresh-cookie design | Existing | **EXISTING; deployment validation required** | Frontend uses bodyless credentialed refresh and never reads/creates the HttpOnly refresh cookie. Cookie name/flags/lifetime/rotation/revocation are backend-owned. |
| Access-token storage | Existing | **EXISTING** | Access token and identity are memory-only; legacy readable token cookies/storage are purged. |
| User-scoped browser data | Existing | **EXISTING** | `userScopedStorage` uses full encoded account identity for theme, progress, and drafts. Logout clears the departing scope except theme. |
| Cross-tab auth data minimization | Existing | **EXISTING** | Broadcast/storage events contain only event type and timestamp; tabs re-establish state through the cookie-backed refresh flow. |
| OAuth transparency | Partial | **NEEDS IMPROVEMENT / VALIDATION** | Google sign-in is disclosed. Provider scopes, state/nonce/PKCE, redirect allowlist, and provider retention require backend/provider evidence. |
| Third-party resource disclosure | Missing | **IMPLEMENTED in policies** | Google Fonts, cdnjs Font Awesome, static hosting, Google OAuth, backend-mediated Judge0, and conditional external links/images are described. Local bundling remains a recommended minimization improvement. |
| Data minimization | Partial | **NEEDS IMPROVEMENT** | Current profile form uses only API-supported fields, but the owner must justify DOB, gender, registration number, and academic identifiers and define whether each is optional. |
| Children/age handling | Missing | **MISSING — OWNER/BACKEND** | The product is aimed at college students/job seekers but has no verified age gate or parental-consent flow. Owner must decide the permitted age and applicable child-data controls. |
| Security incident/privacy breach process | Not source-visible | **MISSING — OWNER/BACKEND** | Publish internal escalation, user/regulator notification criteria, processor coordination, and evidence-retention procedures. |
| Accessibility feedback channel | Missing | **MISSING — OWNER** | Statement exists, but a verified channel and response target must be published. |
| WCAG conformance | Partial engineering measures | **NEEDS VALIDATION** | Keyboard/dialog/reduced-motion/semantic measures exist; no independent WCAG 2.2 AA audit or screen-reader matrix exists. |
| Assessment-integrity accessibility | Existing deterrents | **NEEDS LEGAL/UX REVIEW** | Learner routes restrict selection, clipboard, printing, and shortcuts. These are documented as deterrents and may conflict with assistive workflows or accommodations. |
| Company logo/content licenses | Local assets exist | **MISSING — OWNER** | Local bundling improves reliability/privacy but does not establish a reuse license. Build an asset provenance/license/attribution register. |
| Recruitment-content freshness | Existing content | **NEEDS IMPROVEMENT** | Disclaimer directs users to verify time-sensitive details. Add content owner, source, reviewed date, and expiry/review cadence to backend records. |
| Automated compliance regression checks | Missing | **IMPLEMENTED** | `scripts/tests/legalCompliance.test.mjs` checks route/footer coverage, disclosure boundaries, no false compliance claims, no unnecessary consent UI, local-vs-server deletion clarity, metadata/prerender registration, and the final external-URL boundary. |

## 3. Actual Cookie, Storage & Third-Party Audit

### 3.1 Cookies and authentication

- The frontend does not set the active authentication cookie. The backend is designed to set a refresh token in an HttpOnly cookie.
- `apiClient` uses `withCredentials: true`; startup, OAuth completion, and protected-request recovery call the same bodyless refresh flow.
- Access tokens and identity remain in JavaScript memory for the tab and are attached only as `Authorization: Bearer` on protected requests.
- The frontend expires obsolete JavaScript-readable credential cookies and browser-storage aliases. It cannot and must not modify the backend-owned HttpOnly refresh cookie.
- `NEEDS VALIDATION`: cookie name, `HttpOnly`, `Secure`, `SameSite`, `Domain`, `Path`, lifetime, rotation, replay response, logout revocation, CSRF validation, and server JWT verification.

### 3.2 Local and session storage

| Key family | Data | Scope | Removal behavior |
| :--- | :--- | :--- | :--- |
| `c2c:user:v2:<encoded identity>:theme_pref` | Light/dark/system preference | Full account identity or guest | Preserved on normal logout; removable through `/data-rights` or browser controls. |
| `c2c:user:v2:<encoded identity>:problem_progress` | Solved-state cache | Full account identity | Cleared on logout/account cleanup or `/data-rights`. |
| `c2c:user:v2:<encoded identity>:code_draft:*` | Per-problem/language source draft | Full account identity | Cleared on logout/account cleanup or `/data-rights`. |
| `post_auth_redirect` | Internal return path | Current tab/session | Removed after use/logout/session clear. |
| `c2c_logout_notice` | One-time logout feedback | Current tab/session | Removed after landing-page display. |
| `c2c_auth_session_event` | Token-free auth event fallback | Transient origin-wide marker | Removed immediately after publication. |

### 3.3 Third parties visible in source

| Service | Current purpose | Browser/server contact | Compliance action |
| :--- | :--- | :--- | :--- |
| Static hosting/CDN provider | Serve website and headers | Browser | Owner must confirm contract, regions, logs, and active configuration. |
| Connect2Code API | Authentication, profile, content, progress, execution | Browser | Backend data map, retention, deletion, logs, security, and processor list required. |
| Google OAuth | Optional sign-in | Browser → backend/provider | Confirm scopes, state/nonce/PKCE, redirect URIs, provider settings, and privacy disclosures. |
| Google Fonts | Remote font CSS/files | Browser | Disclosed; self-hosting recommended to reduce third-party requests. |
| cdnjs Font Awesome | Remote icon CSS/font files | Browser | SRI and CSP exist; local replacement/bundling recommended. |
| Judge0 | Code execution behind API | Backend only | Confirm sandbox, retention, logs, resource limits, and data-processing arrangement. |
| Company/problem sites and image hosts | External references and conditional imagery | Browser when used/loaded | Safe URL filters exist; keep `no-referrer` where supported and prefer local assets. |

## 4. Legal Applicability Review (Counsel Must Confirm)

### India

- The [Digital Personal Data Protection Act, 2023](https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf) and the [13 November 2025 commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf) phase obligations in over time. As of 17 November 2026, the main processing, notice, consent, fiduciary-obligation, data-principal-rights, children, and transfer provisions listed for the 18-month phase are scheduled for 13 May 2027; section 6(9) and section 27(1)(d) entered their one-year phase on 13 November 2026. Counsel must verify any later amendment or notification before launch.
- The [Digital Personal Data Protection Rules, 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) use the same staged commencement model. Engineering should prepare notices, request handling, child-data decisions, security safeguards, breach response, retention/erasure, contact/grievance handling, processor controls, and consent records before the applicable date.
- The older [Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011](https://meity.gov.in/sites/upload_files/dit/files/GSR313E_10511%281%29.pdf) remain relevant to current owner/counsel analysis during the transition, including the published privacy-policy and reasonable-security-practice requirements for covered body corporates.

### EU/EEA and UK-style privacy/cookie principles

- GDPR applicability depends on establishment, offering goods/services to people in the EU, or monitoring their behavior. If applicable, Article 13 transparency and Articles 15–22 rights require verified controller identity, contacts, purposes/legal bases, recipients, transfers, retention criteria, rights, complaints, and automated-decision information. See the official [GDPR text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679).
- The ePrivacy cookie rule requires consent before non-essential terminal storage/access, but allows storage strictly necessary to provide a service requested by the user. See [Directive 2002/58/EC Article 5(3)](https://eur-lex.europa.eu/eli/dir/2002/58/art_5/par_3/oj/eng). The current source-visible stores support authentication or user-requested features and no optional tracking exists; therefore no synthetic consent banner was added.
- If analytics, advertising, personalization beyond the requested feature, cross-site measurement, or optional device access is added, obtain a legal classification first, implement prior blocking and equal accept/reject controls where required, persist the choice, and provide withdrawal as easily as acceptance.

### Accessibility

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) is the recommended technical target; the public statement intentionally does not claim conformance without a complete manual and automated audit.
- The [Rights of Persons with Disabilities Act, 2016](https://www.indiacode.nic.in/handle/123456789/2155?locale=en) and applicable rules/standards require owner/counsel applicability review. Product accessibility should be treated as a release requirement regardless of the minimum legal scope.

## 5. Implemented Files and Behavior

- `src/features/legal/legalContent.ts`: source-grounded content for eight public trust pages.
- `src/features/legal/pages/LegalPage.tsx`: shared responsive, keyboard-friendly page shell with in-page navigation, tables, notices, and related links.
- `src/features/legal/components/LocalDataControls.tsx`: signed-in account-scoped browser-data clearing with explicit confirmation and server-deletion warning.
- `src/features/admin/components/questions/QuestionDetailsModal.tsx` and `src/features/admin/pages/AdminReferences.tsx`: final-boundary validation for legacy/API-provided challenge links and remote images.
- `src/routes/appRoutes.tsx`: public routes for `/privacy`, `/cookies`, `/terms`, `/disclaimer`, `/accessibility`, `/support`, `/data-rights`, and `/copyright`.
- `src/shared/components/ui/Footer.tsx`: product, legal, and help/rights navigation.
- `src/features/settings/pages/AppSettings.tsx`: account-facing privacy/data/support entry points.
- `src/core/metadata/pageMetadata.ts`, `src/core/metadata/publicPageContent.json`, and `scripts/generate-seo-assets.mjs`: metadata, prerender, sitemap, and clean-URL static document generation.
- `scripts/tests/legalCompliance.test.mjs`: policy and integration regression checks.

## 6. Pending Backend & Deployment Dependencies

1. Authenticated account deletion with re-authentication, cancellation/recovery policy, and idempotent propagation.
2. Complete user data export/portability format and secure delivery.
3. Privacy request/grievance case workflow with identity verification, status, deadlines, exceptions, and appeal/escalation.
4. Retention schedule for accounts, profiles, submissions, code/input, progress, bookmarks, OTP/auth events, server logs, analytics, support records, deleted records, backups, and replicas.
5. Deletion, correction, and consent-withdrawal propagation through queues, caches, logs, analytics, Judge0, backups, and restore procedures.
6. Verified refresh-cookie configuration, CSRF controls, rotation/reuse handling, token validation, revocation, OAuth request binding, scopes, redirect allowlist, and rate limits.
7. Subject-to-route-user-ID and admin-role enforcement on every backend endpoint.
8. Processor/subprocessor inventory, data locations, transfer mechanisms, contracts, security incident obligations, and production analytics inventory.
9. Production verification of CSP/security headers, TLS/domain redirects, robots headers, and generated legal route responses.

## 7. Owner and Legal Approval Items

1. Legal operator/controller/data-fiduciary name, entity type, registration details, and registered/postal address.
2. Verified support, privacy/grievance, accessibility, security, and copyright/trademark notice channels; accountable people; service levels; and escalation paths.
3. Applicability and legal bases under Indian, EU/EEA, UK, and other target-market laws.
4. Permitted user age, child-data position, age assurance, and verifiable parental-consent requirements.
5. Final Terms: effective date, operator identity, user-submission license, suspension/termination process, governing law, forum, warranty language, liability/indemnity terms, and notice mechanism.
6. Content ownership, provenance, licenses, attribution, fair-use analysis, and takedown policy for logos, fonts, icons, questions, explanations, images, and recruiter information.
7. Recruitment-content sourcing, reviewed dates, expiry/review cadence, corrections, and owner accountability.
8. Accessibility target, accommodations process, manual test matrix, remediation priority, and published feedback channel.

## 8. Verification Status

- **VERIFIED (source):** routes, footer/settings entry points, policy inventory, no source-visible analytics/ad SDK, user-scoped local clearing boundary, and metadata/prerender declarations are present in source.
- **NOT RUN:** target-controlled tests, typecheck, lint, build, browser/E2E, and responsive/manual accessibility checks. The security-audit workflow requires an OS-enforced no-network/read-only/scratch-only sandbox with resource limits; the native Windows host lacks those controls and WSL is not installed.
- **NEEDS VALIDATION:** all backend/deployment/owner/legal items listed above and the actual production rendering/headers.

## 9. Post-Implementation Verification Gate (2026-11-17)

- **PASS:** source review, route/footer/settings integration inspection, `git diff --check`, JSON parsing, and the production dependency audit (`npm audit --package-lock-only --ignore-scripts --omit=dev --audit-level=high`) completed; the production audit reported 0 vulnerabilities.
- **FAIL:** the complete dependency audit reported 21 development-tool findings (8 high, 13 moderate), primarily in Newman's transitive Postman runtime. No forced breaking downgrade was applied.
- **BLOCKED:** lint, ESLint, architecture, dependency-cruiser, documentation verification, unit tests, Node regression tests, typecheck, build, Chromium legal-page tests, and Linux-only audit validators cannot be run under the required isolation on this native Windows host. Docker and WSL are unavailable.
- **CI prepared, not executed:** `.github/workflows/legal-compliance-verification.yml` installs without lifecycle scripts, audits dependencies, and runs target-controlled verification inside a read-only, network-disabled, resource-bounded Linux Playwright container. It requires a committed remote revision; this task did not commit, push, or deploy.


# 07. Testing Strategy & Verification Guide

## 1. Testing Architecture & Verification Matrix

Connect2Code implements a multi-tiered, production-grade verification strategy:

1. **Vitest + React Testing Library** (`npm run test:unit`):
   - Fast, in-memory JSDOM component rendering and unit tests for UI components, hooks, security sanitizers, and Redux logic.
   - Configured via [`vitest.config.ts`](../../vitest.config.ts) and [`src/test/setup.ts`](../../src/test/setup.ts).
2. **Playwright E2E Suite** (`npm run test:e2e`):
   - Chromium-driven end-to-end browser tests verifying landing page rendering, brand assets, SPA navigation, and 404 error boundaries against live preview servers.
   - Configured via [`playwright.config.ts`](../../playwright.config.ts) and [`e2e/landing-and-navigation.spec.ts`](../../e2e/landing-and-navigation.spec.ts).
3. **Newman API Contract Test Runner** (`npm run test:api`):
   - Postman CLI collection runner executing real HTTP contract assertions against the live backend (`https://api.connect2code.in/api/v1`).
   - Defined in [`postman/connect2code-api-contracts.postman_collection.json`](../../postman/connect2code-api-contracts.postman_collection.json).
4. **Node.js Regression Test Runner** (`npm test`):
   - Native `node:test` regression runner executing 438 deep contract tests across 25 suites in `scripts/tests/`.
5. **Dependency & Architecture Validation** (`npm run depcruise`):
   - `dependency-cruiser` enforcing 0 circular dependencies, strict module boundaries, and central `apiClient` isolation.
   - Configured via [`.dependency-cruiser.cjs`](../../.dependency-cruiser.cjs).
6. **Knip Dead Code & Dependency Analysis** (`npm run knip`):
   - Analyzes unused files, dead exports, duplicate exports, and unlisted dependencies.
   - Configured via [`knip.json`](../../knip.json).
7. **Static Code Analysis** (`npm run lint`, `npm run lint:eslint`):
   - Dual-engine linting with Oxlint for ultra-fast checks and ESLint v9 (`eslint.config.mjs`) + TypeScript-ESLint for comprehensive React and TypeScript rules.
8. **Security & Vulnerability Auditing**:
   - Gitleaks (`gitleaks detect --source .`): automated secret detection across git commits.
   - OSV-Scanner (`osv-scanner --lockfile=package-lock.json`): vulnerability scanning for open-source dependencies.
   - Semgrep (`semgrep scan --config auto src/`): AST-level security and quality rule validation.

---

## 2. Test Suite Catalog (`scripts/tests/`)

| Suite File | Scope & Tested Contracts | Tests Count |
| :--- | :--- | :---: |
| [`adminQuestionUiContracts.test.mjs`](../../scripts/tests/adminQuestionUiContracts.test.mjs) | Admin question modal escape/retry behavior, saved-identity/cache transition before non-atomic test-case attachment, search pagination reset, truthful company-association controls, question/language-scoped runtime drafts, and live execution-limit/metric rendering. | 7 |
| [`apiClient.test.mjs`](../../scripts/tests/apiClient.test.mjs) | Base URL normalization, deployment safeguards, bearer-only authentication payload sanitization across JSON/form encodings, and bodyless DELETE behavior. | 22 |
| [`apiIntegration.test.mjs`](../../scripts/tests/apiIntegration.test.mjs) | Endpoint formats, strict list validation, structured DSA question-link summaries including null-company normalization, language mapping, execution verdict/diagnostic normalization, `isHidden: null` private-case masking, per-case metrics, payload bounds, unit-safe metrics, and truthful admin system labels. | 35 |
| [`assessmentIntegrity.test.mjs`](../../scripts/tests/assessmentIntegrity.test.mjs) | Global assessment shortcut restrictions and editor-local clipboard routing while preserving typing, undo, and Run/Submit shortcuts. | 3 |
| [`authContract.test.mjs`](../../scripts/tests/authContract.test.mjs) | Forced USER signup, bodyless Web-Locks-coordinated refresh, fail-safe behavior when locking/storage is unavailable, required identity and profile-field normalization, explicit public/protected request policy, 401/403/retry behavior, safe OAuth errors, stale-refresh/login ownership, submit-owned validation, missing-identity scoped logout cleanup, and no fabricated test fixtures. | 16 |
| [`authSession.test.mjs`](../../scripts/tests/authSession.test.mjs) | Memory-only session storage, response-role authorization without JWT decoding, immediate logout, unconditional startup restoration, stale-refresh rejection, navbar auth authority, and credential-free same-/cross-tab event validation. | 17 |
| [`batch4Remediation.test.mjs`](../../scripts/tests/batch4Remediation.test.mjs) | Error mapping, status codes (400-504), server leak detection (`org.springframework`, Hibernate). | 24 |
| [`batch6Governance.test.mjs`](../../scripts/tests/batch6Governance.test.mjs) | Route guards, storage boundaries, non-fabricated server bookmark timestamps, authoritative empty progress, bookmark/progress/profile failure behavior, modal accessibility, and cross-user stale Redux responses. | 39 |
| [`companyLogos.test.mjs`](../../scripts/tests/companyLogos.test.mjs) | API-logo HTTPS/public-host validation and priority, bundled asset presence/reachability, canonical aliases, legal-suffix normalization, domain validation, provider ordering, and monogram fallback. | 13 |
| [`companyResilience.test.mjs`](../../scripts/tests/companyResilience.test.mjs) | Company fallbacks, stale-error isolation, all-page company-question retrieval, preserved company-ID filtering, mutation error propagation, and full test case retrieval. | 19 |
| [`dsaSheetSlice.test.mjs`](../../scripts/tests/dsaSheetSlice.test.mjs) | DSA sheet request ownership, selection, filters, and stale-response protection. | 14 |
| [`googleOAuthLifecycle.test.mjs`](../../scripts/tests/googleOAuthLifecycle.test.mjs) | Google OAuth, Redux auth lifecycle, single-flight refresh, open-redirect prevention. | 14 |
| [`institutionManagement.test.mjs`](../../scripts/tests/institutionManagement.test.mjs) | AISHE uppercase transforms, university affiliation logic, status toggle. | 9 |
| [`mcqCorrectOption.test.mjs`](../../scripts/tests/mcqCorrectOption.test.mjs) | Option-level `isCorrect: true/false`, stale-field rejection, list-without-options detail fetching, reuse of complete list rows, and aptitude category parsing. | 9 |
| [`metadataAndBranding.test.mjs`](../../scripts/tests/metadataAndBranding.test.mjs) | Default head-tag uniqueness, icon/manifest dimensions, complete route metadata coverage, indexing policy, centralized title ownership, and dynamic detail overrides. | 6 |
| [`metadataCrawler.test.mjs`](../../scripts/tests/metadataCrawler.test.mjs) | Server-rendered crawler document escaping and uniqueness, absolute canonical origin policy, private-route noindex behavior, dynamic API identity rejection, and Vercel crawler/private-route routing configuration. | 6 |
| [`monacoBundling.test.mjs`](../../scripts/tests/monacoBundling.test.mjs) | Same-origin lazy Monaco bundling and worker/CSP ownership. | 1 |
| [`problemExecution.test.mjs`](../../scripts/tests/problemExecution.test.mjs) | Java class renaming (`Solution` -> `Main`), result normalization, language ID/reference-ID resolution, editor/compiler diagnostics, and hook cancellation lifecycle. | 17 |
| [`problemSliceAbortRecovery.test.mjs`](../../scripts/tests/problemSliceAbortRecovery.test.mjs) | Request ownership, abort recovery, cache retention, Strict Mode remount behavior. | 14 |
| [`questionsPaginationResilience.test.mjs`](../../scripts/tests/questionsPaginationResilience.test.mjs) | Real pagination metadata, strict row identity/title, mixed-page rejection, detail/save identity checks, production-grade optional-field normalization, and problem-service propagation. | 12 |
| [`referenceLibraryManagement.test.mjs`](../../scripts/tests/referenceLibraryManagement.test.mjs) | Central reference endpoints, strict DTO validation, direct list-owned platform logos without a duplicate QPF request, admin-only mutations, shared taxonomy state, dynamic exam taxonomy, transport ownership guards, semantic save naming, envelope/bodyless-204 hard-delete success, hard-delete confirmation, and guarded routing. | 14 |
| [`taskRemediationVerification.test.mjs`](../../scripts/tests/taskRemediationVerification.test.mjs) | Problem mapping, canonical token storage, authoritative admin editing, generation-owned pagination, ref-synchronized manual selection, per-question/language draft restoration, and stable initial MCQ requests. | 14 |
| [`userInfoProfile.test.mjs`](../../scripts/tests/userInfoProfile.test.mjs) | Academic/personal profile contracts including `collegeName` normalization, requested-user identity repair, gender/date/institution save fields, business-only service payloads, all-page company loading, and numeric-only company-exam request gating. | 28 |
| [`validationArchitecture.test.mjs`](../../scripts/tests/validationArchitecture.test.mjs) | Zod schemas and backend error/security sanitization, including compiler-service URL/IP suppression. | 25 |
| [`uxInteractionContracts.test.mjs`](../../scripts/tests/uxInteractionContracts.test.mjs) | Skeleton transitions, shared API-backed coding-question listing, static CodeChef-style company wordmarks, stale-request cancellation, scoped theme migration, server-owned pagination/filter contracts, duplicate-submit guards, DSA carousel motion/tab-order semantics, Lucide result icons, stable auth-dialog focus, modal/row keyboard behavior, isolated editor clipboard, secure mode, authenticated feature mounting, public SSR hub contracts, numeric company-exam sequencing, viewport-locked responsive problem splitters, responsive toast placement, and deployment-header contracts. | 33 |
| **Current declared total** | **All 25 test files** | **430 tests; latest full run passed (430/430) on 2026-11-16.** |

---

## 3. ESM Loader Hook Strategy

The Node test suites run directly against TypeScript source files using in-memory ESM loader hooks:
```js
// Example hook pattern in scripts/tests/*.test.mjs
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ ... }), isCancel: () => false };')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;
register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));
```
This enables unit testing real TypeScript source code with zero transpilation delay.

---

## 4. Verification Check Commands

Run all checks in sequence to verify code health:

### 1. Dual-Engine Linting
```bash
npm run lint          # Oxlint (210 files, 0 errors, 0 warnings)
npm run lint:eslint   # ESLint + TypeScript ESLint (strict type-safe clean style)
```

### 2. Architecture & Dependency Boundary Check
```bash
npm run depcruise     # dependency-cruiser (zero circular dependencies, 194 modules)
```

### 3. Static Typecheck
```bash
npm run typecheck     # tsc -p tsconfig.json --noEmit (0 errors)
```

### 4. Unit & Component Tests
```bash
npm run test:unit     # Vitest + React Testing Library (17 suites, 75 passing unit/component tests)
```

### 5. Regression Contract Test Suites
```bash
npm test              # Node test runner across scripts/tests/*.test.mjs (423/423 passing tests)
```

### 6. API Contract Integration Suite
```bash
npm run test:api      # Newman runner executing live contract assertions (--timeout-request 10000)
```

### 7. End-to-End Browser Tests
```bash
npm run test:e2e      # Playwright Chromium tests (4 specs, 13 passing browser flows)
```

### 8. Production Build & Smoke Test
```bash
npm run build
node scripts/smoke-preview.mjs
```

### 9. Documentation Integrity
```bash
node scripts/verify-documentation.mjs
```

## Legal and Compliance Contract Tests (2026-11-17)

[`legalCompliance.test.mjs`](../../scripts/tests/legalCompliance.test.mjs) statically verifies public policy/support route coverage, footer access, source-grounded privacy statements, absence of false DPDP/GDPR compliance claims, the documented reason no optional-cookie banner exists, the local-versus-server deletion boundary, metadata/prerender registration, and final external-URL boundaries.

[`legal-compliance.spec.ts`](../../e2e/legal-compliance.spec.ts) verifies all eight public pages in Chromium, footer navigation, mobile/desktop overflow, dark/light mode, keyboard focus, runtime tracking/cookie behavior, and authenticated account-scoped browser-data clearing. [`.github/workflows/legal-compliance-verification.yml`](../../.github/workflows/legal-compliance-verification.yml) runs the full verification set in a read-only, network-disabled Linux container with bounded CPU, memory, processes, file size, duration, and scratch storage.

The 2026-11-17 legal implementation audit did not execute target-controlled checks: the active security-audit workflow requires an OS-enforced no-network, read-only-target, scratch-only sandbox with explicit resource limits, which is unavailable on this native Windows host. Run the full verification command set in an approved Linux/WSL CI environment before release.

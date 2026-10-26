# 07. Testing Strategy & Verification Guide

## 1. Testing Architecture & Test Runner

Connect2Code uses the native **Node.js Test Runner** (`node:test` and `node:assert/strict`).
- **Command**: `npm test` (`node --test scripts/tests/*.test.mjs`)
- **Current verified run**: 314 tests passed, 0 failed on 2026-10-26.
- **Zero Heavy Harnesses**: Requires no Jest or Vitest installation overhead; executes directly using Node.js ESM loader hooks.

---

## 2. Test Suite Catalog (`scripts/tests/`)

| Suite File | Scope & Tested Contracts | Tests Count |
| :--- | :--- | :---: |
| [`apiClient.test.mjs`](../../scripts/tests/apiClient.test.mjs) | Base URL normalization, trimming slashes, localhost rejection in prod, default backend fallback. | 18 |
| [`apiIntegration.test.mjs`](../../scripts/tests/apiIntegration.test.mjs) | Endpoint formats, strict list response validation, DSA sheet ordering/token-compatible deletes, user-question validation, captured language DTO mapping/cache invalidation, question fallback discipline, custom-input payloads, and execution verdicts. | 25 |
| [`assessmentIntegrity.test.mjs`](../../scripts/tests/assessmentIntegrity.test.mjs) | Global assessment shortcut restrictions and editor-local clipboard routing while preserving typing, undo, and Run/Submit shortcuts. | 3 |
| [`authSession.test.mjs`](../../scripts/tests/authSession.test.mjs) | JWT claims, JWT-only admin authorization, logout, cookie-only storage, startup refresh gating, token-only refresh profile preservation, and cross-tab event validation. | 20 |
| [`batch4Remediation.test.mjs`](../../scripts/tests/batch4Remediation.test.mjs) | Error mapping, status codes (400-504), server leak detection (`org.springframework`, Hibernate). | 24 |
| [`batch6Governance.test.mjs`](../../scripts/tests/batch6Governance.test.mjs) | Route guards, storage boundaries, bookmark/progress/profile failure behavior, modal accessibility, and cross-user stale Redux responses. | 34 |
| [`companyLogos.test.mjs`](../../scripts/tests/companyLogos.test.mjs) | Bundled asset presence/reachability, canonical aliases, legal-suffix normalization, domain validation, provider ordering, and monogram fallback. | 12 |
| [`companyResilience.test.mjs`](../../scripts/tests/companyResilience.test.mjs) | Company fallbacks, canonical question contracts, mutation error propagation, and full test case retrieval. | 17 |
| [`dsaSheetSlice.test.mjs`](../../scripts/tests/dsaSheetSlice.test.mjs) | DSA sheet request ownership, selection, filters, and stale-response protection. | 12 |
| [`googleOAuthLifecycle.test.mjs`](../../scripts/tests/googleOAuthLifecycle.test.mjs) | Google OAuth, Redux auth lifecycle, single-flight refresh, open-redirect prevention. | 14 |
| [`institutionManagement.test.mjs`](../../scripts/tests/institutionManagement.test.mjs) | AISHE uppercase transforms, university affiliation logic, status toggle. | 9 |
| [`mcqCorrectOption.test.mjs`](../../scripts/tests/mcqCorrectOption.test.mjs) | Option-level `isCorrect: true/false` priority, exact admin update serialization, stale-field rejection, and aptitude category URL parsing. | 7 |
| [`metadataAndBranding.test.mjs`](../../scripts/tests/metadataAndBranding.test.mjs) | Default head-tag uniqueness, icon/manifest dimensions, complete route metadata coverage, indexing policy, centralized title ownership, and dynamic detail overrides. | 6 |
| [`metadataCrawler.test.mjs`](../../scripts/tests/metadataCrawler.test.mjs) | Server-rendered crawler document escaping and uniqueness, absolute canonical origin policy, private-route noindex behavior, dynamic API identity rejection, and Vercel crawler/private-route routing configuration. | 5 |
| [`problemExecution.test.mjs`](../../scripts/tests/problemExecution.test.mjs) | Java class renaming (`Solution` -> `Main`), result normalization, language ID/reference-ID resolution, editor/compiler diagnostics, and hook cancellation lifecycle. | 17 |
| [`problemSliceAbortRecovery.test.mjs`](../../scripts/tests/problemSliceAbortRecovery.test.mjs) | Request ownership, abort recovery, cache retention, Strict Mode remount behavior. | 14 |
| [`questionsPaginationResilience.test.mjs`](../../scripts/tests/questionsPaginationResilience.test.mjs) | Paginated question retrieval resilience, ordering, and partial-page recovery. | 13 |
| [`taskRemediationVerification.test.mjs`](../../scripts/tests/taskRemediationVerification.test.mjs) | Problem mapping, canonical token storage, authoritative admin editing, partial-save feedback, pagination semantics, and stable initial MCQ requests. | 10 |
| [`userInfoProfile.test.mjs`](../../scripts/tests/userInfoProfile.test.mjs) | Academic profile contracts, requested-user identity repair, exact `jwtToken` payloads, and all-page company loading. | 15 |
| [`validationArchitecture.test.mjs`](../../scripts/tests/validationArchitecture.test.mjs) | Zod schemas and backend error/security sanitization, including compiler-service URL/IP suppression. | 25 |
| [`uxInteractionContracts.test.mjs`](../../scripts/tests/uxInteractionContracts.test.mjs) | Skeleton transitions, stale-request cancellation, URL-backed catalogs, duplicate-submit guards, modal/row keyboard behavior, focus-safe controls, user-scoped drafts, and isolated editor clipboard contracts. | 14 |
| **Total** | **All 21 test files (99 reported suites)** | **314 / 314 Passing** |

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

### 1. Fast Linting
```bash
npm run lint
```
Runs `oxlint` across all files in `src/`. Expected: `Found 0 warnings and 0 errors.`

### 2. Static Typecheck
```bash
npm run typecheck
```
Executes `tsc -p tsconfig.json --noEmit`. Expected: Exits with code 0.

### 3. Test Suite
```bash
npm test
```
Executes all test files in `scripts/tests/`. Current verified result: `311 pass, 0 fail`.

### 4. Production Build
```bash
npm run build
```
Executes Vite production bundle build. Expected: Generates `dist/` bundle cleanly in ~1 second.

### 5. Preview Smoke Test
```bash
node scripts/smoke-preview.mjs
```
Spawns Vite preview server on `http://127.0.0.1:4173`, fetches critical routes (`/`, `/login`, `/practice`, `/problems/1`, `/companies/tcs`), and verifies that JS/CSS assets load with HTTP 200 without SPA HTML fallbacks. Set `C2C_SMOKE_PORT` to an unused port when 4173 is occupied; the harness uses Vite's strict-port mode so it never polls a different port than the one actually started.

### 6. Architecture Verification
```bash
npm run verify:architecture
```
Verifies no direct axios imports outside `apiClient.ts`, no direct fetch calls, no `Math.random()` in app code, and no local root `.env` file. The current workspace has an ignored developer `.env`, so this command reports that single policy failure; agents must not delete it without the owner's authorization.

### 7. Documentation Integrity
```bash
node scripts/verify-documentation.mjs
```
Validates all markdown links, referenced source file paths, and scans for unredacted credentials.

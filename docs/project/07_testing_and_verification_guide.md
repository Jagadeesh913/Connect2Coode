# 07. Testing Strategy & Verification Guide

## 1. Testing Architecture & Test Runner

Connect2Code uses the native **Node.js Test Runner** (`node:test` and `node:assert/strict`).
- **Command**: `npm test` (`node --test scripts/tests/*.test.mjs`)
- **Last verified baseline**: 421 tests passed, 0 failed on the current working tree on 2026-11-14.
- **Zero Heavy Harnesses**: Requires no Jest or Vitest installation overhead; executes directly using Node.js ESM loader hooks.

---

## 2. Test Suite Catalog (`scripts/tests/`)

| Suite File | Scope & Tested Contracts | Tests Count |
| :--- | :--- | :---: |
| [`adminQuestionUiContracts.test.mjs`](../../scripts/tests/adminQuestionUiContracts.test.mjs) | Admin question modal escape/retry behavior, saved-identity/cache transition before non-atomic test-case attachment, search pagination reset, truthful company-association controls, question/language-scoped runtime drafts, and live execution-limit/metric rendering. | 7 |
| [`apiClient.test.mjs`](../../scripts/tests/apiClient.test.mjs) | Base URL normalization, deployment safeguards, bearer-only authentication payload sanitization across JSON/form encodings, and bodyless DELETE behavior. | 22 |
| [`apiIntegration.test.mjs`](../../scripts/tests/apiIntegration.test.mjs) | Endpoint formats, strict list validation, structured DSA question-link summaries, language mapping, execution verdict/diagnostic normalization, `isHidden: null` private-case masking, per-case metrics, payload bounds, unit-safe metrics, and truthful admin system labels. | 34 |
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
| [`userInfoProfile.test.mjs`](../../scripts/tests/userInfoProfile.test.mjs) | Academic/personal profile contracts including `collegeName` normalization, requested-user identity repair, gender/date/institution save fields, business-only service payloads, and all-page company loading. | 22 |
| [`validationArchitecture.test.mjs`](../../scripts/tests/validationArchitecture.test.mjs) | Zod schemas and backend error/security sanitization, including compiler-service URL/IP suppression. | 25 |
| [`uxInteractionContracts.test.mjs`](../../scripts/tests/uxInteractionContracts.test.mjs) | Skeleton transitions, shared API-backed coding-question listing, static CodeChef-style company wordmarks, stale-request cancellation, scoped theme migration, server-owned pagination/filter contracts, duplicate-submit guards, DSA carousel motion/tab-order semantics, Lucide result icons, stable auth-dialog focus, modal/row keyboard behavior, isolated editor clipboard, secure mode, authenticated feature mounting, viewport-locked responsive problem splitters, responsive toast placement, and deployment-header contracts. | 32 |
| **Current declared total** | **All 25 test files** | **421 tests; latest full run passed (421/421) on 2026-11-14.** |

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
Executes all test files in `scripts/tests/`. Do not copy the historical baseline into a remediation report; record the fresh result from the final tree.

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
Verifies no direct axios imports outside `apiClient.ts`, no direct fetch calls, no `Math.random()` in app code, and no local root `.env` file. A root `.env` causes a policy failure and must not be deleted without the owner's authorization. The verified 2026-11-04 run passed with no root `.env` present.

### 7. Documentation Integrity
```bash
node scripts/verify-documentation.mjs
```
Validates all markdown links, referenced source file paths, and scans for unredacted credentials.

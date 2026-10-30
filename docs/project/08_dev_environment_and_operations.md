# 08. Development Environment & Operational Procedures

## 1. Prerequisites & Tooling Requirements

- **Node.js**: `v22.x` (Active LTS). Recommended `22.x` as tested in CI.
- **Package Manager**: `npm` `v10.x` or higher.
- **Git**: Working tree cleanliness required before changes.
- **Operating System**: Cross-platform (Windows, Linux, macOS).

---

## 2. Environment Configuration

### Files
- [`.env.example`](../../.env.example): Checked into git. Reference template for required configuration keys.
- [`.env.production`](../../.env.production): Checked into git. Production deployment configuration.
- `.env`: Ignored by git in `.gitignore`. Local environment override.

### Environment Variable Contract

| Variable Name | Default / Production Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://api.connect2code.in/api/v1` | Root API base URL targeting the remote Spring Boot backend. |
| `VITE_APP_NAME` | `Connect 2 Code` | Platform application name display. |
| `VITE_SITE_URL` | `https://connect2code.in` (required in Vercel Production) | Canonical frontend origin used by client metadata and build-generated pages. Set the apex HTTPS origin exactly; never use a Vercel preview URL or include a path/trailing slash. |
| `VITE_BRANDFETCH_CLIENT_ID` | Empty (optional) | Public Brandfetch client ID used for domain-derived company logos after bundled assets. When omitted, the cascade continues with Simple Icons, the official-site favicon, and a deterministic monogram. Never put a secret key in a `VITE_` variable. |
| `VITE_SHOW_COMING_SOON` | `true` (defaults to true) | Feature flag routing unimplemented routes (`/interviews`, `/roadmaps/:slug`) to `<ComingSoon />`. Set to `false` to preview draft implementations. |

> [!IMPORTANT]
> **Production Environment Safeguard**:
> In deployed production builds, `src/core/api/apiClient.ts` strictly rejects `localhost`, `127.0.0.1`, or relative paths without host, falling back to `https://api.connect2code.in/api/v1` to ensure static hosting resilience. In local development or preview mode, relative paths (e.g. `/api/v1` for the Vite proxy) and local development backends (e.g. `http://localhost:8080/api/v1`) are fully supported.


---

## 3. Local Development Server & Proxying

### Starting Development Server
```bash
npm run dev
```
Launches Vite development server on `http://localhost:5173/`.

### Proxy Configuration (`vite.config.ts`)
To prevent CORS preflight friction during local browser debugging, `vite.config.ts` configures development proxy rules:
```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'https://api.connect2code.in',
      changeOrigin: true,
      secure: false,
      headers: { Origin: 'https://api.connect2code.in' },
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('Origin', 'https://api.connect2code.in');
        });
      },
    },
    '/oauth2': {
      target: 'https://api.connect2code.in',
      changeOrigin: true,
      secure: false,
      headers: { Origin: 'https://api.connect2code.in' },
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('Origin', 'https://api.connect2code.in');
        });
      },
    }
  }
}
```

---

## 4. Production Deployment & Edge Routing (`vercel.json`)

Connect2Code is configured for deployment on Vercel or any SPA static web host.

[`vercel.json`](../../vercel.json) defines edge proxy rewrites, prerender routing, permanent alias redirects, and an explicit valid-route allowlist:
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.connect2code.in/api/:path*"
    },
    {
      "source": "/refresh",
      "destination": "https://api.connect2code.in/api/v1/auth/refresh"
    },
    {
      "source": "/auth/refresh",
      "destination": "https://api.connect2code.in/api/v1/auth/refresh"
    },
    {
      "source": "/oauth2/:path*",
      "destination": "https://api.connect2code.in/oauth2/:path*"
    },
    {
      "source": "/problems/:slug",
      "destination": "/app"
    }
  ]
}
```
- **Public prerendering**: `npm run build` runs Vite and then [`scripts/generate-seo-assets.mjs`](../../scripts/generate-seo-assets.mjs). It emits meaningful route-specific documents for `/`, `/practice`, `/dsa-sheet`, `/companies`, and `/aptitude`, plus `sitemap.xml`, `app.html`, and `404.html`. The output is identical for browsers and crawlers; no User-Agent routing remains.
- **Deep links and real 404s**: Static public hubs resolve through Vercel clean URLs. Every other valid React route is explicitly rewritten to the noindex `/app` shell. With no global SPA catch-all, any path outside the allowlist falls through to generated `404.html` and Vercel's HTTP 404 behavior. Keep the allowlist synchronized with `src/routes/appRoutes.tsx`.
- **Edge proxy**: Rewrites `/api/*` and `/oauth2/*` directly to `https://api.connect2code.in`; refresh and OAuth callback paths retain their existing dedicated rules.
- **Canonical and social metadata**: All generated public documents contain the apex canonical and absolute social image URLs before JavaScript loads. After React mounts, `RouteMetadata` continues to reconcile metadata on navigation using `VITE_SITE_URL`.
- **Indexing protection**: Route-specific `X-Robots-Tag` headers and the noindex app shell cover login, callback, authenticated, admin, authenticated API-backed detail, coming-soon, and error routes. Dynamic entity routes are intentionally absent from the sitemap because their current API contracts require authentication; a build must not receive user credentials or invent entity slugs.
- **Browser hardening**: global deployment headers deny framing, object embedding, in-page display capture, camera/microphone/geolocation/payment/USB access, MIME sniffing, and insecure transport downgrade. `same-origin-allow-popups` is retained so the verified Google OAuth popup flow can continue to communicate with its opener.

> [!IMPORTANT]
> In Vercel Project Settings → Environment Variables, set `VITE_SITE_URL=https://connect2code.in` for **Production**. Keep `VITE_API_BASE_URL=https://api.connect2code.in/api/v1`. Redeploy only after the deployment owner reviews the build. The repository pins the same apex value in `.env.production`, preventing preview request hosts from becoming canonical, but the Vercel Production variable remains required as an explicit provider contract.

The exact sitemap URL after deployment is `https://connect2code.in/sitemap.xml`. The deployment owner must verify the apex domain assignment, HTTPS certificate, `www` → apex redirect, generated route statuses/headers, and sitemap response from Vercel before adding the property to Google Search Console.

### Secure Assessment Deployment Boundary

The public web application provides deterrence only: event cancellation, editor-local clipboard isolation, focus/visibility protection, print suppression, and an optional fullscreen/keyboard-lock secure mode. Developer Tools remain available. A page cannot enumerate or disable browser extensions, prevent an operating-system screenshot, or stop a modified client.

For high-stakes assessments, deploy the site through one of these controlled environments:

1. If a future assessment policy requires stronger lockdown, use a managed Chrome/ChromeOS fleet with extension installation blocklisted except an explicit allowlist, guest/incognito access disabled, and the Connect2Code origin allowlisted. DevTools policy must follow the current product requirement; the web client deliberately allows it.
2. Safe Exam Browser or an equivalent kiosk client configured with private clipboard, screen capture disabled, application/process switching restricted, and the assessment origin pinned.
3. Server-side exam sessions that record focus/fullscreen violations, enforce attempt windows and submission ownership, rate-limit execution, and invalidate compromised sessions. No verified telemetry endpoint currently exists in this frontend contract, so the client does not fabricate one.

---

## 5. Continuous Integration Pipeline (`frontend-ci.yml`)

The GitHub Actions workflow [`.github/workflows/frontend-ci.yml`](../../.github/workflows/frontend-ci.yml) executes on every push and pull request to `main`:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: 22, cache: 'npm' }
  - run: npm ci
  - run: npm run lint
  - run: npm run verify:architecture
  - run: npm run verify:docs
  - run: npm audit --audit-level=high
  - run: npm test
  - run: npx --yes -p typescript@5.9.3 tsc -p tsconfig.json --noEmit
  - run: npm run build
  - run: node scripts/smoke-preview.mjs
```

The smoke harness defaults to port 4173. Local runs may set `C2C_SMOKE_PORT` to another available port; strict-port startup prevents false timeouts caused by Vite silently selecting a different port.

### Operational Note on `.env` in Local vs CI
- `npm run verify:architecture` checks if a `.env` file exists and fails if found.
- In CI, `.env` does not exist (not tracked in git), so CI passes.
- In local development, if you need to run `verify:architecture`, temporarily rename `.env` or run tests with `npm test`.

## 6. Documentation and Performance Evidence

- `npm run verify:docs` runs `scripts/verify-documentation.mjs`. It is required in CI and validates the canonical `AGENTS.md` plus `docs/project/` links, repository-path references, and common unredacted-secret patterns.
- The 2026-10-24 production build completed successfully after the dependency/API-state audit and Zod 4 security migration. Its Vite entry bundle was **464.34 kB / 134.19 kB gzip**; route modules remain lazy-loaded. The largest route/support chunks observed were `AdminModal` (**131.54 kB / 43.20 kB gzip**, including Framer Motion and loaded only by admin routes), `AdminQuestions` (**68.05 kB / 14.99 kB gzip**), and `ProblemDetails` (**58.17 kB / 12.27 kB gzip**; Monaco itself is loaded by its wrapper at runtime). These are build artifacts, not a load-capacity result.

### 5,000-Concurrent-User Evaluation Plan

No backend deployment, database metrics, or authorized non-production load environment is available in this repository. Do not load-test the production API. Before making a capacity claim, run a reproducible test against an approved staging environment with production-like authentication, database, Judge0, and rate-limit settings:

1. Establish baseline p50/p95/p99 latency, error rate, CPU, memory, database connection/pool saturation, and downstream Judge0 latency at 100 virtual users.
2. Ramp 100 → 500 → 1,000 → 2,500 → 5,000 users with a documented mixed workload: static route fetches, paginated problem/company reads, authenticated bookmarks/profile reads, and a tightly capped code-execution fraction.
3. Keep mutating and code-execution requests idempotent-safe or isolated to disposable test accounts. Stop immediately on sustained error-rate, saturation, or data-integrity thresholds agreed with infrastructure owners.
4. Record the exact runner version, scenario, staging revision, backend/database sizing, observed metrics, and bottleneck/remediation decision. Only that evidence can support a 5,000-concurrent-user claim.

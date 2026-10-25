import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const host = '127.0.0.1';
const port = Number(process.env.C2C_SMOKE_PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('C2C_SMOKE_PORT must be a valid TCP port number.');
}
const baseUrl = `http://${host}:${port}`;
const routes = ['/', '/login', '/practice', '/problems/1', '/companies/tcs'];

const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const stop = () => {
  if (!server.killed) {
    server.kill('SIGTERM');
  }
};

let exitCode = 0;

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetchWithTimeout(baseUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}

    await delay(500);
  }

  if (!ready) {
    throw new Error(`Vite preview did not become ready.\n${output}`);
  }

  const verifiedAssets = new Set();

  for (const route of routes) {
    const response = await fetchWithTimeout(`${baseUrl}${route}`);
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`Route ${route} returned HTTP ${response.status}`);
    }

    if (!body.includes('<!doctype html>') && !body.includes('<!DOCTYPE html>')) {
      throw new Error(`Route ${route} did not return the built SPA HTML document`);
    }

    if (!body.includes('id="root"')) {
      throw new Error(`Route ${route} missing #root mounting container`);
    }

    // Extract and verify referenced JS/CSS bundle assets
    const assetMatches = body.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g);
    for (const match of assetMatches) {
      const assetPath = match[1];
      if (!verifiedAssets.has(assetPath)) {
        const assetResponse = await fetchWithTimeout(`${baseUrl}${assetPath}`);
        if (!assetResponse.ok) {
          throw new Error(`Referenced asset ${assetPath} failed to load (HTTP ${assetResponse.status})`);
        }
        const assetContent = await assetResponse.text();
        if (assetContent.startsWith('<!doctype') || assetContent.startsWith('<!DOCTYPE')) {
          throw new Error(`Referenced asset ${assetPath} returned SPA HTML fallback instead of static asset bundle`);
        }
        verifiedAssets.add(assetPath);
      }
    }
  }

  if (verifiedAssets.size === 0) {
    throw new Error('No JS/CSS bundle assets were detected in preview HTML documents');
  }

  console.log(`Preview smoke test passed for ${routes.length} routes and ${verifiedAssets.size} verified assets.`);
} catch (error) {
  exitCode = 1;
  console.error(error instanceof Error ? error.message : error);
} finally {
  stop();
  await delay(200);
  process.exit(exitCode);
}

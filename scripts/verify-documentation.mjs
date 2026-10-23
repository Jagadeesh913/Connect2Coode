import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const root = process.cwd();
const docFiles = [
  'AGENTS.md',
  'docs/project/01_project_overview.md',
  'docs/project/02_architecture_and_conventions.md',
  'docs/project/03_routing_roles_and_journeys.md',
  'docs/project/04_ui_design_and_components.md',
  'docs/project/05_api_contracts_and_security.md',
  'docs/project/06_state_management_and_data_flow.md',
  'docs/project/07_testing_and_verification_guide.md',
  'docs/project/08_dev_environment_and_operations.md',
  'docs/project/09_known_issues_and_decisions.md',
  'docs/project/10_file_coverage_and_verification_status.md',
];

const failures = [];
let totalReferencesChecked = 0;

console.log('Verifying documentation system integrity...');

// 1. Verify existence of all canonical documentation files
for (const relPath of docFiles) {
  const fullPath = join(root, relPath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing canonical documentation file: ${relPath}`);
  }
}

// 2. Scan each documentation file for internal links, source code paths, and secrets
for (const relPath of docFiles) {
  const fullPath = join(root, relPath);
  if (!existsSync(fullPath)) continue;

  const content = readFileSync(fullPath, 'utf8');
  const docDir = dirname(fullPath);

  // Link validation: [text](target)
  const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const rawTarget = match[2].trim();

    // Skip anchor-only links or external web links
    if (rawTarget.startsWith('#') || rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
      continue;
    }

    totalReferencesChecked += 1;

    // Handle file:/// absolute file links
    if (rawTarget.startsWith('file:///')) {
      let cleaned = rawTarget.replace(/^file:\/\/\/?/, '');
      // Handle Windows drive paths like c:/Users/...
      if (/^[a-zA-Z]:\//.test(cleaned)) {
        cleaned = resolve(cleaned);
      } else {
        cleaned = resolve('/', cleaned);
      }

      if (!existsSync(cleaned)) {
        failures.push(`[${relPath}] Broken file URI reference: ${rawTarget}`);
      }
      continue;
    }

    // Handle relative markdown links (e.g. ./02_architecture_and_conventions.md or ../api/README.md)
    const targetWithoutAnchor = rawTarget.split('#')[0];
    if (targetWithoutAnchor) {
      const resolvedTarget = resolve(docDir, targetWithoutAnchor);
      if (!existsSync(resolvedTarget)) {
        failures.push(`[${relPath}] Broken relative link: "${rawTarget}" -> target does not exist at ${resolvedTarget}`);
      }
    }
  }

  // Source path reference validation: backticked paths like `src/core/api/apiClient.ts`
  const backtickMatches = content.matchAll(/`((?:src|scripts|docs|public)\/[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`/g);
  for (const match of backtickMatches) {
    const sourceRef = match[1];
    // Ignore wildcards or regexes
    if (sourceRef.includes('*') || sourceRef.includes('?')) continue;

    totalReferencesChecked += 1;
    const resolvedPath = join(root, sourceRef);
    if (!existsSync(resolvedPath)) {
      failures.push(`[${relPath}] Referenced repository path does not exist: "${sourceRef}"`);
    }
  }

  // Secret leak check: flag unredacted secret patterns
  const secretPatterns = [
    { label: 'Unredacted Bearer token', pattern: /Bearer\s+eyJ[a-zA-Z0-9\-_]{20,}/ },
    { label: 'Unredacted private key', pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/ },
    { label: 'Hardcoded password string', pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/i },
  ];

  for (const rule of secretPatterns) {
    if (rule.pattern.test(content)) {
      failures.push(`[${relPath}] Potential secret exposure detected: ${rule.label}`);
    }
  }
}

if (failures.length > 0) {
  console.error('\nDocumentation verification FAILED with errors:');
  for (const err of failures) {
    console.error(`- ${err}`);
  }
  process.exitCode = 1;
} else {
  console.log(`\nDocumentation integrity verification PASSED!`);
  console.log(`- ${docFiles.length} canonical documentation files verified.`);
  console.log(`- ${totalReferencesChecked} internal links and source references validated.`);
  console.log(`- 0 broken links, 0 invalid paths, 0 secret exposures detected.`);
}

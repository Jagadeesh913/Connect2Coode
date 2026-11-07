import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Monaco is bundled locally in every lazy editor and never depends on the blocked jsDelivr loader', async () => {
  const editorConsumers = [
    'src/features/problems/pages/ProblemDetails.tsx',
    'src/features/admin/components/questions/AdminCodeTestModal.tsx',
    'src/features/admin/components/dashboard/DashboardCodeRunner.tsx',
  ];
  const [packageJsonSource, mainSource, environmentSource, vercelSource, ...consumerSources] = await Promise.all([
    read('package.json'),
    read('src/main.tsx'),
    read('src/core/editor/monacoEnvironment.ts'),
    read('vercel.json'),
    ...editorConsumers.map(read),
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.equal(packageJson.dependencies?.['monaco-editor'], '0.55.1');
  assert.doesNotMatch(
    mainSource,
    /monacoEnvironment/,
    'Monaco must stay inside lazy editor chunks rather than the application entry bundle'
  );
  consumerSources.forEach((source, index) => {
    assert.match(
      source,
      /import ['"][./]+core\/editor\/monacoEnvironment['"]/, 
      `${editorConsumers[index]} must configure the same-origin Monaco loader before rendering Editor`
    );
  });
  assert.match(environmentSource, /import \* as monaco from ['"]monaco-editor['"]/);
  assert.match(environmentSource, /editor\.worker\?worker/);
  assert.match(environmentSource, /ts\.worker\?worker/);
  assert.match(environmentSource, /loader\.config\(\{ monaco \}\)/);
  assert.doesNotMatch(environmentSource, /https:\/\/cdn\.jsdelivr\.net/);
  assert.match(vercelSource, /script-src 'self'/);
  assert.match(vercelSource, /worker-src 'self' blob:/);
});

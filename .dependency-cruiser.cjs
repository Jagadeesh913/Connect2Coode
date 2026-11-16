/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies degrade maintainability and cause runtime initialization bugs.',
      from: { path: '^src' },
      to: { circular: true },
    },
    {
      name: 'no-direct-axios',
      severity: 'error',
      comment: 'Direct axios imports bypass the central bearer token handler and security interceptors in apiClient.',
      from: { path: '^src', pathNot: '^src/core/api/apiClient\\.ts$' },
      to: { dependencyTypes: ['npm'], path: '^axios$' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};

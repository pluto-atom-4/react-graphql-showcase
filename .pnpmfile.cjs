// Pin the JS-API `typescript` seen by typescript-eslint to the JS-API-compatible
// @typescript/typescript6 package while the workspace `typescript` is 7.x.
// typescript-eslint <=8.70 caps typescript at <6.1.0 and needs the TS JS API,
// which TS 7 no longer exposes via require('typescript').
// REMOVE once typescript-eslint supports TypeScript 7.
const TS_JS_API = 'npm:@typescript/typescript6@6.0.2';
const NEEDS_JS_API = new Set([
  '@typescript-eslint/typescript-estree',
  '@typescript-eslint/project-service',
  '@typescript-eslint/tsconfig-utils',
  '@typescript-eslint/type-utils',
  '@typescript-eslint/utils',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  'typescript-eslint',
  'ts-api-utils',
]);

function readPackage(pkg) {
  if (NEEDS_JS_API.has(pkg.name) && pkg.peerDependencies && pkg.peerDependencies.typescript) {
    delete pkg.peerDependencies.typescript;
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript;
    pkg.dependencies = { ...(pkg.dependencies || {}), typescript: TS_JS_API };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };

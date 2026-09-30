import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function verify(overrides = {}) {
  return spawnSync(process.execPath, ['scripts/verify-production-runtime.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      VITE_CONVEX_URL: 'https://dependable-coyote-77.eu-west-1.convex.cloud',
      VITE_CONVEX_SITE_URL: 'https://dependable-coyote-77.eu-west-1.convex.site',
      ...overrides,
    },
  });
}
test('accepts the approved EU production endpoints', () => {
  assert.equal(verify().status, 0);
});
test('rejects a build without a backend', () => {
  assert.notEqual(verify({ VITE_CONVEX_URL: '' }).status, 0);
});
test('rejects a development or US deployment', () => {
  for (const url of ['https://agreeable-mosquito-750.eu-west-1.convex.cloud', 'https://ardent-wildebeest-851.convex.cloud']) {
    assert.notEqual(verify({ VITE_CONVEX_URL: url }).status, 0);
  }
});
test('rejects mismatched auth endpoints', () => {
  assert.notEqual(verify({ VITE_CONVEX_SITE_URL: 'https://agreeable-mosquito-750.eu-west-1.convex.site' }).status, 0);
});

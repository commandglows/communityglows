import { appendFileSync } from 'node:fs';

const expected = {
  VITE_CONVEX_URL: 'https://dependable-coyote-77.eu-west-1.convex.cloud',
  VITE_CONVEX_SITE_URL: 'https://dependable-coyote-77.eu-west-1.convex.site',
};
for (const [name, value] of Object.entries(expected)) {
  if (process.env[name] !== value) {
    throw new Error(`${name} must target the approved CommunityGlows EU production deployment.`);
  }
}
if (process.argv.includes('--github-env')) {
  if (!process.env.GITHUB_ENV) throw new Error('GITHUB_ENV is required.');
  appendFileSync(process.env.GITHUB_ENV, Object.entries(expected).map(([name, value]) => `${name}=${value}\n`).join(''));
}
console.log('CommunityGlows EU production runtime configuration verified.');

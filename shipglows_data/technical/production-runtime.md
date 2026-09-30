# CommunityGlows production runtime

## Environment decisions — 2026-09-07

- Production: `diane-defores:communityglows:production`, EU `eu-west-1`.
- Backend: `https://dependable-coyote-77.eu-west-1.convex.cloud`.
- Auth issuer: `https://dependable-coyote-77.eu-west-1.convex.site`.
- Doppler: `communityglows/prd`; ordinary local development keeps `communityglows/dev`.
- No development data, accounts or sessions imported. Existing deployments preserved.
- Convex Auth retained. No Auth0 migration is authorized by this rollout.
- UI authentication stays behind the existing `useAuth`/`convexAuth` boundary; domain records use internal user IDs. This boundary reduces coupling but does not make a provider migration automatic.

## Provisioning and CI

Production has independently generated JWT signing keys stored in Convex environment variables. Keys were transferred through stdin without files or log output. Password authentication does not require a redirect `SITE_URL`.

GitHub Actions has a read-only Doppler token scoped to `communityglows/prd` and a Convex deploy key scoped to the EU deployment. Frontend build jobs use the shared `production-runtime` action, which exposes only the two public Convex URLs as build environment variables. The verifier rejects missing endpoints, development endpoints and the prepared US deployment.

Backend deployment remains manually dispatched from `main` with `DEPLOY` confirmation. It validates the deploy-key target and runs Convex typechecking. No installer release workflow was dispatched during initial provisioning.

## Evidence and limits

- Functions and schema deployed successfully to EU production with TypeScript checking enabled.
- Real production API smoke passed: unauthorized access rejected; password signup/sign-in; authenticated identity; protected settings write/read; token refresh; sign-out. The generated test account and its auth/settings records were removed afterwards.
- Backend suite: 44 tests passed. Frontend auth-client suite: 10 tests passed.
- Production frontend build through Doppler passed.
- These checks do not prove native Windows, Android or browser-extension login, installation, session recovery or commercial entitlements.
- The CommandGlows billing bridge is a separate service dependency; initial auth provisioning does not establish checkout/subscription readiness.
- Initial deployment used the current local backend source, including pre-existing workspace/schema changes. Git delivery must preserve unrelated concurrent work.

## Next validation

Run real native sign-in and protected synchronization, restart/session recovery and sign-out on the intended Windows and Android packages and the browser extension. Keep historical Windows auth bugs open until their corresponding native proof passes.

## Native Windows checkpoint — 2026-09-08

- Local production build succeeded after routing nested pnpm invocations through Corepack and adding the installed Cargo directory to the build process PATH. MSI and NSIS installers were generated.
- Executable SHA-256: `e1ecd8fe0d4336f3bf7123a7cb1b5be017e657887d781171cb06df9e252de3fb`.
- Registered in the official Windows Local artifact lane; shortcut: `ShipGlows - communityglows - Windows - Local`.
- A separate WebView2 profile and a disposable production account were used. The actual release executable accepted password login, completed cloud hydration and preserved authentication after process restart.
- Full product access FAILED: the UI displays `Accès impossible à vérifier`. The live `https://www.commandglows.com/api/bridge/communityglows` endpoint returns HTTP 503, `communityglows_bridge_not_configured`.
- CommandGlows production environment metadata has `SUITE_BRIDGE_CONVEX_SECRET`, but neither dedicated CommunityGlows bridge-secret name is configured. `SUITE_TRIAL_SIGNAL_SECRET` and `COMMUNITYGLOWS_ACCOUNT_RETENTION_SECRET` are also absent. No CommandGlows environment or deployment was changed.
- Completing this integration requires a coordinated CommandGlows production configuration/redeployment and a protected-access retest. Do not disable the product-access gate or grant local fallback entitlements.
- The disposable test account and its auth/product records were removed. The managed development server was restored on port 3006.
- GitHub secrets are provisioned; the revised CI files remain local and uncommitted. No release workflow was dispatched. Android and extension production proof remain outstanding.

## Bridge revalidation — 2026-09-08

After the operator reported a correction, live checks superseded the earlier bridge-blocked finding:

- The public bridge rejects requests without the shared secret with HTTP 401, instead of the former configuration HTTP 503.
- A disposable password account on CommunityGlows EU production successfully called `billing:getProductAccess`: `status=active`, `accessState=trial_active`, `legacyFallback=false`.
- A repeated access request remained active with the same trial end time.
- The normal authenticated `accountDeletion:deleteMyAccount` flow succeeded, including its CommandGlows bridge call, and removed the disposable account.
- No provider configuration was changed during this revalidation.
- A fresh Git fetch confirmed that the revised CI/action files remain unpublished. Remote `convex-deploy.yml` still targets `master` although the repository default branch is `main`.
- This verifies the production backend integration. Native protected-app access after the correction, Android and extension proof, and CI delivery remain unverified; the overall delivery is not closed.

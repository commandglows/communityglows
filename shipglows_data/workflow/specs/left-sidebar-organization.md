---
artifact: specification
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: communityglows
created: "2026-09-07"
updated: "2026-09-07"
created_at: "2026-09-06T23:00:00Z"
updated_at: "2026-09-06T23:00:00Z"
source_model: GPT-6
status: ready
source_skill: sg-design
scope: left-sidebar-organization
owner: Diane
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
depends_on: []
supersedes: []
evidence:
  - "User approved the preceding single-outcome plan with v on 2026-09-07."
next_step: "Validate the integrated sidebar in an authenticated Windows session."
---

# Organisation du panneau gauche

## User story and contract

As a CommunityGlows user, I arrange network shortcuts and open Bento tabs from the left sidebar, using drag/drop or keyboard-accessible menus. Existing shortcut category order becomes a personal per-profile order. Bento commands act on the live layout, preserving its existing scene persistence. These are labelled separate lists: moving a shortcut never changes open tabs.

Drop between rows inserts before/after; drop on a group joins it; an explicit ungrouped destination removes membership. Groups can be created, renamed, reordered and dissolved without closing members. Existing hidden-network preferences, custom links, renamed groups and dissolved default categories are preserved. Empty personal shortcut groups remain usable as destinations; Bento groups retain their existing lifecycle around open tabs. Escape, cancelled drag, profile switch and unmount cancel pending gestures without mutation. Failed writes must show an error and not claim persistence.

## Scope and design authority

AppSidebar, new sidebar organization helpers/components, DesktopWorkspace and App.vue integration, focused tests and FR/EN labels. Reuse Vue, Reka menus, InlineSidebarLabel and design/tokens/reference.json through existing generated CSS tokens. No new dependencies, auth changes, deployment, commit, cloud schema or runtime launch configuration changes. Native browser-extension tabs outside the Bento live workspace retain their existing platform owner; do not conflate them with Dockview tabs.

## Ordered tasks and acceptance

1. Normalize legacy sidebar preferences into stable group membership/order, preserving every item once and independent profiles; test malformed data, hidden members, empty groups, new catalogue entries and roundtrip.
2. Bind sidebar drag/drop and menu equivalents for network and group move/create/dissolve/rename. Show insertion/destination feedback and keep keyboard focus usable.
3. Expose live Bento organization through its existing owner to a sidebar list; route commands back to Dockview, updating both views and tabGroups.panelIds where serialized order changes. No duplicate layout authority.
4. Run focused behavior tests, typecheck, lint, token check and frontend build; exercise rendered UI at regular and compact widths, persistence, keyboard, cancellation, group moves and tab membership. Verify Windows app if accessible; keep fixture component proof and authenticated native proof distinct.

## Test contract and ZOMBIES coverage

Zero: empty personal group/empty workspace. One: last member ungrouped. Many: reordered groups and repeated moves without duplicates. Boundaries: first/last, folded groups, hidden entries, profile/scene switch. Interfaces: existing preference migration and Dockview serialization. Exceptions: bad storage, cancelled drag, unavailable workspace. Simple: navigation click still works. Tests use synthetic data, never auth bypass. Existing login must succeed with authorized context for authenticated native proof; otherwise report exact missing user step.

## Risks, links and documentation coherence

Local preferences are untrusted input; validate IDs, arrays and names. Never transfer data between profiles, print credentials, or close a tab while ungrouping. Reuse scene layout persistence. Auth and permissions are unchanged (OWASP security gate: no new privileged or internet-facing boundary). Repository is already dirty: preserve unrelated edits. Rollback is removal of this bounded diff; legacy preference fields remain readable. Related specs: network-catalog-and-personal-groups.md and communityglows-desktop-bento-workspace.md. Record implementation and proof here; no public claims before visible proof.

## Execution Batches

Ready, independent write ownership after readiness: main owns AppSidebar.vue, src/lib/sidebarOrganization.ts and tests, FR/EN locale additions, and this spec. Delegated tabs batch owns App.vue, DesktopWorkspace.vue, new BentoSidebarTabs.vue, new Bento organization bridge types/tests. No overlapping writes. AppSidebar provides an organization named slot; App.vue fills it with BentoSidebarTabs. Agent returns translation additions to main. Main integrates and validates the combined diff. Preserve existing dirty content in all owned files.

## Skill Run History

| Time UTC | Skill | Result |
| --- | --- | --- |
| 2026-09-06T23:00:00Z | 100-sg-spec | reviewed: approved scope and bounded proof contract authored |
| 2026-09-06T23:00:00Z | 101-sg-ready | ready: distinct list identities, per-profile persistence, non-closing dissolution, bounded write ownership and explicit native proof limits checked |
| 2026-09-06T23:00:00Z | 006-sg-design | in progress: implement approved sidebar organization and collect proof |

## Current Chantier Flow

Implementation and isolated rendered checks completed; authenticated native Windows acceptance remains pending. No commit or release performed.

## Implementation and proof — 2026-09-07

- Networks: compatible sidebar preference fields now preserve explicit order, membership and personal groups per profile. Built-in networks, tasks and custom links share the personal organization. Existing names and removed categories migrate without discarding entries. Storage writes commit atomically to visible state and display failure instead of claiming success.
- UI: drag before/after rows, join group headers, ungroup destination, group creation/inline rename/dissolution, keyboard-accessible context menus and Alt+Up/Down. Source/target validation and cancellation prevent stale drops. Insertion marks do not resize rows. Native overlay events balance for menus and network drags.
- Bento: App.vue passes the live DesktopWorkspace snapshot through the sidebar organization slot. Commands are checked against profile and scene, operate through Dockview and reuse existing autosave. Same-group serialized reorder updates both views and tabGroups.panelIds. No second live layout store.
- 48 focused Vitest tests pass across sidebar organization, Bento commands and existing layout/store regressions. Scoped ESLint reports no errors. Token carriers are current. Final Vite Tauri frontend build succeeds (9.51 seconds); this is not a native release build.
- Standalone AppSidebar browser fixture with synthetic profiles: real mouse drag of networks and groups, inline creation/rename, keyboard reorder and Shift+F10 menu, menu ungroup, group dissolution retaining all 59 entries, profile isolation, reload persistence, Escape cancellation and quota failure passed. At 700px and 1440px viewports no page overflow was observed. Reloaded latest source emitted balanced overlay transitions [true,false,true,false] for drag and menu.
- Standalone BentoSidebarTabs + real DockviewVue fixture: same-group reorder, joining before a member, serialized roundtrip, personal group creation, group reorder, last-member ungroup and dissolution retain all panels. Keyboard creation and mouse drag joining/reorder passed. Final callback has zero page errors and balanced menu overlay events [true,false]. Evidence callback: .playwright-mcp/verify-bento-sidebar.cjs; screenshots: sidebar-organization-network.png, sidebar-organization-compact.png, bento-sidebar-fixture.png under .playwright-mcp/.
- Global typecheck remains failing outside the new code: core reports Object.entries lib support in src/utils/themePalette.ts; full vue-tsc also reports existing test/global type issues. No new errors in the owned sidebar/Bento files were found. Whole dirty-tree drift scan reports existing literals in other edits; this is not a claim of repository-wide token compliance.
- Managed registry confirms CommunityGlows running at http://127.0.0.1:3006. The browser app reaches /login; no authenticated protected access or native Windows interaction was proven. No auth bypass was used. The operator was asked to connect while implementation proceeded.

## Manual acceptance remaining

### Approved display refinement — 2026-09-07

User approved two Settings modes: Grouped at the top (default) or As tabs. Removed the Networks heading/add row and the standalone Bento add button; creation remains in the context menu. Saved Bento scenes use stable bento-scene identifiers in the same sidebar organization as networks when displayed as tabs. Display changes filter the list without changing membership/order; they never turn saved scenes into live Dockview panels. Scene clicks and edit/delete context actions reuse the scene command owner. The display preference is device-local, consistent with control-bar placement, and reports storage failures. Group visibility operations exclude scene identities from network synchronization.

Proof: 14 focused tests pass; frontend build succeeds. Rendered AppSidebar fixture proves scene drag into a personal group, scene load command, grouped-mode removal from the mixed list, restoration to the same group when switching back, and absence of the removed heading. Rendered MobileSettingsSheet buttons switch modes and expose the selected state with aria-pressed. Screenshots: .playwright-mcp/bento-display-tabs.png and bento-display-settings.png. Native authenticated acceptance remains separate.

In the connected Windows app, move a network into a personal group, reorder it, use Sans groupe, then reload. In Bento, open two tabs, group them through their sidebar menu, reorder by dragging, dissolve the group and confirm both remain open. Switch profile and scene and verify each arrangement and native WebView menu visibility. This is the remaining acceptance gate, not a reason to repeat implementation.

## Delegation receipt

### Approved duplicate refinement

User explicitly confirmed a duplicate remains in the current profile and uses the same connected account. Create a stable optional instanceId for each copy, place it after its source in the same sidebar and Bento group, and permit independent movement/closure. Canonical networkId and profile remain the session/storage boundary; native labels include instanceId. No profile mixing or authentication bypass. Existing layouts without instanceId keep their identity. Copies persist locally per profile and in existing scene layouts; validate IDs and preserve the 24-panel limit. Native runtime proof must distinguish compile/tests from actual same-account cookie sharing and independent closure.

Ready write batches: main owns AppSidebar, App.vue, sidebarOrganization, desktopWorkspaceLayouts, DesktopWorkspace, Bento sidebar bridge/menu and associated tests/locales. duplicate_native owns Rust native runtime, networkInstance helper/tests, webviewState store/tests, useNetworkWebview, NetworkWebviewHost/NetworkWorkspacePanel and native controls. Integration contract: selectNetwork/selectCustom accept optional third instanceId, Host/WorkspacePanel pass optional instanceId, session directories remain canonical profile/network. No overlapping writes. Review: ready for implementation of the clarified duplicate behavior; native acceptance remains required.

topology: write-batch parallel; agents_dispatched: 1; model_status: inherited; integration_result: combined frontend build and 48 tests pass, isolated rendering passes, native proof pending. Non-overlapping ownership followed the Execution Batches above.

Duplicate proof: 49 focused frontend tests pass; Rust cargo check and two native identity tests pass. Isolated rendered AppSidebar and real DockviewVue checks prove insertion immediately after source, canonical network/profile retention, reload/layout restoration and independent closure, with zero page errors. Dockview parameters are read from panel serialization because getParameters does not initialize from addPanel/restore in the installed version. Generic component disposal suspends pooled views; explicit removal closes an instance after excluding transient restore removals. Same-account authenticated native Windows behavior remains unverified. No commit or release performed.

## Approved nested groups refinement

User approved three total group levels and requested ungrouped entries directly at root, without a Sans groupe wrapper. Ready bounded implementation: sidebar parents map per profile, preorder rendering with indentation, ancestor collapse, center drop nesting, edge drop sibling order, cycle and subtree-depth validation, context menu move/ungroup and dissolution promoting all members and children one level. Applies to networks and saved Bento scenes in tabs display. Live Dockview ungrouped tabs also lose their synthetic group header. Existing live Dockview group schema remains under its existing owner.

| Time UTC | Skill | Result |
| --- | --- | --- |
| 2026-09-07T01:05:00Z | 006-sg-design | Approved refinement implemented; rendered hierarchy proof passes; final checks in progress |

Nested-group proof complete: 46 focused tests pass; scoped ESLint and frontend Vite build pass. Rendered fixture with real AppSidebar, synthetic profile, network and saved Bento proves mouse nesting, three-level subtree limit, cycle rejection, ancestor folding, visible root entries without a Sans groupe header, reload persistence, one-level context ungroup, dissolution preserving contents, and no horizontal overflow at 700px. Final screenshot: .playwright-mcp/nested-sidebar.png; executable proof: .playwright-mcp/run-nesting-proof.mjs. Existing real Dockview fixture retains duplicate/order/restore/close checks after removing the ungrouped header. Full vue-tsc has existing unrelated errors; no owned-file errors found. Dirty-tree token scan reports 22 existing defects across the broader worktree; new indentation/drop styling uses existing tokens. Native authenticated acceptance remains separate and unverified; no commit or release performed.

## Approved cursor-only refinement

User explicitly retained the current organization behavior and asked to remove the dotted square / prohibited cursor badge. Sidebar network/group and live Bento drag gestures now use pointer events to invoke the existing drag/drop handlers without an OS HTML drag session. No animated reorder redesign. Existing insertion markers, membership/depth checks, context menus and persistence stay owned by the same handlers. Pointer threshold preserves clicks; Escape, blur, pointer cancellation and unmount clean up; edge scrolling is retained. Nested-sidebar rendered proof passes with no trusted native dragstart events, Escape cancellation, no accidental fold after drop and no page errors. Duplicate and real Dockview fixture regression checks pass. Native Windows cursor capture remains unverified; browser event proof establishes that the source of OS drag badges is no longer started.

## Right-sidebar navigation explanation

User requested replacing the select-network toast with the existing central NativeWorkspaceCard adapted to explain left click (corresponding section on the active network site) and right click (future centralized CommunityGlows section). Added a guide variant to the existing card, without download CTAs; wired the five right-sidebar shortcuts to contextual right-click guidance. Centralized pages are explicitly unavailable and no aggregation feature was built. Existing network/Bento content stays mounted, hidden and native-suspended while the guide is open, with a return button. Left navigation preserves the active network instance. Rendered real right-sidebar/card fixture verifies left/right events, selected heading, planned-state copy and absence of download links, without page errors. Scoped ESLint and Vite frontend build pass. Full typecheck still reports prior unrelated errors, including the preexisting string aria-expanded on the right-sidebar Kanban toggle. Authenticated native navigation remains unverified.

Right panel general context menu: user requested common actions on right-sidebar background. Added Settings, Profiles and the shared Theme submenu (mode and palette), with separator and balanced native overlay state. Extracted the existing theme menu and menu styling into SidebarThemeMenu for both sides. Right-click on the five section shortcuts still opens their centralized explanation without also opening the general menu. Rendered right-menu/theme and left-menu separator regressions pass with no page errors; scoped lint and frontend build pass.

Drag ghost refinement: restored a visual clone of the dragged row for network tabs and groups via the shared pointer directive, without starting native drag/drop. The inert, aria-hidden clone preserves rendered appearance, does not intercept drop hit-testing, and is removed on release/cancel/unmount. Rendered tab/group ghost and Escape/release cleanup checks pass without page errors; inset destination outline remains intact. Scoped lint and frontend build pass.

## Exact mixed insertion

User requested precise group placement between tabs, with the insertion line matching the committed location. Sidebar preferences now retain a mixed treeOrder of group and item identities; legacy orders remain compatible. Rendering traverses direct children in this shared order, keeping one header per group and its descendants together. Group drops before/after a tab reparent and position at that exact boundary. Normal tab moves update the same order. Group-end markers appear after all visible descendants; collapsed group markers stay under the header. Existing cycle/depth guards, hidden items, root entries and per-profile storage remain. Fourteen model tests pass, including mixed insertion roundtrip and descendant rejection. Rendered checks verify both directions, reload persistence, exact subtree-end marker/drop correspondence and nesting/collapse regressions. Scoped lint and frontend build pass; global typecheck retains unrelated errors with none reported for AppSidebar or sidebarOrganization. Evidence: verify-mixed-insertion.mjs, verify-subtree-marker.mjs and mixed-group-insertion.png under .playwright-mcp.

Retained drop target: user requested keeping the last valid destination while pointer leaves valid fields. Shared pointer dragging now retains the accepted element and relative hit position, revalidates it through existing handlers, and commits that same boundary on release. Escape, blur, cancellation and missing targets still cancel. Edge scrolling is restricted to the scroll panel horizontal bounds. Rendered checks pass for retained tab boundary, retained group highlight, release placement and Escape rollback, with zero page errors; screenshot retained-drop.png. Scoped lint passes.

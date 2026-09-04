---
title: "Can You Really Separate Multiple Social Accounts on One Device?"
description: "Profiles, local sessions, desktop, Android, and the browser extension: what CommunityGlows actually separates and where the boundaries end."
date: "2026-09-05"
author: "CommunityGlows Team"
tags: ["profiles", "sessions", "webview", "privacy", "multiple-accounts"]
---

[Lire cet article en français](/blog/separer-plusieurs-comptes-sociaux-sur-un-meme-appareil)

Managing a personal account, a brand, and several clients on one computer is convenient. It is also an easy way to post in the wrong place when the active context is unclear.

Creating several profiles in an app sounds like the solution. But there is a more important question behind the interface: **are the sign-ins actually separate, or do the profiles merely organize the same browser tabs?**

In CommunityGlows, a profile represents a work context. In the desktop and Android apps, it also helps assign each network to a distinct session space. The browser extension has a different boundary: sites open in the browser and use its cookies and storage.

That distinction matters. A profile can reduce context mistakes, but it is not a vault, a separate operating-system user, or a promise of absolute isolation across every web storage mechanism.

## The short answer

Yes, multiple accounts on the same network can be separated on one device **in CommunityGlows apps that use native WebViews**, with a boundary for each profile-and-network pair.

In practice:

- on desktop, each profile-and-network pair gets its own WebView data directory;
- on Android, CommunityGlows uses a separate native WebKit profile when the device supports that feature;
- on Android devices without that support, a fallback restores cookies and selected `localStorage` data separately, but covers less;
- in the Chrome or Firefox extension, networks open in ordinary tabs and remain subject to the browser profile. The extension therefore does not promise native CommunityGlows session isolation.

The useful question is not only “did I create two profiles?” but also “which surface am I using to open the network?”

## A CommunityGlows profile is a work context

Imagine two profiles called “Personal” and “Client A.” They may contain the same social network, but they do not represent the same context.

A profile groups networks and useful links, keeps its own workspace draft, and organizes Bento Scenes. On desktop, a Scene can remember the arrangement of several panels. Named Scenes can be synchronized, while workspace drafts and sign-in sessions remain local to the device.

This prevents a common misunderstanding: synchronizing the structure of a workspace does not transfer social-network sign-ins to another phone or computer. A Scene restored elsewhere can reopen the right networks, but you will still need to sign in on that device if no local session exists there.

Profiles also improve visibility. Different names, network selections, and layouts make the context easier to recognize before acting. They cannot verify the account name shown by the social network on your behalf, however. A sensitive post still deserves a final human check.

## On desktop: one data space per profile and network

In the desktop app, CommunityGlows creates WebViews from an identity made of the profile and network. Each pair uses a separate data directory inside the app’s local data.

This means “Personal + network X” and “Client A + network X” are not intentionally pointed at the same WebView storage. Cookies, `localStorage`, and `IndexedDB` are then handled inside the corresponding data spaces of the desktop web engine.

Bento can hide and show a WebView again without recreating it. That suspended view keeps the session attached to the same profile-and-network pair; moving a panel or changing a layout is not supposed to move its sign-in into another profile.

The boundary is still specific. It exists inside CommunityGlows on that device. It does not create a separate Windows account, encrypt all local data by itself, or control what the social network retains on its servers. Someone with access to the operating-system account or the app’s files sits beyond this session-isolation boundary.

## On Android: the best mode depends on the available WebView

Android supplies its own WebView engine. When AndroidX WebKit’s `MULTI_PROFILE` feature is available, CommunityGlows assigns a different native WebKit profile to each profile-and-network pair before navigating to the site. Data managed by that WebKit profile—including cookies and the web storage exposed by the engine—remains attached to that session.

This mode also allows CommunityGlows to keep a limited number of WebViews ready to return to the screen without intentionally sharing a global cookie manager between them.

Not every device and WebView engine offers the same features. Without `MULTI_PROFILE`, CommunityGlows disables that multi-WebView behavior and switches to a single-WebView fallback: cookies are persisted per session, while `localStorage` snapshots are stored per session and exact web origin.

The fallback reduces crossover for the mechanisms it covers, but it is not equivalent to a native WebKit profile. In particular, it does not cover:

- `IndexedDB`;
- `CacheStorage`;
- service workers;
- the WebView’s global HTTP cache;
- the system credential vault.

If the engine cannot restore `localStorage` before page JavaScript runs, or cannot capture later changes reliably, CommunityGlows also treats the behavior as degraded. Calling that complete isolation would be misleading.

For the technical details about origins and storage coverage, read [our guide to Android WebView session isolation](/blog/android-webview-session-isolation).

## In the extension: the browser profile is the boundary

The CommunityGlows extension does not embed social networks in native WebViews. It opens them in Chrome or Firefox tabs.

Those tabs use the cookies, storage, and policies of the active browser profile. Two CommunityGlows profiles inside the same extension therefore do not create two independent cookie stores for the same domain.

If you need strong separation in a browser, use the facilities designed for it: separate browser profiles, containers where available, or separate operating-system accounts. The CommunityGlows profile selector should not be mistaken for those boundaries.

The extension remains useful for finding your networks and organizing work, but its session model is not the desktop or Android model. That is an architectural property of the surface, not a missing preference.

## What stays local and what may sync

A social-network sign-in usually includes cookies and other data created by the site. In CommunityGlows, those network sessions remain local to the device. Convex does not synchronize them between your installations.

Other parts of the product may sync, including profiles, settings, and saved Scenes where those features apply. Contextual tasks and workspace drafts have their own local-persistence rules as well.

Separating synchronized organization from local sign-ins serves two purposes: CommunityGlows sync does not become a transport for third-party sessions, and a new device is clearly treated as a new sign-in boundary.

There is a practical consequence: backing up or recovering a profile does not guarantee that all its networks will already be signed in elsewhere. “My profile exists” and “my social session is active” are different states.

## Password managers belong to another boundary

A password manager may offer credentials inside a visible WebView. On Android, this can happen through the Autofill service selected by the user. On desktop, compatibility depends on the engine and password manager.

The password vault does not belong to a CommunityGlows profile. The app does not enumerate its contents, select an account for the user, or synchronize passwords. If several CommunityGlows profiles display the same domain, the password manager may therefore offer several matching accounts; the user remains responsible for choosing the right one.

Our article about [password managers inside CommunityGlows WebViews](/blog/integrating-password-managers-communityglows-webviews) explains that boundary in more detail.

## A practical test: A, B, then A

To check one network in the desktop or Android app:

1. open the network in Profile A and sign in to Account A;
2. open the same network in Profile B;
3. confirm that Account A is not visible there;
4. sign in to Account B;
5. return to Profile A and confirm that Account A returns without visible Account B data.

This scenario does not prove every possible security property. It does test the everyday outcome that matters: changing profiles should not restore the wrong session for that specific network and journey.

Repeat the test after a significant network change. A third-party site can move authentication to another origin or storage mechanism that the current boundary does not cover. Compatibility observed today is not an immutable guarantee for an external service.

## Habits that reduce mistakes further

Session separation works best alongside sound operating habits:

- give profiles names you can recognize immediately;
- visually distinguish personal, team, and client contexts;
- check the account avatar or name on the site before publishing;
- do not treat the extension as if it provided the app’s native isolation;
- lock your computer or phone session when stepping away;
- sign out or delete a local session before the device changes hands.

CommunityGlows aims to make context clearer and keep sessions within their profile-and-network boundary when the platform supports it. It cannot eliminate human error or replace operating-system protections.

## So, can multiple accounts really be separated?

Yes, but the answer depends on the platform.

On desktop, WebView data spaces are distinct per profile and network. On Android, native multi-profile mode offers the strongest boundary available from the engine; the fallback covers only selected storage. In the extension, sessions remain those of the Chrome or Firefox profile.

The honest promise is not “all your accounts are hermetically isolated everywhere.” It is more useful: **CommunityGlows attaches each native session to the right context where the platform allows it, identifies the Android fallback limits, and does not present extension organization as isolation it cannot provide.**

To understand why these differences exist, read [why CommunityGlows uses Tauri instead of forking Chromium](/blog/why-communityglows-uses-tauri-instead-of-forking-chromium). You can also see [how Bento turns a large screen into a multi-network cockpit](/blog/turn-large-screen-into-multi-network-cockpit-bento).

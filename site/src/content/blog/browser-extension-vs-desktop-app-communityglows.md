---
title: "CommunityGlows Browser Extension or Desktop App: Which Should You Use?"
description: "The extension opens networks in your browser; the desktop app brings them into a Bento workspace. Here is what that changes in daily use."
date: "2026-09-05"
author: "CommunityGlows Team"
tags: ["extension", "desktop", "bento", "webview", "productivity"]
---

[Lire cet article en français](/blog/extension-ou-application-desktop-communityglows)

CommunityGlows is available as a Chrome or Firefox extension and as a desktop application. Both share the same purpose: helping you reach the right network and profile faster. They do not, however, do the same thing.

The extension works **with your browser**. When you select a network, it opens in a regular tab. The desktop app provides **its own workspace**: it can embed several networks in web panels and arrange them in a Bento layout.

This is not a full version competing with a cut-down version. They are two ways to use CommunityGlows, with different powers because they live in different environments.

## The short answer

Choose the extension if you want to keep your usual browser, tabs, and Chrome or Firefox environment.

Choose the desktop app if you want several networks visible in one window, control over how much space each one gets, and reusable layouts for different kinds of work.

You can also use both. The right surface depends less on the length of a feature list than on the context in which you work.

## The extension leaves navigation to the browser

In the extension, CommunityGlows acts as a launcher. You select a profile and network from its surfaces, then that network opens in a browser tab. Chrome’s Tabs API, or the Firefox equivalent, performs the opening — exactly the kind of action extension APIs are designed to support. [Chrome’s official documentation explains this model](https://developer.chrome.com/docs/extensions/reference/api/tabs).

This approach has an immediate advantage: the page lives in the browser you already use. You retain its history, shortcuts, tools, and installed extensions, subject to their own compatibility rules.

CommunityGlows does not replace the network’s interface in this mode. It helps you decide where to go, then lets the browser display the site.

### What the extension offers today

The Chrome and Firefox surfaces provide access to the CommunityGlows network catalog and profiles. They also include settings for language, theme, and custom links. Those links are restricted to valid HTTPS addresses.

Chrome additionally provides a CommunityGlows side panel. Firefox keeps the popup, options, and setup routes: we do not promise a side panel where the browser does not provide the same capability.

This distinction reflects our approach. A shared interface does not mean browsers expose identical APIs.

## The desktop app builds a workspace inside the application

On desktop, CommunityGlows does more than send every network to another external tab. The Tauri application creates and orchestrates embedded web surfaces called WebViews. Tauri provides primitives for creating WebViews and communicating with them. [Its documentation describes this native layer](https://tauri.app/reference/javascript/api/namespacewebviewwindow/).

These WebViews let Bento bring several networks into one window. You can:

- display several networks at the same time;
- split the workspace horizontally or vertically;
- move and resize panels;
- quickly apply Columns, Rows, Focus, or Grid layouts;
- save an arrangement as a Scene associated with the active profile.

A browser remains excellent for visiting pages one at a time. Bento solves a different problem: understanding several conversations or channels within one field of view.

For a closer look, see [how to turn a large screen into a multi-network cockpit](/blog/turn-large-screen-into-multi-network-cockpit-bento).

## A shared foundation does not mean identical capabilities

Much of CommunityGlows uses a common Vue foundation. The network catalog, profiles, preferences, and application logic can evolve without rebuilding every product from scratch.

Shared code stops where each environment imposes its own rules.

| Need | Chrome/Firefox extension | Desktop application |
| --- | --- | --- |
| Open a network | New browser tab | Embedded WebView |
| Several networks in one CommunityGlows window | No | Yes, with Bento |
| Use your familiar browser environment | Yes | No, the app has its own WebView environment |
| CommunityGlows side panel | Chrome only | Not applicable |
| Bento Scenes and layouts | No | Yes |
| Native per-profile session isolation | No | Managed by the app according to the platform |

The final row deserves particular attention. In the extension, sites use the browser’s cookies and storage. CommunityGlows does not create a separate native compartment for every profile. Selecting a profile in the extension should not be confused with creating a separate Chrome or Firefox browser profile.

The desktop application can manage its own WebView environments. That does not mean sign-ins are copied between devices: network sessions remain local to the device on which they were created.

## Why doesn’t the extension recreate Bento in a tab?

An extension can manage tabs and, depending on the browser and its permissions, provide additional surfaces. That does not turn it into the native host of several independent, persistent WebViews.

Recreating the look of a grid inside an extension page would not give it the same session boundaries, panel lifecycle control, or native capabilities as the Tauri application. The appearance might be similar while the actual behavior remained different.

We therefore prefer an explicit fallback: the extension opens regular tabs, a job it can perform cleanly, while desktop reserves Bento for capabilities it can genuinely support.

## Why doesn’t desktop simply reuse your browser tabs?

External tabs would offer the most natural compatibility with the browser ecosystem, including its password managers and extensions. But they would scatter the workspace across windows again and prevent CommunityGlows from arranging the panels directly inside Bento.

WebViews make the opposite tradeoff: they enable an integrated cockpit, but they do not automatically inherit your regular browser profile or every extension installed there.

This boundary is particularly visible with passwords. A manager installed in Chrome does not necessarily appear inside a desktop WebView. Our article [about password managers in CommunityGlows](/blog/integrating-password-managers-communityglows-webviews) explains the realistic options and their limitations.

## Which mode fits your day?

### Use the extension for lightweight navigation

The extension is often the better choice if you:

- already do most of your work in Chrome or Firefox;
- want to open a network quickly without leaving your browser;
- depend on existing browser extensions or profiles;
- prefer to manage networks as standard tabs.

### Use desktop to keep the whole picture in view

The desktop app is a better fit if you:

- need to monitor several networks at once;
- use a large or ultrawide display;
- regularly switch between client, brand, or project contexts;
- want to save Scenes and rearrange the workspace without rebuilding your cockpit.

### Combine them when your workflow changes

A workday does not always have one rhythm. The extension can open a network for a quick check while you research in the browser. Desktop can remain your main workspace for monitoring, support, or a launch that requires several visible channels.

Using both does not make their network sessions interchangeable. A sign-in completed in the browser may need to be repeated in the desktop application, and vice versa.

## Honest consistency instead of false parity

Our goal is to make CommunityGlows recognizable across surfaces: the same networks, understandable profiles, and the same general logic. We do not want to hide technical boundaries behind the word “cross-platform.”

The extension is a browser companion. The desktop application is a workspace that hosts its own panels. That difference determines what each can do, how sessions behave, and how each mode fits with the tools you already use.

Start with the mode that solves today’s need: quick access from your browser, or a multi-network cockpit on your desktop. CommunityGlows remains the common thread without pretending that two different environments can provide exactly the same powers.

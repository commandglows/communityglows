---
title: "Why Do Multiple Open Networks Use So Much Memory?"
description: "WebViews, processes, active pages, and warm sessions: understand the cost of a multi-network cockpit and the tradeoffs of future page sleeping."
date: "2026-09-05"
author: "CommunityGlows Team"
tags: ["performance", "memory", "webview", "bento", "architecture"]
---

[Lire cet article en français](/blog/pourquoi-plusieurs-reseaux-ouverts-consomment-de-la-memoire)

Keeping LinkedIn, Instagram, Gmail, and several other networks side by side is useful. But if you open Windows Task Manager, you may also see several WebView2 processes and more memory use than you would expect from a conventional app.

That behavior does not necessarily indicate a memory leak. A CommunityGlows cockpit does not display static screenshots: every panel contains a real website, including its interface, JavaScript, images, caches, and sometimes video or audio.

The general rule is simple: **the more networks you keep genuinely open, the more web pages your computer has to maintain.**

## A panel is closer to a browser tab than an image

In the Bento cockpit, each visible network is rendered in a WebView. A WebView is a web engine embedded inside an app. On Windows, CommunityGlows uses WebView2, which is based on the Microsoft Edge engine.

The page needs to keep many things in memory:

- the document and its layout;
- the network’s JavaScript code;
- temporary interface data;
- decoded images, fonts, and other resources;
- network connections and background tasks;
- the graphics surface needed to display it.

A modern social network is often a complete application. Even when you are not touching its panel, it may refresh a counter, receive an event, prepare a video, or run a timer.

## Why are there so many Windows processes?

WebView2 follows the multi-process architecture of Microsoft Edge. Work can be divided among a main browser process, renderer processes, and specialized services for the GPU, network, or audio. Microsoft explains that the exact number depends on the features used, the sites loaded, and their isolation. [See the official WebView2 end-user FAQ](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/end-user-faq).

That is why CommunityGlows may not appear as a single line in Task Manager. Several processes do not mean several full copies of the app have started. They are part of the web engine running the pages.

This separation has benefits: a rendering problem in one site is better contained, and a page’s resources can be managed more independently. It also adds startup and memory overhead. [Microsoft’s WebView2 performance guidance](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/performance) confirms that resource use generally grows with the number of instances and the complexity of their content.

## Why not reuse a single WebView?

A single WebView would use fewer resources in some scenarios. Switching networks would then replace the displayed page, however, and returning would require it to load again. That model works for sequential navigation; it is less suitable for a cockpit where several networks must stay visible together.

CommunityGlows also associates sessions with profile-network pairs. That separation helps prevent context from mixing between a personal account, a brand, and a client. Sharing more engine or storage resources can save memory, but it can also weaken that boundary unless the change is carefully designed and verified.

We therefore do not assume that more aggressive sharing is safe based on a theoretical memory saving alone. The priority is to measure real behavior without sacrificing the separation users expect between profiles.

For more context on this decision, read [why CommunityGlows uses Tauri instead of forking Chromium](/blog/why-communityglows-uses-tauri-instead-of-forking-chromium).

## Keeping a page warm is fast, but not free

When a page stays warm, its engine, state, and scroll position can be preserved. Returning to that network then feels almost instant because the page does not have to start from scratch.

That convenience uses resources. Even while hidden, a page may retain its document, JavaScript heap, caches, and part of its graphics state. The engine may throttle some activity when it is not visible, but “hidden” does not automatically mean “stopped.”

CommunityGlows currently uses a bounded pool of warm WebViews. On Windows, a hidden WebView can be retained for a quick return, while the oldest hidden entries are eventually closed when the pool reaches its limit. The app also records diagnostics that distinguish visible and hidden WebViews so this behavior can be measured.

This mechanism limits the accumulation of hidden pages. It does not remove the cost of panels that remain visible or of the few warm pages temporarily retained.

## Hidden is not closed, and closed is not signed out

These are three different actions:

- **Hiding** removes the page from view but may keep its WebView in memory.
- **Closing the WebView** releases its live instance; the next opening may require a fresh load.
- **Clearing a session** removes the associated local sign-in data and may require authentication again.

CommunityGlows can therefore close an old pooled WebView without deleting its profile or automatically erasing the session stored on disk. Conversely, hiding a panel for a dialog or during a drag operation should not be described as a complete memory optimization.

That nuance is central: preserving the session and preserving the entire live page are not the same thing.

## Memory and CPU tell different stories

Memory holds the state needed by pages and the engine. The CPU works when a page executes JavaScript, recalculates its display, decodes media, or processes events.

A page can therefore occupy substantial memory while using very little CPU. Conversely, a single network with video, animation, or a busy real-time feed can cause a CPU spike without being the largest memory user.

The cost depends on factors such as:

- the number of visible panels;
- the sites open and their complexity;
- video, audio, and real-time activity;
- the amount of memory available on the computer;
- the WebView engine version and each site’s behavior.

It would therefore be misleading to promise a fixed amount of memory “per network.”

## What can users do today?

On a computer with limited memory, the most direct option is to keep only the networks needed for the current task visible. A focused Scene—such as “Publishing” or “Replies”—can be lighter than a cockpit that keeps every network open all day.

Closing unused panels reduces the number of visible pages. A WebView may still remain warm in the pool until it is evicted, so closing a card does not guarantee an immediate drop in Task Manager. Closing and restarting CommunityGlows ends all active WebViews when you want to begin from a completely fresh state.

On relevant pages, stopping video or audio can reduce CPU activity. Results still vary by network because CommunityGlows does not control the code run by third-party sites.

For help organizing smaller, task-focused cockpits, see [our guide to Bento Scenes](/blog/turn-large-screen-into-multi-network-cockpit-bento).

## Sleeping inactive pages: a direction, not a shipped feature

The logical next step is to go beyond simply hiding a page. An inactive page could receive a lower memory priority, be suspended, unloaded, or replaced by a minimal state, then restored when the user returns.

Each strategy creates a tradeoff:

- lowering priority preserves more state but frees less memory;
- suspending work can disrupt notifications or real-time connections;
- unloading the page recovers more resources but requires a reload;
- restoring a page must preserve the correct session without reintroducing another profile.

**Inactive-page sleeping is currently in development for CommunityGlows. It is not a shipped feature, and no availability date has been announced.**

The work involves more than adding a timer. The product has to define inactivity, protect active media, respond to memory pressure, verify each platform, and measure resume time. Saving RAM only helps if it does not make the cockpit unpredictable.

## The cockpit tradeoff

Bento deliberately trades some machine resources for fewer context switches: multiple networks remain visible, pages preserve their state, and moving between workspaces is faster.

CommunityGlows already limits the hidden WebViews kept warm, but a true multi-network cockpit will naturally use more resources than an app displaying one page at a time.

The goal is not to pretend that cost disappears. It is to make it measurable, bounded, and adjustable—then introduce sleeping only when it can reduce resource use without compromising sessions or user understanding.

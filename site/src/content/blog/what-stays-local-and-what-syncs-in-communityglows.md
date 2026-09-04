---
title: "CommunityGlows: What Stays on Your Device and What Syncs"
description: "Sessions, profiles, preferences, Scenes, and backups: a clear guide to what CommunityGlows keeps locally and what can follow your account."
date: "2026-09-05"
author: "CommunityGlows Team"
tags: ["privacy", "sync", "sessions", "profiles", "scenes"]
---

[Lire cet article en français](/blog/ce-qui-reste-local-et-ce-qui-est-synchronise-communityglows)

When an app works across several devices, the word “sync” can make it sound as though everything is sent to the cloud. That is not how CommunityGlows works.

We separate two needs that may look similar but have very different implications: recovering your **workspace organization** and transferring an **active social network sign-in**. CommunityGlows syncs selected data that helps organize your work. Social network sessions remain tied to the device where they were created.

That boundary is intentional. It lets you recover profiles and workspaces without pretending that an Instagram, LinkedIn, or Gmail session can be moved silently from a computer to a phone.

## The short answer

When you are signed in to CommunityGlows, sync can cover:

- your CommunityGlows profiles;
- a selected set of app preferences;
- custom links and the networks associated with profiles;
- saved Bento cockpit Scenes;
- selected organizational data for social accounts and filters.

The following stay local to each device:

- active social network sessions;
- cookies and other web data that maintain those sessions;
- the current cockpit draft for each profile;
- contextual tasks in their current version;
- engine- or system-specific data outside the sync contract.

In practice, you can recover the structure of your workspace on another device while still needing to sign in to the networks on that device.

## A CommunityGlows profile is not a social network account

A CommunityGlows profile organizes a context—for example, “Personal,” “Studio,” or a client name. It can include a name, appearance, network selection, and custom links.

That profile can sync. It does not therefore contain your LinkedIn password or a universal copy of your Instagram login.

The distinction matters:

```text
Synced CommunityGlows profile
        ≠
Transferred social network session
```

When you open the same profile on a new device, CommunityGlows can rebuild its organization. The local web engine still has to establish its own sessions with each platform.

## Why do sessions stay local?

A modern web login is more than a username and password. It may depend on cookies, `localStorage`, IndexedDB, caches, service workers, the web engine in use, and protections chosen by the platform itself.

Those mechanisms also differ between WebView2 on Windows, Android System WebView, and a regular browser. Copying part of that state therefore guarantees neither a complete restoration nor acceptance of the session by the service concerned.

CommunityGlows keeps sessions in the local spaces assigned to its profiles and networks. Where native isolation is available, the app separates those spaces by profile and network. Fallback modes still have documented limits: not every kind of web storage can be reproduced or isolated in the same way.

To understand that boundary on Android, read [how CommunityGlows separates WebView sessions](/blog/android-webview-session-isolation). Passwords follow the same principle: [your chosen password manager keeps the vault](/blog/integrating-password-managers-communityglows-webviews).

## What sync actually helps you recover

Sync is designed to reduce reconstruction work, not clone a device.

### Profiles

Profiles give CommunityGlows a shared structure. Recovering them means you do not have to recreate every context and network selection by hand.

### Supported preferences

Settings such as language, theme, selected display options, shortcuts, or the active profile are among the preferences the app can transmit. The exact set can evolve with the product: “synced settings” does not mean every internal value or system preference leaves the device.

### Links and social organization

Custom links attached to profiles, along with selected data used to organize accounts and filters, are part of the synced model. This helps recover a coherent workspace without syncing the private contents of open pages.

### Bento cockpit Scenes

A Scene stores a named layout: which panels make up the cockpit and how they are arranged. Scenes are saved locally first, then placed in the workspace sync queue. They can therefore follow their profile to compatible connected devices.

A Scene restores an **organization**, not a signed-in state. If it contains three networks side by side, a new device can rebuild those three positions, but each network may require a local sign-in.

The current draft is different. It represents the profile’s unsaved working state on that device and stays local. To explore the cockpit in more detail, read [how to turn a large screen into a multi-network workspace](/blog/turn-large-screen-into-multi-network-cockpit-bento).

## What about tasks?

The contextual task manager can store an intention, note, people, links, tags, priority, or due date. In its current version, this board uses versioned local storage and is not synced through the CommunityGlows cloud.

A task created on one computer should therefore not be assumed to exist on another device. That explicit limit is better than a vague promise: until a data type is part of the cloud contract, it should be treated as local.

## Sync can keep working through an unreliable connection

CommunityGlows records useful changes locally first and uses a queue for cloud operations. This helps the interface remain usable when a connection is temporarily unavailable.

It does not turn offline use into a guarantee of immediate replication. Until an operation reaches the sync service, a second device cannot receive it. Size limits and validation also protect workspace data from excessive or malformed states.

## A backup is not sync

CommunityGlows also offers an encrypted backup created deliberately by the user. It can include app data and, depending on the platform, snapshots of compatible local sessions.

That backup serves a different purpose: explicitly moving or restoring a state. It is not continuous cloud replication. Even after a restore, you may need to sign in again because some storage and security controls belong to the web engine, operating system, or social network.

Encrypting an export protects its contents according to the app’s backup mechanism; it does not make every third-party session portable or replace the social account’s own protections.

## What “in the cloud” does not mean

The CommunityGlows cloud is not a copy of everything displayed inside its WebViews. Sync does not mean the app reads the messages, posts, forms, or passwords shown by social networks.

Those sites remain third-party services with their own rules, storage, and sign-in lifecycles. CommunityGlows organizes access to them in a workspace; it does not replace their servers or bypass their controls.

This separation also leads to a few simple expectations:

- deleting a Scene does not close a social account;
- syncing a profile does not automatically sign in a new device;
- signing out of CommunityGlows and signing out of a network are different actions;
- restoring a backup may require some sessions to be confirmed again.

## One rule to remember

**Your organization can follow you; your sign-ins stay where they were created.**

This rule does not erase every difference between Windows, Android, and browser extensions. It does set an honest expectation: CommunityGlows syncs the data that helps rebuild your workspace, while sensitive sessions and web-engine-specific state remain local unless you explicitly move a compatible backup.

That architecture requires more nuance than a single “sync everything” switch. Most importantly, it avoids confusing organizational convenience with portable sign-ins—two very different promises.

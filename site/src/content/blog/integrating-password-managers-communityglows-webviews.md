---
title: "How Can You Use Your Password Manager in CommunityGlows?"
description: "Google Password Manager, 1Password, Bitwarden, and others: realistic ways to sign in to your networks without giving your passwords to CommunityGlows."
date: "2026-08-19"
author: "CommunityGlows Team"
tags: ["password-managers", "webview", "android", "windows"]
---

[Lire cet article en français](/blog/integrer-gestionnaires-mots-de-passe-webviews-communityglows)

CommunityGlows manages multiple profiles and keeps separate sessions across dozens of networks. That quickly raises an important question: can every user rely on their usual password manager—Google Password Manager, 1Password, Bitwarden, Dashlane, Proton Pass, or another provider—directly inside the app?

Networks appear in web screens embedded inside CommunityGlows. Developers call these screens **WebViews**: they look like browser tabs, but they run inside the application. That distinction explains why a password manager that works perfectly in Chrome or Edge may behave differently in CommunityGlows.

The short answer is **yes on Android, partially on Windows, but not through a universal vault-reading API**.

The goal is not to create a CommunityGlows password or build another local vault. It is to let the password manager the user already owns fill network login forms while CommunityGlows continues to manage profiles and sessions.

## Why Not Simply Call the Password Manager API?

Some providers do offer APIs, but they generally solve a different problem.

Bitwarden provides a Public API for organization administration and a CLI-backed Vault Management API. The latter can manipulate decrypted vault items after authentication and unlock. It is designed for intentional automation, not transparent autofill in a consumer application. [Bitwarden API documentation](https://bitwarden.com/help/bitwarden-apis/)

1Password developer products and Secrets Manager solutions similarly target enterprise secrets, deployments, and automated processes. They are not generic APIs for reproducing a browser extension inside a WebView.

If CommunityGlows used these interfaces directly, the app would have to receive decrypted credentials, manage vault tokens, and match accounts to domains itself. CommunityGlows would become a critical intermediary in the password path. That is neither necessary nor desirable.

The correct model is different:

```text
CommunityGlows identifies the visible page
        ↓
The password manager verifies the origin and asks the user to choose
        ↓
The password manager fills the form directly
```

The password should never pass through CommunityGlows.

## Android: The Universal Interface Already Exists

Android provides an Autofill framework in which compatible password managers can participate. A WebView exposes a virtual structure describing its HTML fields and origin. The provider selected by the user can then offer matching accounts near the keyboard or in a system picker.

CommunityGlows can make its WebViews eligible for this mechanism without knowing whether the provider is Google Password Manager, 1Password, Bitwarden, or something else. It does not read the vault, select the account, or fill the fields itself.

This participation needs to cover:

- the app's main WebView;
- network WebViews;
- child windows used by some login flows;
- Android 8 or later, where the Autofill framework is available.

Android also recommends Credential Manager for credentials that belong to the app itself. Requesting credentials on behalf of third-party websites is a privileged capability intended for applications such as browsers. Providers must authorize the calling app, and Google Password Manager requires an approval process. [Privileged Credential Manager calls](https://developer.android.com/identity/sign-in/privileged-apps)

Autofill therefore remains the official, provider-independent solution for CommunityGlows. Exact compatibility still needs validation on physical devices: a provider or network may reject an embedded form, use a particular iframe, or require an additional setting.

## Windows: The Embedded Screen Is Not Microsoft Edge

On Windows, CommunityGlows uses a Microsoft technology called WebView2 for its embedded web screens. Its rendering engine comes from Microsoft Edge, but the application does not automatically reuse the user's Edge profile.

WebView2 stores cookies, settings, form data, and any saved passwords in an app-specific User Data Folder. It has an official `IsPasswordAutosaveEnabled` option, disabled by default, but enabling it would essentially create a separate WebView2 password store. It would not expose credentials already synchronized through Google Password Manager, 1Password, or Bitwarden. [WebView2 profile data](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/user-data-folder)

Windows also does not provide desktop applications with a universal equivalent of Android Autofill for web passwords. That leaves the mechanisms supplied by individual providers:

- 1Password Auto-Type can type credentials into the active window;
- Bitwarden supports methods including drag-and-drop from its desktop app;
- other providers offer their own shortcuts or integrations.

These methods work best when only the visible WebView owns focus. A preloaded or hidden WebView must never receive input intended for the network currently displayed.

## Can Our Extension Talk to the Password Manager Extension?

Chrome and Chromium browsers allow extensions to communicate through `runtime.sendMessage()` and `runtime.connect()`. However, the receiving extension must listen for external messages and intentionally expose an API. It can also restrict callers through `externally_connectable`. [Cross-extension messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging#cross-extension-messaging)

A responsible password manager extension would not normally expose a command such as:

```text
getCredentials("instagram.com")
```

That would create a direct vault-exfiltration path.

A possible provider integration should instead look like this:

```text
fillCurrentPage({ tabId, origin })
```

The manager would verify the origin, display its own interface, let the user choose an account, and fill the page directly. CommunityGlows would never receive the password. This approach still requires an official API or partnership with each provider.

Native Messaging allows our extension to communicate with the CommunityGlows desktop application. The native host explicitly declares which extension IDs it accepts, so our extension cannot arbitrarily connect to the private native host used by 1Password or another manager. [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)

Technically, a CommunityGlows content script could read a field after the manager fills it. That would be the wrong architecture: the extension would become a credential collector. Chrome Web Store rules explicitly classify passwords, authentication cookies, and form data as sensitive user data. [Chrome Web Store user data policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

## Can Extensions Be Loaded Into the Embedded Screen?

WebView2 now provides `AddBrowserExtensionAsync`, which installs an unpacked Chromium extension from a local folder. [WebView2 extension API](https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.core.corewebview2profile.addbrowserextensionasync)

This is an interesting prototype path, but it is not yet a universal, distribution-ready solution:

- the extension must be available in unpacked form;
- it must be installed and retained in the relevant WebView2 profiles;
- it may rely on Chromium APIs unavailable in WebView2;
- its popup or toolbar does not automatically integrate into the CommunityGlows interface;
- its native channel may reject an unrecognized host application;
- redistribution and updates must follow the provider's rules and permissions.

1Password allows certain additional Windows browsers when they are signed or installed in `Program Files`. That makes an experiment plausible, but 1Password also warns that an approved browser receives highly sensitive access while the vault is unlocked. [Additional browsers in 1Password](https://support.1password.com/additional-browsers/)

A WebView2 prototype should therefore test the generic mechanism with several representative extensions instead of shaping the architecture around a single provider.

## The Most Universal Windows Option: A Real Browser

The only way to obtain the complete existing password-manager ecosystem immediately is to use a real browser with real profiles.

CommunityGlows could remain the dashboard and orchestrator:

- one distinct Chrome or Edge profile for each CommunityGlows context;
- networks opened in the corresponding browser profile;
- the user's chosen extensions available normally;
- Google Password Manager available in Chrome;
- cookies and other session data retained by the browser;
- our extension used only to connect commands, windows, and profiles to CommunityGlows.

The tradeoff is significant: networks would appear in browser windows rather than inside the current embedded WebViews. Copying the resulting session back into WebView2 would be fragile and risky. A modern login may depend on `HttpOnly` cookies, `localStorage`, IndexedDB, service workers, and device-bound protections. It is safer to retain a session in the engine that created it.

## The Realistic Options

The strategy can therefore be summarized as follows:

| Platform | Immediate solution | Advanced path |
| --- | --- | --- |
| Android | Provider-independent system Autofill | Request privileged status from providers |
| Windows inside CommunityGlows | Auto-Type, drag-and-drop, and strict focus | Experimental hosting of Chromium extensions |
| Windows browser | Existing password manager and extensions | Browser profiles orchestrated by CommunityGlows |

There is no magic API capable of reading every vault—and such an API would be a security problem. A sound integration lets the password manager fill the page directly.

Android already provides that abstraction through Autofill. On Windows, CommunityGlows must choose between retaining the embedded experience with partial compatibility, experimenting with extension hosting, or using real browser profiles for the broadest compatibility.

The healthiest direction remains constant: **CommunityGlows manages profiles and sessions; the password manager chosen by the user keeps the passwords.**

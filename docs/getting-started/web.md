---
sidebar_position: 6
---

# Web / JavaScript

Integrate the **SRG Login SDK** into a browser web app via the `SrgLoginWeb` facade — a Promise-based JavaScript/TypeScript API distributed as `@swisstxt/srg-login-sdk`.

:::info Same SDK core, browser-idiomatic facade
The web build is the Kotlin/JS target of the same SDK. Its public surface is the `SrgLoginWeb` facade — login is a **full-page redirect** to the IDP (not the mobile `login(loginMethod, authContext)` Flow).
:::

---

## Prerequisites

- A **secure context** — HTTPS in production, or `http://localhost` in development. The SDK requires the Web Crypto API (`crypto.subtle`) and Web Storage, and fails fast at construction with a clear error if they are unavailable.
- A bundler that resolves ES modules (Vite, Rollup, webpack, …). The package ships ES modules (`.mjs`) with generated TypeScript definitions.

---

## Step 1: Install the SDK

The web package is distributed via Git (zero-auth) — no npm registry, no credentials. No stable `1.0.0` is released yet, so pin the current release candidate in your `package.json`:

```jsonc
{
  "dependencies": {
    "@swisstxt/srg-login-sdk": "github:swisstxt/srg-login-sdk-distribution-web#semver:1.0.0-rc.2"
  }
}
```

Then install and import:

```bash
npm install
```

```typescript
import { SrgLoginWeb, type UserInfoJs } from "@swisstxt/srg-login-sdk";
```

---

## Step 2: Initialize the SDK

Create one `SrgLoginWeb` instance for your app:

```typescript
const sdk = new SrgLoginWeb(
  /* clientId              */ "<your-client-id>",
  /* redirectUri           */ `${window.location.origin}/callback`,
  /* environment           */ "INT",
  /* appId                 */ "ch.example.web",
  /* appName               */ "My Web App",
  /* appVersion            */ "1.0.0",
  /* businessUnit          */ "SRF",
  /* businessUnitName      */ "Schweizer Radio und Fernsehen",
  /* postLogoutRedirectUri */ `${window.location.origin}/`,
  /* enableLogging         */ true,
);
```

> **Critical**: `redirectUri` and `postLogoutRedirectUri` must be registered at the IDP for your client as the web `redirect_uri` / `post_logout_redirect_uri`. The `environment` (`"INT"` / `"PROD"`) must match the environment in which your `clientId` is registered. See [Business Units](/docs/reference/bu-identities) for the exact `businessUnit` / `businessUnitName` values.

---

## Step 3: Handle the Redirect (Callback Route)

Web login is **redirect-based**: `login()` navigates the whole page to the IDP, which redirects back to your `redirectUri` (e.g. `/callback`). On that route, call `handleRedirect()` to complete the authorization-code exchange:

```typescript
// Runs on app start; only does work on the callback route.
if (window.location.pathname.startsWith("/callback")) {
  const result = await sdk.handleRedirect();
  if (!result.authenticated) {
    // Login failed — inspect result.errorCode / result.errorMessage
    console.error(result.errorCode, result.errorMessage);
  }
  // Clean the callback params out of the URL
  window.history.replaceState({}, document.title, "/");
}
```

> `handleRedirect()` returns a `LoginResultJs` (`authenticated`, plus `errorCode` / `errorMessage` on failure). The persisted authorization transaction is single-use with a short TTL.

---

## Step 4: Implement Login

`login()` requests the given scopes and redirects the page to the IDP. It does not return to the caller (the page navigates away) — the result is delivered on the callback route via `handleRedirect()` (Step 3).

```typescript
await sdk.login(["profile", "email", "offline_access"]);
```

---

## Step 5: Implement Logout

`logout()` is front-channel — it ends the IDP session, clears local tokens, and redirects to `postLogoutRedirectUri`:

```typescript
await sdk.logout();
```

---

## Step 6: Observe Token State

`observeTokenState()` pushes the current token state (a string such as `"Valid"`, `"ExpiringSoon"`, `"Refreshing"`, `"Expired"`, `"NoTokens"`) and returns an **unsubscribe** function:

```typescript
const unsubscribe = sdk.observeTokenState((tokenState) => {
  console.log("Token state:", tokenState);
});

// Later, when you no longer need updates:
unsubscribe();
```

---

## Step 7: Get the Access Token

```typescript
// Returns a valid access token (refreshing transparently if needed), or null if not authenticated.
const token = await sdk.getAccessToken();

// Force a refresh (e.g. after a 401 from your resource server):
const fresh = await sdk.refreshAccessToken();
```

> Call `getAccessToken()` at the point of use rather than caching it — the SDK refreshes it transparently near expiry.

---

## Step 8: Read the User Profile

The typed `UserInfoJs` profile is available after login (seeded from the ID token) and on demand from the OIDC `/userinfo` endpoint:

```typescript
const user: UserInfoJs | null = await sdk.getUserInfo();
if (user) {
  console.log(user.subject, user.email, user.emailVerified, user.name);
}

// Force a fresh /userinfo fetch:
const refreshed = await sdk.refreshUserInfo();
```

`UserInfoJs` exposes `subject`, `email`, `emailVerified`, `name`, `preferredUsername`, `givenName`, `familyName`, `picture`, and more.

---

## Step 9: Open the Profile Page (SSO)

`openProfile()` opens an SSO-authenticated URL — the user's active session is reused, so the page loads without a second login:

```typescript
await sdk.openProfile("https://settings-int.srgssr.ch/profile?prompt=none");
```

---

## Step 10: Check Authentication State

```typescript
const authenticated: boolean = await sdk.isAuthenticated();
```

> `isAuthenticated()` is `true` only when a **non-expired** access token is stored. At cold start the access token is often expired while the refresh token is still valid — call `getAccessToken()` once (it refreshes transparently) before concluding the user is signed out, to avoid bouncing a returning user to the login screen.

---

## SDK API Reference

| Symbol | Description |
|---|---|
| `SrgLoginWeb` | The web facade — construct one instance per app |
| `login(scopes)` | Redirect to the IDP to authenticate |
| `handleRedirect()` | Complete login on the callback route → `LoginResultJs` |
| `logout()` | Front-channel logout (ends the IDP session) |
| `isAuthenticated()` | `true` if a non-expired access token is stored |
| `getAccessToken()` / `refreshAccessToken()` | Current / force-refreshed access token |
| `getUserInfo()` / `refreshUserInfo()` | Cached / fresh `UserInfoJs` |
| `openProfile(url)` | Open an SSO-authenticated URL |
| `observeTokenState(cb)` | Subscribe to token-state changes; returns an unsubscribe function |
| `LoginResultJs` | `{ authenticated, errorCode?, errorMessage? }` |
| `UserInfoJs` | Typed profile claims |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Constructor throws about "secure context" / Web Crypto | Page served over plain HTTP (not `localhost`) | Serve over HTTPS (or `http://localhost` in dev) |
| `handleRedirect()` reports an error | `redirectUri` not registered at the IDP, or the transaction expired | Register the exact `redirectUri`; run the callback promptly after the redirect |
| Bundler cannot resolve `@swisstxt/srg-login-sdk` | Missing or mis-specified git dependency | Use `github:swisstxt/srg-login-sdk-distribution-web#semver:1.0.0-rc.2` and `npm install` |
| User bounced to login on refresh | Relying on `isAuthenticated()` alone at cold start | Call `getAccessToken()` once before concluding signed-out (see Step 10) |

---

## Related

- [SDK Distribution — Web](https://github.com/swisstxt/srg-login-sdk-distribution-web) — the published web package
- [Web Sample App](https://github.com/swisstxt/srg-login-sdk-sample-web) — a complete single-page reference
- [Authentication guide](/docs/guides/authentication) — cross-platform login concepts

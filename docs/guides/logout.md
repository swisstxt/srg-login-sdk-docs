---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Logout

The SDK provides multiple logout modes depending on whether you want to end the server-side session, revoke only this device's grant, or clear local tokens.

:::danger `logout()` default changed in 1.0.0-rc.3
The no-argument `srgLogin.logout()` now defaults to **`LogoutType.Silent`** — a browser-less server-side logout. In earlier versions it defaulted to `LocalOnly` (a local clear that left the IDP session alive). If you relied on the old behaviour, pass `LogoutType.LocalOnly` explicitly. See the [rc.3 upgrade guide](/docs/upgrades/v1.0.0-rc.3#1--logout-now-ends-the-server-session).
:::

## Logout Types

| Type | Clears local tokens | Ends server session | Revokes this device's grant | Opens browser |
|------|:------------------:|:------------------:|:---------------------------:|:-------------:|
| **Silent** *(default)* | Yes | Yes (SSO session) | Yes (RFC 7009) | No |
| **DeviceOnly** | Yes | No (SSO session kept) | Yes (RFC 7009) | No |
| **Front-channel** | Yes | Yes | No | Yes |
| **Local-only** | Yes | No | No | No |
| **Back-channel** | Yes | Yes (server-initiated) | No | No |

:::info Web platform
The `SrgLoginWeb` facade exposes `logout()` (front-channel), `logoutThisDevice()` (DeviceOnly) and `logoutLocally()` (LocalOnly). `LogoutType.Silent` is **not** available on web — see [Web logout](#web-logout) below.
:::

## Silent Logout *(default)*

Ends the session over plain HTTPS with **no browser UI**: RFC 7009 revocation of this device's grant, then OIDC RP-Initiated Logout at `end_session_endpoint`, then the local clear. This is what `logout()` does when called with no argument. It gives **tvOS and Android TV a server-side logout for the first time** (they previously had Local + BackChannel only, having no browser for front-channel).

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
import ch.srg.login.sdk.auth.LogoutType

// Equivalent to the no-argument logout():
srgLogin.logout(logoutType = LogoutType.Silent())

// Opt out of RFC 7009 revocation (end_session only):
srgLogin.logout(logoutType = LogoutType.Silent(revokeTokens = false))
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
try await srgLogin.logout(logoutType: LogoutType.Silent(revokeTokens: true))
```

  </TabItem>
</Tabs>

:::warning `logout()` now performs network I/O
Silent logout makes one or two HTTPS round trips, so `logout()` can now return `LogoutResult.Failure` (e.g. offline). The local session is cleared on **every** path — check `clearedLocalSession` rather than treating any `Failure` as "still logged in". Revocation is best-effort; the expected refusals of a public client (400/401/403) never turn a successful logout into a failure.
:::

## DeviceOnly Logout

Revokes **this device's** grant at the IDP's RFC 7009 `revocation_endpoint` and clears the local session, deliberately **leaving the SSO session intact**. It is the right choice on a TV: with the device-code flow the SSO session belongs to the browser that approved the code, so a full logout from the TV would sign the user out on their phone.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
srgLogin.logout(logoutType = LogoutType.DeviceOnly)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
try await srgLogin.logout(logoutType: LogoutType.DeviceOnly.shared)
```

  </TabItem>
</Tabs>

:::note Revocation is required here
Unlike Silent (where revocation is best-effort), DeviceOnly's revocation is its only server-side effect — a rejection is reported as `LogoutResult.Failure` (the local session is cleared either way), and an IDP advertising no `revocation_endpoint` yields `InvalidConfiguration`.
:::

## Front-Channel Logout

Clears the server session **and** local tokens. Opens the secure browser briefly to hit the IDP's logout endpoint.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
import ch.srg.login.sdk.auth.LogoutType

val authContext = AndroidAuthContext(context = activity, activity = activity)
srgLogin.logout(
    logoutType = LogoutType.FrontChannel(authContext = authContext),
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let authContext = iOSAuthContext(presentationContextProvider: authContextProvider)
let frontChannel = LogoutType.FrontChannel(authContext: authContext)
try await srgLogin.logout(logoutType: frontChannel)
```

  </TabItem>
  <TabItem value="web" label="Web">

The `SrgLoginWeb` facade exposes a single **front-channel** `logout()` that ends the IDP session and redirects to `postLogoutRedirectUri`:

```typescript
await sdk.logout();
```

  </TabItem>
</Tabs>

### `postLogoutRedirectUri`

Configured in `SrgLoginConfig`, this is the URL the IDP redirects to after clearing the server session:

- **`nil`** — the IDP still logs out, but shows its own confirmation page before the browser closes
- **Set to your app's URI** — the IDP redirects back to your app

In both cases local tokens are cleared and the server session ends — the difference is only whether your app receives a redirect callback.

## Local-Only Logout

Clears local tokens only, without contacting the server. The server-side session remains active — the user may still appear logged in on other devices or in the browser.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
srgLogin.logout(logoutType = LogoutType.LocalOnly)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
try await srgLogin.logout(logoutType: LogoutType.LocalOnly.shared)
```

  </TabItem>
</Tabs>

:::note Android TV / Google TV / tvOS
Device-flow apps have no on-device browser, so front-channel logout does not apply. Since 1.0.0-rc.3 they can end the session server-side without a browser via **`LogoutType.Silent`**, or revoke just this device's grant with **`LogoutType.DeviceOnly`** (recommended on TV — it keeps the SSO session on the phone that approved the device code). `LocalOnly` and `BackChannel` remain available.
:::

## Back-Channel Logout

Server-initiated logout — typically used when the IDP notifies your backend that a user's session was terminated. Your backend then forwards the logout token to the mobile app.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
srgLogin.logout(
    logoutType = LogoutType.BackChannel(logoutToken = receivedLogoutToken)
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
try await srgLogin.logout(
    logoutType: LogoutType.BackChannel(logoutToken: receivedLogoutToken)
)
```

  </TabItem>
</Tabs>

## Web logout

The `SrgLoginWeb` facade offers three logout entry points. `LogoutType.Silent` is **not** available on web: in a browser `fetch` resolves redirects itself, so the `Location` header that separates a successful `end_session` from an error page is unreadable — web logout stays a top-level navigation, which is what OIDC RP-Initiated Logout specifies anyway.

```typescript
await sdk.logout();            // front-channel: ends the SSO session, redirects to postLogoutRedirectUri
await sdk.logoutThisDevice();  // DeviceOnly: revoke this browser's grant (RFC 7009), keep other apps' sessions
await sdk.logoutLocally();     // LocalOnly: local clear, no network, nothing changed at the IDP
```

- **`logoutLocally()`** is the only web logout that leaves the IDP alone **unconditionally** — reach for it when a later silent (`prompt=none`) login must still pick the session back up, or when logout has to work offline. Trade-off: the grant stays valid at the IDP until it expires.
- **`logoutThisDevice()`** revokes this browser's grant. On SRG's IDP a web-initiated revoke also ends the browser's SSO session for every client (apps keep renewing on refresh tokens they already hold, but none can obtain a *new* authorization silently afterwards).

## When to Use Which

| Scenario | Recommended type |
|----------|-----------------|
| User taps "Log out" in your app (mobile) | Silent *(default)* |
| User taps "Log out" on a TV / device-flow app | DeviceOnly |
| User taps "Log out" in your app (web) | Front-channel (`logout()`) |
| Sign-out that must survive a later silent login (web) | Local-only (`logoutLocally()`) |
| Logout screen must show the IDP's confirmation page | Front-channel |
| User switches accounts | Silent *(mobile)* / Front-channel *(web)* |
| Clearing state during testing/development | Local-only |
| Server notifies session ended | Back-channel |
| App detects expired refresh token | Local-only (token is already invalid server-side) |

## Related

- [Authentication](/docs/guides/authentication) — Login flow
- [Token Management](/docs/guides/token-management) — Token states after logout (`NoTokens`)
- [Getting Started — Android](/docs/getting-started/android#step-5-implement-logout)
- [Getting Started — Android TV / Google TV](/docs/getting-started/android-tv#step-4-implement-logout)
- [Getting Started — iOS](/docs/getting-started/ios#step-5-implement-logout)
- [Getting Started — tvOS](/docs/getting-started/tvos#step-4-implement-logout)
- [Getting Started — Web](/docs/getting-started/web#step-5-implement-logout)

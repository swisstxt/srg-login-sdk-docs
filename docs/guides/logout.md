---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Logout

The SDK provides multiple logout modes depending on whether you want to end the server-side session or only clear local tokens.

## Logout Types

| Type | Clears local tokens | Ends server session | Opens browser |
|------|:------------------:|:------------------:|:-------------:|
| **Front-channel** | Yes | Yes | Yes |
| **Local-only** | Yes | No | No |
| **Back-channel** | Yes | Yes (server-initiated) | No |

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
Device-flow apps have no on-device browser, so they end the session with **local-only** logout — `srgLogin.logout()` on Android TV (defaults to `LogoutType.LocalOnly`), `logout(logoutType: LogoutType.LocalOnly.shared)` on tvOS.
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

## When to Use Which

| Scenario | Recommended type |
|----------|-----------------|
| User taps "Log out" in your app | Front-channel |
| Clearing state during testing/development | Local-only |
| User switches accounts | Front-channel |
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

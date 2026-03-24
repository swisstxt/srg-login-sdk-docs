---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Token Management

After a successful login, the SDK manages tokens automatically — including storage, refresh, and expiry monitoring. You never need to manually store or refresh tokens.

## Token State

The SDK exposes a reactive `TokenState` stream with 7 states:

| State | Meaning |
|-------|---------|
| `Valid` | Token is valid, safe to use |
| `ExpiringSoon` | Token expires soon, refresh in progress |
| `Refreshing` | Token refresh in progress |
| `Refreshed` | New token obtained after refresh |
| `Expired` | Token expired, waiting for refresh or re-auth |
| `RefreshFailed` | Refresh failed (check `error` property) |
| `NoTokens` | No tokens stored — user is not logged in |

### Observe Token State

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
srgLogin.observeTokenState().collect { state ->
    when (state) {
        TokenState.Valid          -> { /* Normal operation */ }
        TokenState.ExpiringSoon  -> { /* Optional: warn user */ }
        TokenState.Refreshing    -> { /* Show spinner */ }
        is TokenState.Refreshed  -> { /* New token available */ }
        TokenState.Expired       -> { /* Wait for refresh or re-auth */ }
        is TokenState.RefreshFailed -> { /* Handle error */ }
        TokenState.NoTokens      -> { /* Show login screen */ }
    }
}
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let tokenStateFlow = SkieSwiftStateFlow<TokenState>(srgLogin.observeTokenState())

for await state in tokenStateFlow {
    guard !Task.isCancelled else { break }
    // state is one of: Valid, ExpiringSoon, Refreshing, Refreshed,
    //                   Expired, RefreshFailed, NoTokens
    print("Token state: \(state)")
}
```

:::tip
On iOS, you must wrap the Kotlin `StateFlow` with `SkieSwiftStateFlow` to get a native Swift `AsyncSequence`.
:::

  </TabItem>
</Tabs>

## Get Access Token

Always fetch the access token at the point of use — the SDK transparently refreshes it when near expiry, so a cached string can become stale.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
val isAuthenticated: Boolean = srgLogin.isAuthenticated()

when (val result = srgLogin.getAccessToken()) {
    is SdkResult.Success -> {
        val authHeader = "Bearer ${result.data.value}"
        // Use for API calls
    }
    is SdkResult.Failure -> {
        handleError(result.error)
    }
}
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let isAuthenticated = (try? await srgLogin.isAuthenticated())?.boolValue ?? false

let result = try await srgLogin.getAccessToken()

if let success = result as? SdkResultSuccess<AccessToken>, let token = success.data {
    let authHeader = "Bearer \(token.value)"
}

if let failure = result as? SdkResultFailure {
    print(failure.error)
}
```

  </TabItem>
</Tabs>

## Automatic Refresh

The SDK handles token refresh automatically:

1. **Proactive refresh** — the SDK refreshes the token before it expires (configurable threshold)
2. **On-demand refresh** — if you call `getAccessToken()` and the token is expired, the SDK tries to refresh it
3. **Observation** — `observeTokenState()` emits `Refreshing` → `Refreshed` (or `RefreshFailed`) during refresh

If the refresh token itself is expired or revoked, the SDK emits `RefreshFailed` and the user must log in again.

## SSO Client

`openSsoClient` opens a URL with the user's IDP session cookie injected — the user is silently authenticated via SSO.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
val authContext = AndroidAuthContext(context = activity, activity = activity)

srgLogin.openSsoClient(
    ssoClientUrl = "https://settings.srgssr.ch/profile",
    authContext = authContext,
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let authContext = iOSAuthContext(presentationContextProvider: authContextProvider)

_ = try? await srgLogin.openSsoClient(
    ssoClientUrl: "https://settings.srgssr.ch/profile?prompt=none",
    authContext: authContext
)
```

`prompt=none` suppresses any login prompt if the SSO session has expired — the call fails with an error instead of showing a login screen.

  </TabItem>
</Tabs>

## Related

- [Authentication](/docs/guides/authentication) — Login flow
- [Error Handling](/docs/guides/error-handling) — Handle token errors
- [Logout](/docs/guides/logout) — Clear tokens

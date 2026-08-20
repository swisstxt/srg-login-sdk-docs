---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Token Monitoring

The SDK provides background token monitoring that tracks the token lifecycle and emits reactive state updates. This enables proactive refresh, UI indicators, and automatic session management.

## Overview

Token refresh behaviour is controlled by `TokenRefreshConfig.mode`:

- **`TokenRefreshMode.Automatic`** *(default)* — the SDK runs a background monitor that refreshes the access token **before** it expires, eliminating token-expired errors for active users.
- **`TokenRefreshMode.Manual`** — no background monitor; your app triggers refresh explicitly via `getAccessToken(forceRefresh = true)`.

## Configure Token Refresh

`TokenRefreshConfig` is passed to `SrgLoginConfig`:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
val config = SrgLoginConfig(
    clientId = "your-client-id",
    redirectUri = "yourapp://callback",
    appIdentity = appIdentity,
    environment = Environment.PROD,
    tokenRefreshConfig = TokenRefreshConfig(
        mode = TokenRefreshMode.Automatic,   // background monitor + proactive refresh (default)
        refreshThresholdSeconds = 300,        // refresh 5 min before expiry
    )
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let config = SrgLoginConfig(
    clientId: "your-client-id",
    redirectUri: "yourapp://callback",
    appIdentity: appIdentity,
    environment: .prod,
    tokenRefreshConfig: TokenRefreshConfig(
        mode: TokenRefreshMode.Automatic.shared,
        refreshThresholdSeconds: 300
    )
)
```

To switch to manual mode, use the convenience extension on `SrgLoginConfig`:

```swift
let config = SrgLoginConfig(/* … */)
    .withAutomaticTokenMonitoring(enabled: false)   // TokenRefreshMode.Manual
```

  </TabItem>
  <TabItem value="web" label="Web">

The `SrgLoginWeb` facade does **not** expose `TokenRefreshConfig`. On web, refresh is handled automatically (refresh-token rotation); trigger an explicit refresh with `refreshAccessToken()`:

```typescript
const fresh = await sdk.refreshAccessToken();
```

  </TabItem>
</Tabs>

## TokenRefreshConfig Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `mode` | `TokenRefreshMode.Automatic` | `Automatic` = background monitor + proactive refresh; `Manual` = app-driven refresh |
| `refreshThresholdSeconds` | `300` | Seconds before expiry to trigger a proactive refresh (Automatic mode) |
| `maxRetryAttempts` | `3` | Max retry attempts for a failed refresh |
| `initialRetryDelayMs` | `1000` | First retry delay (ms) |
| `maxRetryDelayMs` | `30000` | Max retry delay with exponential backoff (ms) |
| `maxRefreshTokenUses` | `1000` | Warning threshold for refresh-token reuse |

## Token State Lifecycle

The monitoring loop emits `TokenState` changes via `observeTokenState()`:

```
Uninitialized → NoTokens → [login] → Valid → ExpiringSoon → Refreshing → Refreshed → Valid
                                                                  ↓
                                                           RefreshFailed → [re-login needed]
                                                                  ↓
                                                              NoTokens
```

| State | Meaning | App action |
|-------|---------|------------|
| `Uninitialized` | State not yet determined (before the first evaluation) | Wait |
| `Valid` | Token is valid | Normal operation |
| `ExpiringSoon` | Token expires within threshold | Optional: show indicator |
| `Refreshing` | Refresh in progress | Show spinner or queue API calls |
| `Refreshed` | New token obtained (contains `tokenSet`) | Use the new token |
| `Expired` | Token expired, awaiting refresh | Wait for refresh or re-auth |
| `RefreshFailed` | Refresh failed (contains `error`) | Navigate to login screen |
| `NoTokens` | No tokens stored | Show login screen |

## Observe Token State

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
srgLogin.observeTokenState().collect { state ->
    when (state) {
        TokenState.Valid -> showMainContent()
        TokenState.ExpiringSoon -> showTokenExpiringBanner()
        TokenState.Refreshing -> showRefreshIndicator()
        is TokenState.Refreshed -> hideRefreshIndicator()  // new token in state.tokenSet
        TokenState.Expired -> showExpiredWarning()
        is TokenState.RefreshFailed -> when (state.error) {
            is SrgLoginError.InvalidGrant -> navigateToLogin()
            is SrgLoginError.NetworkError -> showRetryOption()
            else -> showError(state.error)
        }
        TokenState.NoTokens -> navigateToLogin()
        TokenState.Uninitialized -> { /* State not yet determined */ }
    }
}
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let tokenStateFlow = SkieSwiftStateFlow<TokenState>(srgLogin.observeTokenState())

for await state in tokenStateFlow {
    guard !Task.isCancelled else { break }

    switch state {
    case is TokenState.Valid:
        showMainContent()
    case is TokenState.ExpiringSoon:
        showTokenExpiringBanner()
    case is TokenState.Refreshing:
        showRefreshIndicator()
    case let refreshed as TokenState.Refreshed:
        hideRefreshIndicator()  // new token in refreshed.tokenSet
    case is TokenState.Expired:
        showExpiredWarning()
    case let failed as TokenState.RefreshFailed:
        if failed.error is SrgLoginError.InvalidGrant {
            navigateToLogin()
        } else {
            showError(failed.error)
        }
    case is TokenState.NoTokens:
        navigateToLogin()
    default:  // Uninitialized
        break
    }
}
```

:::tip
On iOS, wrap the Kotlin `StateFlow` with `SkieSwiftStateFlow` to get a native Swift `AsyncSequence`.
:::

  </TabItem>
  <TabItem value="web" label="Web">

```typescript
const unsubscribe = sdk.observeTokenState((tokenState) => {
  // tokenState is a string, e.g. "Valid", "ExpiringSoon", "Refreshing", "Expired", "NoTokens"
  updateUi(tokenState);
});

// Later: stop receiving updates
unsubscribe();
```

  </TabItem>
</Tabs>

## Smart Scheduling

In `TokenRefreshMode.Automatic`, the SDK uses adaptive intervals instead of a fixed polling rate:

| Token lifetime | Check interval | Efficiency |
|---------------|---------------|------------|
| < 5 min | 30 seconds | Frequent checks for short-lived tokens |
| 5–30 min | 1–5 minutes | Balanced for typical sessions |
| 30 min–24h | 5–15 minutes | Battery-efficient for long-lived tokens |

The monitoring loop:
1. Evaluates the JWT `exp` claim
2. Calculates time-to-expiry
3. Emits the appropriate `TokenState`
4. Sleeps for an adaptive interval
5. Repeats

:::info
There is no fixed polling-interval parameter — the intervals above are computed dynamically from the token's remaining lifetime.
:::

## Manual Refresh

In `TokenRefreshMode.Manual` (or any time you want explicit control), trigger a refresh via `getAccessToken(forceRefresh = true)` — this replaces the removed `refreshToken()`:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
when (val result = srgLogin.getAccessToken(forceRefresh = true)) {
    is SdkResult.Success -> {
        val token = result.data   // refreshed AccessToken
    }
    is SdkResult.Failure -> handleError(result.error)
}
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let result = try await srgLogin.getAccessToken(forceRefresh: true)

if let success = result as? SdkResultSuccess<AccessToken> {
    // refreshed token in success.data
}
if let failure = result as? SdkResultFailure {
    handleError(failure.error)
}
```

  </TabItem>
  <TabItem value="web" label="Web">

```typescript
const fresh = await sdk.refreshAccessToken();  // new access token string, or null
```

  </TabItem>
</Tabs>

## Error-Aware Retry

When a refresh fails, the retry interval adapts to the error type:

| Error type | Retry interval | Rationale |
|-----------|---------------|-----------|
| `NetworkError` | 30 seconds | Transient — retry quickly |
| `HttpError` | 60 seconds | Server issue — give it time |
| `InvalidGrant` | 300 seconds | Terminal — refresh token revoked |

After `InvalidGrant`, the SDK clears the session and transitions to `NoTokens`. The user must log in again.

## Related

- [Token Management](/docs/guides/token-management) — Token lifecycle basics
- [Error Handling](/docs/guides/error-handling) — Handle `RefreshFailed` errors
- [Configuration](/docs/guides/configuration) — `TokenRefreshConfig` setup

---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Token Monitoring

The SDK provides background token monitoring that tracks the token lifecycle and emits reactive state updates. This enables proactive refresh, UI indicators, and automatic session management.

## Overview

Token monitoring runs in the background after login, evaluating the access token's expiration at adaptive intervals. When enabled with proactive refresh, the SDK refreshes the token before it expires — eliminating token-expired errors for active users.

## Enable Monitoring

Token monitoring is **opt-in** via `TokenRefreshConfig`:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
val config = SrgLoginConfig(
    clientId = "your-client-id",
    redirectUri = "yourapp://callback",
    appIdentity = appIdentity,
    environment = Environment.PROD,
    tokenRefreshConfig = TokenRefreshConfig(
        enableAutomaticTokenMonitoring = true,  // Enable background monitoring
        enableProactiveRefresh = true,           // Auto-refresh before expiry
        refreshThresholdSeconds = 300,           // Refresh 5 min before expiry
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
        enableAutomaticTokenMonitoring: true,
        enableProactiveRefresh: true,
        refreshThresholdSeconds: 300
    )
)
```

  </TabItem>
</Tabs>

## TokenRefreshConfig Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `enableAutomaticTokenMonitoring` | `false` | Enable background monitoring loop |
| `enableProactiveRefresh` | `true` | Auto-refresh token before expiry |
| `refreshThresholdSeconds` | `300` | Seconds before expiry to trigger refresh |
| `maxRetryAttempts` | `3` | Max retry attempts for failed refresh |
| `initialRetryDelayMs` | `1000` | First retry delay (ms) |
| `maxRetryDelayMs` | `30000` | Max retry delay with exponential backoff (ms) |
| `maxRefreshTokenUses` | `1000` | Warning threshold for refresh token reuse |

## Token State Lifecycle

The monitoring loop emits `TokenState` changes via `observeTokenState()`:

```
NoTokens → [login] → Valid → ExpiringSoon → Refreshing → Refreshed → Valid
                                                  ↓
                                           RefreshFailed → [re-login needed]
                                                  ↓
                                              NoTokens
```

| State | Meaning | App action |
|-------|---------|------------|
| `Valid` | Token is valid | Normal operation |
| `ExpiringSoon` | Token expires within threshold | Optional: show indicator |
| `Refreshing` | Refresh in progress | Show spinner or queue API calls |
| `Refreshed` | New token obtained | Use new token (contains `tokenSet`) |
| `Expired` | Token expired, awaiting refresh | Wait for refresh or re-auth |
| `RefreshFailed` | Refresh failed (contains `error`) | Navigate to login screen |
| `NoTokens` | No tokens stored | Show login screen |

## Observe Token State

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
// Collect in a ViewModel or lifecycle-aware scope
srgLogin.observeTokenState().collect { state ->
    when (state) {
        TokenState.Valid -> {
            showMainContent()
        }
        TokenState.ExpiringSoon -> {
            // Optional: show subtle indicator
            showTokenExpiringBanner()
        }
        TokenState.Refreshing -> {
            showRefreshIndicator()
        }
        is TokenState.Refreshed -> {
            // New token available in state.tokenSet
            hideRefreshIndicator()
        }
        TokenState.Expired -> {
            showExpiredWarning()
        }
        is TokenState.RefreshFailed -> {
            // Check state.error for details
            when (state.error) {
                is SrgLoginError.InvalidGrant -> navigateToLogin()
                is SrgLoginError.NetworkError -> showRetryOption()
                else -> showError(state.error)
            }
        }
        TokenState.NoTokens -> {
            navigateToLogin()
        }
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
        // New token available in refreshed.tokenSet
        hideRefreshIndicator()
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
    default:
        break
    }
}
```

:::tip
On iOS, wrap the Kotlin `StateFlow` with `SkieSwiftStateFlow` to get a native Swift `AsyncSequence`.
:::

  </TabItem>
</Tabs>

## Smart Scheduling

When `enableAutomaticTokenMonitoring = true`, the SDK uses adaptive intervals instead of a fixed polling rate:

| Token lifetime | Check interval | Efficiency |
|---------------|---------------|------------|
| < 5 min | 30 seconds | Frequent checks for short-lived tokens |
| 5–30 min | 1–5 minutes | Balanced for typical sessions |
| 30 min–24h | 5–15 minutes | Battery-efficient for long-lived tokens |

The monitoring loop:
1. Evaluates the JWT `exp` claim (not a DTO getter)
2. Calculates time-to-expiry
3. Emits the appropriate `TokenState`
4. Sleeps for an adaptive interval
5. Repeats

:::info
The `monitoringIntervalSeconds` config parameter is **ignored** when automatic monitoring is enabled — smart scheduling calculates optimal intervals dynamically.
:::

## Manual Refresh

If you prefer manual control over token refresh (e.g., `enableProactiveRefresh = false`), you can trigger a refresh explicitly:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
when (val result = srgLogin.refreshToken()) {
    is SdkResult.Success -> {
        // Token refreshed, new tokenSet available
    }
    is SdkResult.Failure -> {
        handleError(result.error)
    }
}
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let result = try await srgLogin.refreshToken()

if let success = result as? SdkResultSuccess<TokenSet> {
    // Token refreshed
}
if let failure = result as? SdkResultFailure {
    handleError(failure.error)
}
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

After `InvalidGrant`, the SDK emits `SessionInvalidated` and transitions to `NoTokens`. The user must log in again.

## Related

- [Token Management](/docs/guides/token-management) — Token lifecycle basics
- [Error Handling](/docs/guides/error-handling) — Handle `RefreshFailed` errors
- [Configuration](/docs/guides/configuration) — `TokenRefreshConfig` setup

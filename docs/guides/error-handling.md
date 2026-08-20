---
sidebar_position: 6
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Error Handling

The SDK uses a type-safe error model based on sealed classes. All errors are instances of `SrgLoginError`, which can be pattern-matched for specific handling.

## Error Types

| Error | Meaning | Typical action |
|-------|---------|---------------|
| `NetworkError` | No internet connection | Show retry option |
| `UserCancelled` | User dismissed the login/logout browser | Ignore — not a real error |
| `InvalidGrant` | Refresh token revoked or expired | Navigate to login screen |
| `TokenExpired` | Access token expired | Try refresh, or re-login |
| `NotAuthenticated` | No active session | Navigate to login screen |
| `InvalidConfiguration` | Bad `SrgLoginConfig` | Check config values |
| `HttpError` | Server returned an error (code + message) | Show error to user |

## Pattern Matching

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
import ch.srg.login.sdk.errors.SrgLoginError

fun handleError(error: SrgLoginError) {
    when (error) {
        is SrgLoginError.NetworkError -> {
            showError("Network unavailable")
        }
        is SrgLoginError.UserCancelled -> {
            // User closed the browser — not a real error, ignore
        }
        is SrgLoginError.InvalidGrant -> {
            // Refresh token revoked — re-login needed
            navigateToLoginScreen()
        }
        is SrgLoginError.TokenExpired -> {
            // Access token expired
            refreshOrReLogin()
        }
        is SrgLoginError.NotAuthenticated -> {
            navigateToLoginScreen()
        }
        else -> {
            showError("Unexpected error: $error")
        }
    }
}
```

:::tip
The error package is `ch.srg.login.sdk.errors` (plural `errors`, not `error`).
:::

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
import SRGLoginCore

func handleError(_ error: SrgLoginError) {
    switch error {
    case is SrgLoginError.NetworkError:
        showAlert("Network unavailable")
    case is SrgLoginError.UserCancelled:
        // User closed the browser — not a real error, ignore
        break
    case is SrgLoginError.InvalidGrant:
        // Refresh token revoked — re-login needed
        navigateToLoginScreen()
    case is SrgLoginError.TokenExpired:
        refreshOrReLogin()
    case is SrgLoginError.NotAuthenticated:
        navigateToLoginScreen()
    default:
        showAlert("Unexpected error: \(error)")
    }
}
```

  </TabItem>
  <TabItem value="web" label="Web">

The web facade does not surface the `SrgLoginError` sealed class. Login errors arrive as structured fields on the `LoginResultJs` returned by `handleRedirect()`:

```typescript
const result = await sdk.handleRedirect();
if (!result.authenticated) {
  // result.errorCode is a stable code; result.errorMessage is a sanitized description
  showError(result.errorMessage ?? result.errorCode);
}
```

Other facade methods (`getAccessToken`, `getUserInfo`, …) return the value or `null` on failure — there is no `SdkResult` wrapper on web.

  </TabItem>
</Tabs>

:::note Android TV / Google TV & tvOS
TV platforms use the **same** `SrgLoginError` sealed class as their mobile counterpart — the Android / iOS patterns above apply unchanged.
:::

## SdkResult

Most SDK operations return an `SdkResult` — a generic wrapper for success/failure:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
when (val result = srgLogin.getAccessToken()) {
    is SdkResult.Success -> {
        val token = result.data.value
    }
    is SdkResult.Failure -> {
        handleError(result.error)
    }
}
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let result = try await srgLogin.getAccessToken()

if let success = result as? SdkResultSuccess<AccessToken>, let token = success.data {
    let value = token.value
}

if let failure = result as? SdkResultFailure {
    handleError(failure.error)
}
```

:::tip
On iOS, `SdkResult` is mapped by SKIE as `SdkResultSuccess<T>` and `SdkResultFailure` — use `as?` casts.
:::

  </TabItem>
  <TabItem value="web" label="Web">

There is no `SdkResult` on web — facade methods return the value directly or `null` on failure:

```typescript
const token = await sdk.getAccessToken(); // string | null
if (token === null) {
  // not authenticated / refresh failed — start login
}
```

  </TabItem>
</Tabs>

## Common Error Scenarios

| Scenario | Error | Recovery |
|----------|-------|----------|
| No internet during login | `NetworkError` | Retry when connection is restored |
| User closes browser during login | `UserCancelled` | Ignore — let user try again |
| Refresh token expired (e.g., after 30 days) | `InvalidGrant` | Force re-login |
| `clientId` registered in INT but using PROD | `invalid_client` (browser error) | Fix `environment` in config |
| Calling `getAccessToken()` without login | `NotAuthenticated` | Navigate to login |

## Related

- [Authentication](/docs/guides/authentication) — Login flow and errors
- [Token Management](/docs/guides/token-management) — Token state and refresh errors
- [Getting Started — Android](/docs/getting-started/android#step-9-error-handling)
- [Getting Started — iOS](/docs/getting-started/ios#step-9-error-handling)
- [Getting Started — Web](/docs/getting-started/web#step-3-handle-the-redirect-callback-route) — web error handling via `handleRedirect()`

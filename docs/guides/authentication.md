---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Authentication

The SRG Login SDK implements the **Authorization Code flow with PKCE** ([RFC 7636](https://tools.ietf.org/html/rfc7636)) — the recommended OAuth 2.0 flow for native mobile apps. The user authenticates in a secure, system-managed browser, never directly in the app.

## Credential Types

`Credentials` is a sealed class with 4 variants:

| Credential | Usage | Status |
|---|---|---|
| `Web` | Browser login (Authorization Code + PKCE) — smartphones/tablets | **Implemented** |
| `Device` | Device Code Flow (RFC 8628) — TV, Android TV, Apple TV | Not yet implemented |
| `Biometric` | Biometric login (fingerprint/Face ID) — access to stored tokens | Not yet implemented |
| `UserPassword` | Direct username/password login — without browser | Not yet implemented |

## How PKCE Works

1. The SDK generates a random `code_verifier` and derives a `code_challenge` (SHA-256)
2. The authorization request includes the `code_challenge`
3. The user authenticates in the secure browser
4. The IDP returns an authorization code
5. The SDK exchanges the code + `code_verifier` for tokens
6. The IDP verifies the `code_verifier` matches the original `code_challenge`

This prevents authorization code interception attacks — even if an attacker intercepts the code, they cannot exchange it without the `code_verifier`.

### Secure Browser

| Platform | Secure Browser |
|----------|---------------|
| Android | Chrome Custom Tabs |
| iOS | `ASWebAuthenticationSession` |

## Login

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
import ch.srg.login.sdk.auth.AndroidAuthContext
import ch.srg.login.sdk.auth.Credentials
import ch.srg.login.sdk.auth.LoginState

val authContext = AndroidAuthContext(context = activity, activity = activity)

srgLogin
    .login(
        credentials = Credentials.Web,
        authContext = authContext,
    )
    .collect { loginState ->
        when (loginState) {
            is LoginState.Success -> {
                val subject = loginState.tokenSet.accessToken.subject
                // User is authenticated
            }
            is LoginState.Failure -> {
                val error = loginState.error
                // Handle error
            }
            else -> { /* Intermediate states */ }
        }
    }
```

The login returns a `Flow<LoginState>` — collect it in a coroutine scope (`viewModelScope`, `lifecycleScope`).

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
import SRGLoginCore
import AuthenticationServices

class AuthContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}

let authContextProvider = AuthContextProvider()
let authContext = iOSAuthContext(presentationContextProvider: authContextProvider)

let result = try await srgLogin.login(credentials: Credentials.Web(authContext: authContext))

if let success = result as? SdkResultSuccess<TokenSet>, let tokenSet = success.data {
    // User is authenticated
}

if let failure = result as? SdkResultFailure {
    print(failure.error)
}
```

The login is `async/await` — call it from a `Task` or async function.

  </TabItem>
</Tabs>

## OAuth Redirects

<Tabs>
  <TabItem value="android" label="Android" default>

Android requires explicit redirect handling via `AndroidManifest.xml` intent filters and `onNewIntent`:

```kotlin
import ch.srg.login.sdk.handleRedirect  // Top-level function!

override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleRedirect(intent)
}
```

See [Android — Configure OAuth Redirects](/docs/getting-started/android#step-3-configure-oauth-redirects) for the full manifest setup.

  </TabItem>
  <TabItem value="ios" label="iOS">

iOS requires **no configuration** — `ASWebAuthenticationSession` manages the entire redirect lifecycle internally. No `Info.plist` changes, no `AppDelegate` URL handling.

  </TabItem>
</Tabs>

## Related

- [Getting Started — Android](/docs/getting-started/android#step-4-implement-login)
- [Getting Started — iOS](/docs/getting-started/ios#step-4-implement-login)
- [Error Handling](/docs/guides/error-handling) — Handle login errors
- [Token Management](/docs/guides/token-management) — What happens after login

---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Authentication

The SRG Login SDK implements the **Authorization Code flow with PKCE** ([RFC 7636](https://tools.ietf.org/html/rfc7636)) — the recommended OAuth 2.0 flow for native mobile apps. The user authenticates in a secure, system-managed browser, never directly in the app.

## Login Methods

`LoginMethod` is a sealed class with 4 variants:

| Login Method | Usage | Status |
|---|---|---|
| `Web` | Browser login (Authorization Code + PKCE) — smartphones/tablets | **Implemented** |
| `Device` | Device Code Flow (RFC 8628) — TV, Android TV, Apple TV | **Implemented** (Android TV, tvOS) |
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
import ch.srg.login.sdk.auth.LoginMethod
import ch.srg.login.sdk.auth.LoginState

val authContext = AndroidAuthContext(context = activity, activity = activity)

srgLogin
    .login(
        loginMethod = LoginMethod.Web,
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
  <TabItem value="android-tv" label="Android TV / Google TV">

Android TV and Google TV consume the **same** Android artifact, but use the **Device Authorization Grant** (RFC 8628) — no on-device browser:

```kotlin
import ch.srg.login.sdk.auth.AndroidTvAuthContext
import ch.srg.login.sdk.auth.LoginMethod
import ch.srg.login.sdk.auth.LoginState

// Device flow needs no Activity — just the application context
val authContext = AndroidTvAuthContext(context = applicationContext)

srgLogin
    .login(
        loginMethod = LoginMethod.Device,
        authContext = authContext,
    )
    .collect { state ->
        when (state) {
            is LoginState.AwaitingDeviceActivation -> {
                // Show state.userCode + state.verificationUri
                // (or render a QR code of state.verificationUriComplete)
            }
            is LoginState.Success -> { /* User is authenticated */ }
            is LoginState.Failure -> { /* Handle state.error */ }
            else -> { /* Intermediate states */ }
        }
    }
```

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

let loginFlow = srgLogin.login(
    loginMethod: LoginMethod.Web.shared,
    authContext: authContext
)

for await state in SkieSwiftFlow<LoginState>(loginFlow) {
    if let success = state as? LoginState.Success {
        let tokenSet = success.tokenSet
        // User is authenticated
    }
    if let failure = state as? LoginState.Failure {
        print(failure.error)
    }
}
```

The login returns a `Flow<LoginState>` — collect it from an async context (e.g. a `Task`).

  </TabItem>
  <TabItem value="tvos" label="tvOS">

tvOS uses the **same** Swift Package as iOS, with the **Device Authorization Grant** (RFC 8628):

```swift
let loginFlow = srgLogin.login(
    loginMethod: LoginMethod.Device.shared,
    authContext: TvOSAuthContext(),
    additionalScopes: ["profile", "email", "offline_access"]
)

for await state in SkieSwiftFlow<LoginState>(loginFlow) {
    if let pending = state as? LoginState.AwaitingDeviceActivation {
        // Show pending.userCode + pending.verificationUri
        // (or render a QR code of pending.verificationUriComplete)
    }
    if let success = state as? LoginState.Success { /* User is authenticated */ }
    if let failure = state as? LoginState.Failure { print(failure.error) }
}
```

  </TabItem>
  <TabItem value="web" label="Web">

Web uses the `SrgLoginWeb` facade — a Promise-based API where login is a **full-page redirect** to the IDP (not the `login(loginMethod, …)` Flow):

```typescript
import { SrgLoginWeb } from "@swisstxt/srg-login-sdk";

const sdk = new SrgLoginWeb(
  "<your-client-id>",
  `${window.location.origin}/callback`,   // redirectUri (registered at the IDP)
  "INT",                                  // environment
  "ch.example.web", "My Web App", "1.0.0",
  "SRG", "SRG SSR",
  `${window.location.origin}/`,           // postLogoutRedirectUri
);

// Login redirects the whole page to the IDP:
await sdk.login(["profile", "email", "offline_access"]);

// …then on your callback route (e.g. /callback):
const result = await sdk.handleRedirect();
// `result` carries errorCode / errorMessage on failure; on success the session is active.
```

  </TabItem>
</Tabs>

## Customizing the Authorization Request

You can forward additional OIDC/OAuth `/authorize` parameters — set the IdP UI language (multilingual SRG: `fr` / `de` / `it` / `rm`), pre-fill an account, force re-authentication, and so on. The well-known parameter **names** and `prompt` **values** are available as constants — `OidcAuthParams` and `OidcPromptValues` — so you never hard-code magic strings.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
import ch.srg.login.sdk.auth.OidcAuthParams
import ch.srg.login.sdk.auth.OidcPromptValues

srgLogin.login(
    loginMethod = LoginMethod.Web,
    authContext = authContext,
    additionalParameters = mapOf(
        OidcAuthParams.UI_LOCALES to "fr",                 // IdP UI language
        OidcAuthParams.LOGIN_HINT to "user@example.com",   // pre-fill the account
        OidcAuthParams.PROMPT to OidcPromptValues.LOGIN,    // force re-authentication
    ),
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let flow = srgLogin.login(
    loginMethod: LoginMethod.Web.shared,
    authContext: authContext,
    additionalParameters: [
        OidcAuthParams.shared.UI_LOCALES: "fr",
        OidcAuthParams.shared.LOGIN_HINT: "user@example.com",
        OidcAuthParams.shared.PROMPT: OidcPromptValues.shared.LOGIN,
    ]
)
```

  </TabItem>
  <TabItem value="web" label="Web">

`SrgLoginWeb.login` takes an optional second argument — a plain object of string→string entries:

```typescript
import { UI_LOCALES, LOGIN_HINT, PROMPT, PROMPT_LOGIN } from "@swisstxt/srg-login-sdk";

// Kotlin/JS exports top-level constants as { get(): string } — read the key with .get():
await sdk.login(["profile", "email"], {
  [UI_LOCALES.get()]: "fr",
  [LOGIN_HINT.get()]: "user@example.com",
  [PROMPT.get()]: PROMPT_LOGIN.get(),
});

// …or pass the literal key strings:
await sdk.login(["profile", "email"], { ui_locales: "fr" });
```

:::info Why `.get()` on the web?
Kotlin/JS exports top-level constants as objects with a `get()` accessor rather than bare strings, so read a constant's value with `.get()` (e.g. `UI_LOCALES.get()` → `"ui_locales"`). Prompt **values** are prefixed `PROMPT_*` (e.g. `PROMPT_LOGIN`) to avoid name collisions with the keys. Non-string values are ignored — the wire format is string-only.
:::

  </TabItem>
</Tabs>

| Parameter | Constant | Notes |
|-----------|----------|-------|
| `ui_locales` | `OidcAuthParams.UI_LOCALES` | IdP UI language (`fr` / `de` / `it` / `rm`) |
| `login_hint` | `OidcAuthParams.LOGIN_HINT` | Pre-fill the account identifier |
| `prompt` | `OidcAuthParams.PROMPT` | Values: `OidcPromptValues.NONE` / `LOGIN` / `CONSENT` / `SELECT_ACCOUNT` |
| `max_age` | `OidcAuthParams.MAX_AGE` | Maximum authentication age (seconds) |

:::warning Reserved parameters are filtered
The parameters the SDK sets itself — `client_id`, `redirect_uri`, `response_type`, `state`, `nonce`, PKCE, `scope` — are stripped and cannot be overridden. Only overridable keys have constants.
:::

## Silent Login (Web)

`SrgLoginWeb.loginSilently()` runs the ordinary authorization-code flow with OIDC `prompt=none`, which forbids the IdP from rendering any UI. Use it to **bootstrap from an existing SSO session** this app has not yet claimed — for example after a device-code sign-in was approved in the same browser, or a session created by another SRG app. It is not invisible: web login is a top-level redirect, so the page still leaves for the IdP and returns; what disappears is the login screen, not the navigation.

```typescript
await sdk.loginSilently(["profile", "email", "offline_access"]);
// …then on your callback route:
const result = await sdk.handleRedirect();
if (result.errorCode === "InteractionRequired") {
  // No reusable session — fall back to an interactive login.
} else if (!result.errorCode) {
  // Session picked up; getAccessToken() / getUserInfo() reflect it.
}
```

The expected negative outcome — no reusable session — surfaces as the typed `SrgLoginError.InteractionRequired` (public error code `"InteractionRequired"`), mapping the four OIDC authorization errors `login_required`, `interaction_required`, `consent_required`, `account_selection_required`. On Kotlin/iOS, an exhaustive `when` / `switch` over `SrgLoginError` must add this case.

:::warning Guard against redirect loops
A `login_required` answer lands back on your app's start route, so an unguarded automatic attempt bounces forever. Attempt a silent login **at most once per browser session** — for example, set a `sessionStorage` flag before calling `loginSilently()` and skip it if the flag is already set.
:::

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
  <TabItem value="android-tv" label="Android TV / Google TV">

**No redirect handling** — the Device Authorization Grant polls the token endpoint, so there is no intent filter, `onNewIntent`, or callback to wire up.

  </TabItem>
  <TabItem value="ios" label="iOS">

iOS requires **no configuration** — `ASWebAuthenticationSession` manages the entire redirect lifecycle internally. No `Info.plist` changes, no `AppDelegate` URL handling.

  </TabItem>
  <TabItem value="tvos" label="tvOS">

**No redirect handling** — same Device Authorization Grant as Android TV; no `Info.plist` or callback configuration needed.

  </TabItem>
  <TabItem value="web" label="Web">

Web is redirect-based end to end: `login()` navigates the whole page to the IDP, which redirects back to your registered `redirectUri` (e.g. `/callback`). On that route, call `handleRedirect()` to complete the code exchange:

```typescript
// On your callback route (e.g. /callback):
const result = await sdk.handleRedirect();
// `result` carries errorCode / errorMessage on failure;
// on success the session is active (getAccessToken() / getUserInfo() reflect it).
```

  </TabItem>
</Tabs>

## Related

- [Getting Started — Android](/docs/getting-started/android#step-4-implement-login)
- [Getting Started — Android TV / Google TV](/docs/getting-started/android-tv#step-3-implement-login-device-flow)
- [Getting Started — iOS](/docs/getting-started/ios#step-4-implement-login)
- [Getting Started — tvOS](/docs/getting-started/tvos#step-3-implement-login-device-flow)
- [Getting Started — Web](/docs/getting-started/web#step-4-implement-login)
- [Error Handling](/docs/guides/error-handling) — Handle login errors
- [Token Management](/docs/guides/token-management) — What happens after login

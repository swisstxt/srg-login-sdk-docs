---
sidebar_position: 3
---

# iOS Integration

:::info
This guide covers iOS (iPhone/iPad) integration. For tvOS (Apple TV), see [tvOS](/docs/getting-started/tvos).
:::

Step-by-step guide to integrating the **SRG Login SDK** (`SRGLoginCore`) into any iOS app.

## Prerequisites

- Xcode 15+
- iOS 15.0+ deployment target
- Swift 5.9+

---

## Step 1: Add the SDK Dependency

![SDK Version](https://img.shields.io/github/v/tag/swisstxt/srg-login-sdk-distribution-apple?label=SDK%20Version&color=blue)

### Option A: Swift Package Manager (recommended, no authentication)

**Xcode:** File → Add Package Dependencies → enter:
```
https://github.com/swisstxt/srg-login-sdk-distribution-apple
```
Select **Up to Next Major Version** for stable releases, or **Exact Version** for pre-releases (beta/RC).

**Package.swift — stable release:**
```swift
dependencies: [
    .package(
        url: "https://github.com/swisstxt/srg-login-sdk-distribution-apple",
        from: "1.0.0"
    )
]
```

**Package.swift — pre-release (beta / RC):**
```swift
dependencies: [
    .package(
        url: "https://github.com/swisstxt/srg-login-sdk-distribution-apple",
        exact: "1.0.0-beta.8"
    )
]
```

Then add the product to your target:
```swift
.target(
    name: "YourTarget",
    dependencies: [
        .product(name: "SRGLoginSDK", package: "SRGLoginSDK")
    ]
)
```

### Option B: XCFramework (manual)

1. Download the latest `SRGLoginCore.xcframework.zip` from the [releases page](https://github.com/swisstxt/srg-login-sdk-distribution-apple/releases) and unzip it.
2. In Xcode: select your project → app target → **General** tab.
3. Scroll to **Frameworks, Libraries, and Embedded Content** → **+** → **Add Other… → Add Files…**
4. Select `SRGLoginCore.xcframework` → set to **Embed & Sign**.

---

## Step 2: Initialize the SDK

Call `SrgLoginSdk.shared.initialize()` once at app startup — before any login or token operations.

```swift
import SRGLoginCore

// Minimal — uses default token storage config
SrgLoginSdk.shared.initialize()

// Or enable verbose SDK logging in debug builds
SrgLoginSdk.shared.initialize(isDebugBuild: true)

// Or customise token storage keys to avoid collisions with other SDK instances
SrgLoginSdk.shared.initialize(
    tokenStorageConfig: TokenStorageConfig(
        keystoreAlias: "your_app_token_key",
        fileName: "your_app_tokens"
    )
)
```

**Parameter details:**

- **`isDebugBuild`** — Controls the SDK log level:

  | Value | Log level | Visible logs |
  |---|---|---|
  | `true` | DEBUG | All (VERBOSE, DEBUG, INFO, WARNING, ERROR) |
  | `false` | INFO | INFO, WARNING, ERROR only |

- **`tokenStorageConfig`** *(optional)* — Customise the Keychain key alias and file name. Defaults are fine for most apps; override only to avoid collisions when multiple SDK instances coexist.

Then create an `SrgLogin` instance with your OAuth configuration.

### AppIdentity

:::warning
`appId`, `appName`, and `appVersion` must be resolved dynamically at runtime — never hardcode these values.
:::

`businessUnit` and `businessUnitName` must use exact values from the table below. These values are used as Sentry filters — incorrect or custom values will break Sentry dashboards and alerting.

| `businessUnit` | `businessUnitName` |
|---|---|
| `"SRF"` | `"Schweizer Radio und Fernsehen"` |
| `"RTS"` | `"Radio Télévision Suisse"` |
| `"RSI"` | `"Radiotelevisione svizzera di lingua italiana"` |
| `"RTR"` | `"Radiotelevisiun Svizra Rumantscha"` |
| `"SWI"` | `"SWI swissinfo.ch"` |
| `"SWISSTXT"` | `"SWISS TXT"` |
| `"SRG"` | `"SRG SSR"` |

```swift
import SRGLoginCore

let config = SrgLoginConfig(
    clientId: "your-oauth-client-id",
    redirectUri: "your-app-scheme://loginSuccess",
    appIdentity: AppIdentity(
        appId: Bundle.main.bundleIdentifier ?? "",
        appName: Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "",
        appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "",
        businessUnit: "SRF",
        businessUnitName: "Schweizer Radio und Fernsehen"
    ),
    postLogoutRedirectUri: "your-app-scheme://logoutSuccess",
    environment: .prod
)

let srgLogin = SrgLoginSdk.shared.create(config: config)
```

:::danger
The `environment` **must** match the environment in which your `clientId` was registered. Each environment (DEV, INT, PROD) has its own OpenID Connect discovery endpoint. A mismatch results in `invalid_client` errors during login. Confirm with the SRG SSR identity team which environment your `clientId` belongs to.
:::

---

## Step 3: OAuth Redirects

The SRG Login SDK uses `ASWebAuthenticationSession` for all browser-based flows (login, logout, SSO). This API manages the entire OAuth redirect lifecycle internally:

1. The SDK creates an `ASWebAuthenticationSession` with the `redirectUri` from your `SrgLoginConfig`.
2. The system opens a secure browser sheet.
3. After the user authenticates, the IDP redirects to your `redirectUri`.
4. `ASWebAuthenticationSession` intercepts the redirect automatically and returns control to the SDK.

**No configuration needed** — there is no `Info.plist` change required for the OAuth redirect to work. You do not need to:
- Register a `CFBundleURLSchemes` entry in `Info.plist`
- Handle `openURL` callbacks in `AppDelegate` or `SceneDelegate`
- Forward URLs to the SDK

:::info
If your app already has a URL scheme registered in `Info.plist` (e.g. from a previous Cidaas integration or for deep linking), you can keep it — it will not interfere with the SDK.
:::

---

## Step 4: Implement Login

`Credentials.Web` triggers the Authorization Code flow with PKCE via `ASWebAuthenticationSession` — a secure, system-managed browser sheet. The user authenticates in this secure browser, never directly in the app.

Logging in requires an `iOSAuthContext` that provides a presentation anchor for `ASWebAuthenticationSession`:

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
    // Handle error
    print(failure.error)
}
```

---

## Step 5: Implement Logout

**Front-channel logout** — clears the server session and local tokens. Opens a browser briefly to hit the IDP's logout endpoint.

```swift
let authContext = iOSAuthContext(presentationContextProvider: authContextProvider)
let frontChannel = LogoutType.FrontChannel()
try await srgLogin.logout(logoutType: frontChannel, authContext: authContext)
```

> **`postLogoutRedirectUri`** — `nil`: the IDP shows its own confirmation page. Set to your app's URI: the IDP redirects back to your app. In both cases local tokens are cleared and the server session ends.

**Local-only logout** — clears local tokens only, without contacting the server.

```swift
try await srgLogin.logout(method: LogoutMethod.LocalOnly())
```

---

## Step 6: Observe Token State

The SDK exposes a `StateFlow<TokenState>` that emits whenever the token state changes. SKIE wraps it as a native Swift `AsyncSequence`:

```swift
import SRGLoginCore

let tokenStateFlow = SkieSwiftStateFlow<TokenState>(srgLogin.observeTokenState())

for await state in tokenStateFlow {
    guard !Task.isCancelled else { break }
    // state is one of: Valid, ExpiringSoon, Refreshing, Refreshed, Expired, RefreshFailed, NoTokens
    print("Token state: \(state)")
}
```

---

## Step 7: Get Access Token

```swift
// Check if the user is currently authenticated
let isAuthenticated = (try? await srgLogin.isAuthenticated())?.boolValue ?? false

// Get the current access token
let result = try await srgLogin.getAccessToken()

if let success = result as? SdkResultSuccess<AccessToken>, let token = success.data {
    let authHeader = "Bearer \(token.value)"
    // Use for API calls
}

if let failure = result as? SdkResultFailure {
    // e.g. SrgLoginError.NotAuthenticated
    print(failure.error)
}
```

:::tip
Always call `getAccessToken()` at the point of use rather than caching. The SDK refreshes tokens automatically.
:::

---

## Step 8: Open SSO Client

`openSsoClient` opens any URL in an `ASWebAuthenticationSession` with the user's IDP session cookie injected. The user is silently authenticated via SSO.

```swift
let authContext = iOSAuthContext(presentationContextProvider: authContextProvider)

_ = try? await srgLogin.openSsoClient(
    ssoClientUrl: "https://settings.srgssr.ch/profile?prompt=none",
    authContext: authContext
)
```

The browser is dismissed automatically when the session ends or the user closes it. `prompt=none` suppresses any login prompt if the SSO session has expired.

---

## Step 9: Error Handling

```swift
import SRGLoginCore

func handleError(_ error: SrgLoginError) {
    switch error {
    case is SrgLoginError.NetworkError:
        // No internet connection
        break
    case is SrgLoginError.UserCancelled:
        // User dismissed the login flow
        break
    case is SrgLoginError.InvalidGrant:
        // Session expired, re-login needed
        break
    case is SrgLoginError.TokenExpired:
        // Token expired, re-login needed
        break
    case is SrgLoginError.NotAuthenticated:
        // User is not logged in
        break
    default:
        // Unexpected error
        break
    }
}
```

---

## Step 10: Reconfiguration

To switch environments or update the OAuth config at runtime:

```swift
SrgLoginSdk.shared.shutdown()
// Then call initialize(...) and create(config:) again with the new config
```

:::warning
Always cancel any active `observeTokenState()` loop before calling `shutdown()`.
:::

---

## SDK API Reference

| Class / Protocol | Module | Notes |
|---|---|---|
| `SrgLoginSdk` | `SRGLoginCore` | Singleton via `.shared` |
| `SrgLogin` | `SRGLoginCore` | Created via `SrgLoginSdk.shared.create(config:)` |
| `SrgLoginConfig` | `SRGLoginCore` | OAuth configuration |
| `AppIdentity` | `SRGLoginCore` | App metadata for Sentry |
| `iOSAuthContext` | `SRGLoginCore` | Wraps `ASWebAuthenticationPresentationContextProviding` |
| `Credentials` | `SRGLoginCore` | Sealed class — use `Credentials.Web` |
| `TokenState` | `SRGLoginCore` | 7 states (Valid, ExpiringSoon, etc.) |
| `LogoutType` | `SRGLoginCore` | `FrontChannel` / `LocalOnly` / `BackChannel` |
| `SrgLoginError` | `SRGLoginCore` | Error sealed class |
| `SdkResultSuccess` | `SRGLoginCore` | Generic success wrapper |
| `SdkResultFailure` | `SRGLoginCore` | Generic failure wrapper |
| `SkieSwiftStateFlow` | `SRGLoginCore` | SKIE wrapper for Kotlin `StateFlow` |
| `SkieSwiftFlow` | `SRGLoginCore` | SKIE wrapper for Kotlin `Flow` |

:::info
All SDK types are in the `SRGLoginCore` module — a single import covers everything. SKIE-generated wrappers (`SkieSwiftStateFlow`, `SkieSwiftFlow`) are also in this module.
:::

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `No such module 'SRGLoginCore'` | SPM package not added or XCFramework not embedded | Add via File → Add Package Dependencies or embed XCFramework with "Embed & Sign" |
| SPM resolution fails with "repository not found" | Wrong URL | Use `https://github.com/swisstxt/srg-login-sdk-distribution-apple` |
| `invalid_client` in browser during login | Environment mismatch | Verify `environment` matches your `clientId` registration |
| `ASWebAuthenticationSession` shows blank page | `redirectUri` mismatch | Verify exact `redirectUri` with the SRG SSR identity team |
| Token observation never fires | Missing SKIE wrapper | Use `SkieSwiftStateFlow<TokenState>(srgLogin.observeTokenState())` |
| Crash on `SkieSwiftFlow` | Used before SDK initialization | Call `SrgLoginSdk.shared.initialize()` before any other SDK operation |

---

## Related

- [Migration Guide (Cidaas → SRG Login)](/docs/migration/ios) — Migrate from the Cidaas SDK
- [SDK Documentation Portal](https://swisstxt.github.io/srg-login-sdk-docs/) — Full SDK documentation
- [SDK Distribution — Apple](https://github.com/swisstxt/srg-login-sdk-distribution-apple) — SDK artifacts
- [iOS Sample App](https://github.com/swisstxt/srg-login-sdk-sample-ios) — Working SwiftUI reference implementation

---
sidebar_position: 3
---

# Cidaas → SRG Login SDK (iOS)

This guide helps BU developers migrate their iOS applications from the **Cidaas SDK** (`cidaas-sdk-ios-v2`) to the **SRG Login SDK** (`SRGLoginCore`).

---

## Why Migrate?

| | Cidaas SDK | SRG Login SDK |
|---|---|---|
| **Maintainer** | Cidaas (third-party) | SRG SSR Login team |
| **Platform** | iOS only | Kotlin Multiplatform (Android, iOS, TV, Web, JVM) |
| **Architecture** | Callbacks / closures | Swift async/await via SKIE |
| **Token storage** | Cidaas internal | iOS Keychain (hardware-backed) |
| **Token refresh** | Manual | Automatic (proactive refresh) |
| **Logout** | Broken (workaround needed) | Built-in (local, front-channel, back-channel) |
| **Error handling** | `NSError` / opaque errors | Typed Swift enums (sealed classes via SKIE) |
| **IDP coupling** | Cidaas-specific | IDP-agnostic (works with any OAuth 2.0/OIDC provider) |
| **Distribution** | SPM / CocoaPods | Swift Package Manager (XCFramework) |

---

## Migration Overview

| Step | What to do |
|------|------------|
| 1 | Remove Cidaas dependency and `Cidaas.plist` |
| 2 | Install SRG Login SDK via SPM or XCFramework |
| 3 | URL Scheme — no change needed |
| 4 | Replace `Cidaas.shared` with `SrgLoginSdk.shared.initialize()` + `.create(config:)` |
| 5 | Replace `loginWithBrowser` closure with `srgLogin.login()` async/await |
| 6 | Replace custom logout workaround with `srgLogin.logout()` |
| 7 | Clean up removed dependencies and files |

---

## Step 1: Remove Cidaas

**CocoaPods:**

```ruby
# Podfile — remove this line:
pod 'Cidaas'
```

Then run:

```bash
pod install
```

**Swift Package Manager:** In Xcode, go to the project navigator → select the project → **Package Dependencies** → select the Cidaas package → click **–** to remove it.

**Delete `Cidaas.plist`.** Its fields are replaced by `SrgLoginConfig` in code (see Step 4).

---

## Step 2: Install SRG Login SDK

### Swift Package Manager (recommended)

In Xcode: **File > Add Package Dependencies** → enter:

```
https://github.com/swisstxt/srg-login-sdk-distribution-apple
```

Select **Up to Next Major Version** for stable releases, or **Exact Version** for pre-releases (beta/RC).

### XCFramework (manual)

1. Download the latest `SRGLoginCore.xcframework.zip` from the [releases page](https://github.com/swisstxt/srg-login-sdk-distribution-apple/releases) and unzip it.
2. In Xcode: select your project → app target → **General** tab.
3. Scroll to **Frameworks, Libraries, and Embedded Content** → **+** → **Add Other… → Add Files…**
4. Select `SRGLoginCore.xcframework` → **Embed & Sign**.

> See the [iOS Integration Guide](/docs/getting-started/ios) for full setup instructions.

---

## Step 3: URL Scheme — No Change Needed

Your existing `CFBundleURLSchemes` entry in `Info.plist` stays the same. The only requirement is that the scheme matches the `redirectUri` you pass to `SrgLoginConfig`.

```xml
<!-- Info.plist — no changes needed -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>  <!-- same scheme as before -->
        </array>
    </dict>
</array>
```

The SRG Login SDK uses `ASWebAuthenticationSession` which handles the OAuth redirect internally. **No `AppDelegate` or `SceneDelegate` URL forwarding needed.**

:::info
If your app already has a URL scheme from a previous Cidaas integration, you can keep it — it will not interfere with the SDK. But it is not required for authentication.
:::

---

## Step 4: Replace SDK Initialization

### Before (Cidaas)

```swift
import Cidaas

// Cidaas.plist held DomainURL, ClientId, RedirectURL, CidaasVersion
let cidaas = Cidaas.shared
```

### After (SRG Login SDK)

Two-step initialization:

```swift
import SRGLoginCore

// Step 1: Initialize the SDK
SrgLoginSdk.shared.initialize(isDebugBuild: true)

// Step 2: Create an SrgLogin instance with OAuth config
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

### Configuration Mapping

| Cidaas (`Cidaas.plist`) | SRG Login SDK (`SrgLoginConfig`) |
|---|---|
| `DomainURL` | `environment` (enum: `.dev`, `.int`, `.prod`) |
| `ClientId` | `clientId` |
| `RedirectURL` | `redirectUri` |
| `CidaasVersion` | Not needed |
| — | `appIdentity` (NEW, required) |

### Environment Mapping

| Cidaas `DomainURL` | SRG Login SDK `Environment` |
|---|---|
| `https://account-dev.srgssr.ch` | `.dev` |
| `https://account-int.srgssr.ch` | `.int` |
| `https://account.srgssr.ch` | `.prod` |

:::warning
The `environment` **must** match the environment in which your `clientId` was registered. A mismatch results in `invalid_client` errors during login.
:::

> `appId`, `appName`, and `appVersion` must be resolved dynamically at runtime — never hardcode these values. See [Business Unit Identities](/docs/reference/bu-identities) for the full list of `businessUnit` / `businessUnitName` values.

---

## Step 5: Replace Login

### Before (Cidaas) — Closure-based

```swift
cidaas.loginWithBrowser(delegate: self, extraParams: [:]) { result in
    switch result {
    case let .success(response):
        // Handle token
    case let .failure(error):
        // Handle error
    }
}
```

### After (SRG Login SDK) — async/await

First, add a presentation context provider for `ASWebAuthenticationSession`:

```swift
import AuthenticationServices

class AuthContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
```

Then perform login:

```swift
import SRGLoginCore

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

**Key differences:**
- Closure `Result<T, Error>` → Swift **async/await** with `SdkResult`
- `ASWebAuthenticationSession` is managed by the SDK (no manual setup)
- Embedded `WKWebView` login (CidaasView) is no longer supported — `ASWebAuthenticationSession` only

---

## Step 6: Replace Logout

### Before (Cidaas) — Custom workaround

```swift
// Had to manually build end_session URL and open ASWebAuthenticationSession
CidaasLogoutManager.shared.logout(
    idToken: myIDToken,
    postLogoutRedirectUri: "myapp://logout"
) { result in
    // ...
}
```

### After (SRG Login SDK) — Built-in

**Front-channel logout** — clears the server session and local tokens:

```swift
let authContext = iOSAuthContext(presentationContextProvider: authContextProvider)
let frontChannel = LogoutType.FrontChannel()
try await srgLogin.logout(logoutType: frontChannel, authContext: authContext)
```

**Local-only logout** — clears local tokens only:

```swift
try await srgLogin.logout(method: LogoutMethod.LocalOnly())
```

You can **delete the entire `CidaasLogoutManager` class** — the SDK handles everything natively.

---

## Step 7: Clean Up

After migration, remove the following from your project:

- [ ] `Cidaas.plist` — Cidaas configuration file
- [ ] `CidaasLogoutManager.swift` — custom logout workaround
- [ ] All `import Cidaas` imports
- [ ] `Cidaas.shared` references
- [ ] `CidaasView` / WKWebView embedded browser login code
- [ ] `WKNavigationDelegate` methods that forwarded to `CidaasView`
- [ ] The Cidaas SPM package or CocoaPods dependency
- [ ] Search for remaining references: `cidaas`, `Cidaas`, `CidaasView`, `CidaasLogoutManager`

---

## API Mapping Reference

| Cidaas SDK | SRG Login SDK | Notes |
|---|---|---|
| `Cidaas.shared` | `SrgLoginSdk.shared.initialize()` + `.create(config:)` | Two-step init |
| `Cidaas.plist` | `SrgLoginConfig(...)` | Plist → Swift code |
| `DomainURL` | `.int` / `.prod` | Enum instead of raw URL |
| `ClientId` | `clientId` | Same value |
| `RedirectURL` | `redirectUri` | Same value |
| `loginWithBrowser(delegate:completion:)` | `srgLogin.login(credentials:authContext:)` | async/await |
| `loginWithEmbeddedBrowser(delegate:completion:)` | `srgLogin.login(credentials: .web, authContext:)` | ASWebAuthenticationSession only |
| `getUserInfo(accessToken:completion:)` | `srgLogin.getAccessToken()` + manual UserInfo call | JWT claims available directly |
| Closure `Result<T, Error>` | `SdkResult<T>` | Type-safe sealed class |
| `NSError` / opaque errors | `SrgLoginError` | Type-safe sealed class |
| `CidaasLogoutManager` (workaround) | `srgLogin.logout(logoutType:authContext:)` | Built-in |
| N/A | `srgLogin.getAccessToken()` | Auto-refresh, available anytime |
| N/A | `srgLogin.observeTokenState()` | Reactive token monitoring |
| N/A | `srgLogin.openSsoClient(url, authContext)` | Open authenticated web pages |

---

## FAQ

### Do I need to change anything in the Cidaas Admin UI?

No. Your `clientId`, `redirectUri`, scopes, and app configuration remain unchanged.

### Will users need to log in again after migration?

Yes. The token storage is different (iOS Keychain vs Cidaas internal), so existing tokens are not migrated.

### Can I delete the CidaasLogoutManager workaround?

Yes. The SRG Login SDK provides built-in front-channel and back-channel logout. The entire `CidaasLogoutManager` class can be deleted.

### Does the SRG Login SDK support WKWebView embedded login?

No. The SDK uses `ASWebAuthenticationSession` exclusively. This is a security best practice — embedded WKWebView login allows the host app to intercept credentials.

### Can I use both SDKs during a transition period?

Not recommended. Both SDKs would manage tokens independently, causing conflicts. Migrate completely in one step.

### Do I need to handle the redirect URL in AppDelegate/SceneDelegate?

No. The SRG Login SDK uses `ASWebAuthenticationSession` which captures the redirect internally.

---

## Related

- [iOS Integration Guide](/docs/getting-started/ios) — Full step-by-step SDK integration
- [iOS Sample App](https://github.com/swisstxt/srg-login-sdk-sample-ios) — Working SwiftUI reference implementation
- [Error Handling](/docs/guides/error-handling) — SrgLoginError types and patterns
- [Token Management](/docs/guides/token-management) — Token refresh, monitoring, states
- [Business Unit Identities](/docs/reference/bu-identities) — AppIdentity values

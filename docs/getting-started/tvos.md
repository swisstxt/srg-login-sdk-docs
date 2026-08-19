---
sidebar_position: 5
---

# tvOS (Apple TV)

Integrate the **SRG Login SDK** on tvOS using the **OAuth 2.0 Device Authorization Grant** (RFC 8628) — the user authorizes on a second device (iPhone/computer), with no on-TV browser.

:::info Reuses the Apple package
tvOS consumes the **same** Swift Package as iOS (`srg-login-sdk-distribution-apple`; the XCFramework ships tvOS slices). The only difference is the login method: `LoginMethod.Device.shared` with a `TvOSAuthContext`, instead of the browser-based `LoginMethod.Web.shared`.
:::

---

## Step 1: Add the SDK Dependency

Same Swift Package as iOS (zero-auth). No stable `1.0.0` is released yet, and SPM pre-releases require an **exact** pin:

```swift
dependencies: [
    .package(
        url: "https://github.com/swisstxt/srg-login-sdk-distribution-apple",
        exact: "1.0.0-rc.2"
    )
]
```

Add the `SRGLoginSDK` product to your tvOS target. The package declares the `.tvOS` platform, so no extra configuration is needed.

---

## Step 2: Initialize the SDK

```swift
import SRGLoginCore

// Once, at app start:
SrgLoginSdk.shared.initialize(isDebugBuild: true)

// Then create an SrgLogin instance. Device flow has no browser callback,
// but SrgLoginConfig still requires a redirectUri — use a placeholder:
let config = SrgLoginConfig(
    clientId: "<your-client-id>",
    redirectUri: "tvapp://device-flow",
    appIdentity: AppIdentity(
        appId: Bundle.main.bundleIdentifier ?? "ch.example.tvos",
        appName: "My tvOS App",
        appVersion: "1.0.0",
        businessUnit: "SRF",
        businessUnitName: "Schweizer Radio und Fernsehen"
    ),
    environment: .int
)
let srgLogin = SrgLoginSdk.shared.create(config: config)
```

> See [Business Units](/docs/reference/bu-identities) for the exact `businessUnit` / `businessUnitName` values, and confirm your `clientId` is registered for device flow in the target `environment`.

---

## Step 3: Implement Login (Device Flow)

Login uses `LoginMethod.Device.shared` with a `TvOSAuthContext`. The SDK emits `LoginState.AwaitingDeviceActivation` with a user code + verification URL to display, then polls until the user authorizes on their phone/computer:

```swift
let loginFlow = srgLogin.login(
    loginMethod: LoginMethod.Device.shared,
    authContext: TvOSAuthContext(),
    additionalScopes: ["profile", "email", "offline_access"]
)

for await state in SkieSwiftFlow<LoginState>(loginFlow) {
    if let pending = state as? LoginState.AwaitingDeviceActivation {
        // Show pending.userCode + pending.verificationUri on the TV
        // (or render a QR code of pending.verificationUriComplete).
        // pending.expiresIn is how long the code stays valid.
    }
    if let success = state as? LoginState.Success { /* Authenticated — success.tokenSet */ }
    if let failure = state as? LoginState.Failure { /* Handle failure.error */ }
}
```

> On tvOS 16+, `LoginMethod.Web.shared` is also available (the system routes the browser flow to a paired iPhone/iPad via Continuity). The **Device Authorization Grant remains the recommended flow**.

---

## Step 4: Implement Logout

Device-flow apps have no on-TV browser, so logout is **local-only** (clears the stored tokens):

```swift
try await srgLogin.logout(logoutType: LogoutType.LocalOnly.shared)
```

---

## Step 5: Get Access Token

Token access is identical to iOS — the API is shared:

```swift
let result = try await srgLogin.getAccessToken()
```

See [iOS Getting Started](/docs/getting-started/ios) for the full `TokenState` / access-token handling.

---

## SDK API Reference

| Symbol | Module | Notes |
|---|---|---|
| `LoginMethod.Device` | `SRGLoginCore` | Device Authorization Grant (RFC 8628) — use `.shared` |
| `TvOSAuthContext` | `SRGLoginCore` | tvOS auth context |
| `LoginState.AwaitingDeviceActivation` | `SRGLoginCore` | `userCode`, `verificationUri`, `verificationUriComplete`, `expiresIn` |

Everything else — `SrgLoginSdk`, `SrgLoginConfig`, `TokenState`, `SdkResult`, … — is shared with [iOS](/docs/getting-started/ios).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Login never completes | The user did not authorize on the second device | Keep `userCode` + `verificationUri` visible; the code expires after `expiresIn` |
| `invalid_client` | `clientId` not registered for device flow, or wrong `Environment` | Confirm the client + environment with the SRG SSR identity team |

---

## Related

- [iOS Getting Started](/docs/getting-started/ios) — the shared package and common API
- [tvOS Sample](https://github.com/swisstxt/srg-login-sdk-sample-ios) — the `SRGLoginTvOS` target in the iOS sample repository
- [Authentication guide](/docs/guides/authentication) — the tvOS tab

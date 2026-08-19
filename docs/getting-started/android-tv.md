---
sidebar_position: 4
---

# Android TV / Google TV

Integrate the **SRG Login SDK** on Android TV and Google TV using the **OAuth 2.0 Device Authorization Grant** (RFC 8628) — the user authorizes on a second device (phone/computer), with no on-TV browser.

:::info Reuses the Android artifact
Android TV and Google TV consume the **same** Maven artifact as Android (`ch.srg.login:srglogin-core-android`). The only difference is the login method: `LoginMethod.Device` with an `AndroidTvAuthContext`, instead of the browser-based `LoginMethod.Web`.
:::

---

## Step 1: Add the SDK Dependency

Same distribution as Android — GitHub Pages Maven (zero-auth). In `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://swisstxt.github.io/srg-login-sdk-distribution-android/") }
    }
}
```

Pin the version in `gradle/libs.versions.toml` (no stable `1.0.0` is released yet — use the release candidate):

```toml
[versions]
srglogin = "1.0.0-rc.2"

[libraries]
srglogin-core = { group = "ch.srg.login", name = "srglogin-core-android", version.ref = "srglogin" }
```

In your `AndroidManifest.xml`, request internet access and declare the app as a Leanback (TV) app:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-feature android:name="android.software.leanback" android:required="true" />
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />
```

> Device flow needs **no** OAuth redirect intent filters and no `launchMode` tweaks — there is no browser callback on the TV.

---

## Step 2: Initialize the SDK

Initialize once in your `Application`, then create an `SrgLogin` instance. Device flow has no browser callback, but `SrgLoginConfig` still requires a `redirectUri` — use a placeholder:

```kotlin
// Application.onCreate()
SrgLoginSdk.initialize(platformContext = this, isDebugBuild = BuildConfig.DEBUG)

// Then, where you need it:
val config = SrgLoginConfig(
    clientId = "<your-client-id>",
    redirectUri = "tvapp://device-flow", // placeholder — device flow has no browser callback
    appIdentity = AppIdentity(
        appId = packageName,
        appName = applicationInfo.loadLabel(packageManager).toString(),
        appVersion = packageManager.getPackageInfo(packageName, 0).versionName ?: "unknown",
        businessUnit = "SRF",
        businessUnitName = "Schweizer Radio und Fernsehen",
    ),
    environment = Environment.INT,
)
val srgLogin = SrgLoginSdk.create(config)
```

> See [Business Units](/docs/reference/bu-identities) for the exact `businessUnit` / `businessUnitName` values, and confirm your `clientId` is registered for device flow in the target `environment`.

---

## Step 3: Implement Login (Device Flow)

Login uses `LoginMethod.Device` with an `AndroidTvAuthContext` (no Activity needed). The SDK emits `LoginState.AwaitingDeviceActivation` with a user code + verification URL to display, then polls until the user authorizes on their phone or computer:

```kotlin
import ch.srg.login.sdk.auth.AndroidTvAuthContext
import ch.srg.login.sdk.auth.LoginMethod
import ch.srg.login.sdk.auth.LoginState

val authContext = AndroidTvAuthContext(context = applicationContext)

srgLogin
    .login(
        loginMethod = LoginMethod.Device,
        authContext = authContext,
        additionalScopes = listOf("profile", "email"),
    )
    .collect { state ->
        when (state) {
            is LoginState.AwaitingDeviceActivation -> {
                // Show state.userCode + state.verificationUri on the TV
                // (or render a QR code of state.verificationUriComplete).
                // state.expiresIn is how long the code stays valid.
            }
            is LoginState.Success -> { /* Authenticated — state.tokenSet */ }
            is LoginState.Failure -> { /* Handle state.error */ }
        }
    }
```

> The user opens `verificationUri` on a phone/computer, enters `userCode`, and authenticates there. The TV screen updates to `Success` once approved.

---

## Step 4: Implement Logout

Device-flow apps have no on-TV browser, so logout is **local-only** (clears the stored tokens) — the default `logout()`:

```kotlin
srgLogin.logout() // LogoutType.LocalOnly by default
```

---

## Step 5: Observe Token State / Get Access Token

Token observation and access are identical to Android — the API is shared:

```kotlin
srgLogin.observeTokenState().collect { state -> /* Valid, ExpiringSoon, …, Uninitialized */ }

val result = srgLogin.getAccessToken()
```

See [Android — Observe Token State](/docs/getting-started/android#step-6-observe-token-state) for the full `TokenState` handling.

---

## SDK API Reference

| Symbol | Package | Notes |
|---|---|---|
| `LoginMethod.Device` | `ch.srg.login.sdk.auth` | Device Authorization Grant (RFC 8628) |
| `AndroidTvAuthContext` | `ch.srg.login.sdk.auth` | TV auth context (no Activity) |
| `LoginState.AwaitingDeviceActivation` | `ch.srg.login.sdk.auth` | `userCode`, `verificationUri`, `verificationUriComplete`, `expiresIn` |

Everything else — `SrgLoginSdk`, `SrgLoginConfig`, `TokenState`, `SdkResult`, … — is shared with [Android](/docs/getting-started/android#sdk-package-reference).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Login never completes | The user did not authorize on the second device | Keep `userCode` + `verificationUri` visible; the code expires after `expiresIn` |
| `invalid_client` | `clientId` not registered for device flow, or wrong `Environment` | Confirm the client + environment with the SRG SSR identity team |

---

## Related

- [Android Getting Started](/docs/getting-started/android) — the shared artifact and common API
- [Android TV Sample](https://github.com/swisstxt/srg-login-mobile-sdk) — the `androidTvApp/` module in the SDK repository
- [Authentication guide](/docs/guides/authentication) — the Android TV tab

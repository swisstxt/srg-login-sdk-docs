---
sidebar_position: 2
---

# Android Integration

:::info
This guide covers Android smartphone and tablet integration. For Android TV, see [Android TV](/docs/getting-started/android-tv).
:::

Step-by-step guide to integrating the **SRG Login SDK** (`srglogin-core-android`) into any Android app.

## Prerequisites

- Android Studio (latest stable)
- minSdk 21 (Android 5.0+)

---

## Step 1: Add the SDK Dependency

![SDK Version](https://img.shields.io/badge/dynamic/xml?url=https://swisstxt.github.io/srg-login-sdk-distribution-android/ch/srg/login/srglogin-core-android/maven-metadata.xml&query=//latest&label=SDK%20Version&color=blue)

### Option A: GitHub Pages Maven (recommended, no authentication)

Add the repository to your `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://swisstxt.github.io/srg-login-sdk-distribution-android/") }
    }
}
```

No credentials needed — the repository is publicly accessible.

### Option B: GitHub Packages (requires PAT + SSO)

This option requires a GitHub account with access to the `swisstxt` organization.

**1. Create a GitHub Personal Access Token (PAT):**

Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)** and generate a token with scopes: `repo`, `read:packages`, `read:org`.

**2. Authorize for SAML SSO (Critical):**

On the Personal access tokens page → **Configure SSO** → **Authorize** next to the `swisstxt` organization. Without this step, Gradle will receive `401 Unauthorized` errors.

**3. Configure Gradle credentials** in `~/.gradle/gradle.properties`:

```properties
gpr.user=<your-github-username>
gpr.key=<your-personal-access-token>
```

**4. Add the repository** to `settings.gradle.kts`:

```kotlin
maven {
    url = uri("https://maven.pkg.github.com/swisstxt/srg-login-mobile-sdk")
    credentials {
        username = providers.gradleProperty("gpr.user").orNull
            ?: System.getenv("GITHUB_ACTOR")
        password = providers.gradleProperty("gpr.key").orNull
            ?: System.getenv("GITHUB_TOKEN")
    }
}
```

### Add the dependency

In your version catalog (`gradle/libs.versions.toml`):

```toml
[versions]
srglogin = "1.0.0-beta.3"

[libraries]
srglogin-core = { group = "ch.srg.login", name = "srglogin-core-android", version.ref = "srglogin" }
```

In your module-level `build.gradle.kts`:

```kotlin
dependencies {
    implementation(libs.srglogin.core)
}
```

---

## Step 2: Initialize the SDK

Call `SrgLoginSdk.initialize()` once in your `Application.onCreate()`:

```kotlin
import ch.srg.login.sdk.SrgLoginSdk

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Minimal — uses default token storage config
        SrgLoginSdk.initialize(
            platformContext = this,
            isDebugBuild = BuildConfig.DEBUG,
        )

        // Or customise token storage keys to avoid collisions with other SDK instances
        // SrgLoginSdk.initialize(
        //     platformContext = this,
        //     isDebugBuild = BuildConfig.DEBUG,
        //     tokenStorageConfig = TokenStorageConfig(
        //         keystoreAlias = "your_app_token_key",
        //         fileName = "your_app_tokens",
        //     ),
        // )
    }
}
```

**Parameter details:**

- **`isDebugBuild`** — Controls the SDK log level:

  | Value | Log level | Visible logs |
  |---|---|---|
  | `true` | DEBUG | All (VERBOSE, DEBUG, INFO, WARNING, ERROR) |
  | `false` | INFO | INFO, WARNING, ERROR only |

- **`tokenStorageConfig`** *(optional)* — Customise the Android Keystore alias and encrypted file name. Defaults are fine for most apps; override only to avoid collisions when multiple SDK instances coexist.

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

```kotlin
import ch.srg.login.sdk.SrgLoginSdk
import ch.srg.login.sdk.config.SrgLoginConfig
import ch.srg.login.sdk.config.AppIdentity
import ch.srg.login.sdk.config.Environment

val appVersion = packageManager.getPackageInfo(packageName, 0).versionName ?: "unknown"

val config = SrgLoginConfig(
    clientId = "your-oauth-client-id",
    redirectUri = "your-app-scheme://callback",
    postLogoutRedirectUri = "your-app-scheme://logout",
    appIdentity = AppIdentity(
        appId = packageName,
        appName = applicationInfo.loadLabel(packageManager).toString(),
        appVersion = appVersion,
        businessUnit = "SRF",
        businessUnitName = "Schweizer Radio und Fernsehen",
    ),
    environment = Environment.INT,
)

val srgLogin = SrgLoginSdk.create(config)
```

:::danger
The `environment` **must** match the environment in which your `clientId` was registered. Each environment (DEV, INT, PROD) has its own OpenID Connect discovery endpoint. A mismatch results in `invalid_client` errors during login. Confirm with the SRG SSR identity team which environment your `clientId` belongs to.
:::

---

## Step 3: Configure OAuth Redirects

### Internet Permission

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### Manifest Configuration

Your activity must use `android:launchMode="singleTask"` and declare intent filters for the OAuth callbacks:

```xml
<activity
    android:name=".YourActivity"
    android:exported="true"
    android:launchMode="singleTask">

    <!-- Login callback -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="your-app-scheme"
            android:host="callback" />
    </intent-filter>

    <!-- Logout callback -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="your-app-scheme"
            android:host="logout" />
    </intent-filter>
</activity>
```

### Handle the Redirect in Code

```kotlin
import ch.srg.login.sdk.handleRedirect  // Top-level function!

override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleRedirect(intent)
}
```

:::tip
`handleRedirect` is a **top-level function** — not a method on `SrgLoginSdk`. Import it directly.
:::

---

## Step 4: Implement Login

`Credentials.Web` triggers the Authorization Code flow with PKCE via Chrome Custom Tabs — a secure, sandboxed browser tab. The user authenticates in this secure browser, never directly in the app.

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
                // Handle error (see Step 9)
            }
            else -> { /* Intermediate states */ }
        }
    }
```

---

## Step 5: Implement Logout

**Front-channel logout** — clears the server session and local tokens. Opens Chrome Custom Tabs briefly to hit the IDP's logout endpoint.

```kotlin
import ch.srg.login.sdk.auth.LogoutType

val authContext = AndroidAuthContext(context = activity, activity = activity)
srgLogin.logout(
    logoutType = LogoutType.FrontChannel(),
    authContext = authContext,
)
```

**Local-only logout** — clears local tokens only, without contacting the server.

```kotlin
srgLogin.logout(logoutType = LogoutType.LocalOnly)
```

---

## Step 6: Observe Token State

```kotlin
srgLogin.observeTokenState().collect { state ->
    when (state) {
        TokenState.Valid          -> { /* Token is valid */ }
        TokenState.ExpiringSoon  -> { /* Token expires soon */ }
        TokenState.Refreshing    -> { /* Refresh in progress */ }
        is TokenState.Refreshed  -> { /* New token obtained */ }
        TokenState.Expired       -> { /* Waiting for refresh or re-auth */ }
        is TokenState.RefreshFailed -> { /* Refresh failed */ }
        TokenState.NoTokens      -> { /* No tokens, show login */ }
    }
}
```

---

## Step 7: Get Access Token

```kotlin
// Check if the user is currently authenticated
val isAuthenticated: Boolean = srgLogin.isAuthenticated()

// Get the current access token
when (val result = srgLogin.getAccessToken()) {
    is SdkResult.Success -> {
        val authHeader = "Bearer ${result.data.value}"
        // Use for API calls
    }
    is SdkResult.Failure -> {
        // e.g. SrgLoginError.NotAuthenticated
        handleError(result.error)
    }
}
```

:::tip
Always call `getAccessToken()` at the point of use rather than caching. The SDK refreshes tokens automatically.
:::

---

## Step 8: Open SSO Client

`openSsoClient` opens any URL in Chrome Custom Tabs with the user's IDP session cookie injected. The user is silently authenticated via SSO.

```kotlin
val authContext = AndroidAuthContext(context = activity, activity = activity)

srgLogin.openSsoClient(
    ssoClientUrl = "https://settings.srgssr.ch/profile",
    authContext = authContext,
)
```

---

## Step 9: Error Handling

```kotlin
import ch.srg.login.sdk.errors.SrgLoginError

when (error) {
    is SrgLoginError.NetworkError     -> { /* No internet connection */ }
    is SrgLoginError.UserCancelled    -> { /* User dismissed the login flow */ }
    is SrgLoginError.InvalidGrant     -> { /* Session expired, re-login needed */ }
    is SrgLoginError.TokenExpired     -> { /* Token expired, re-login needed */ }
    is SrgLoginError.NotAuthenticated -> { /* User is not logged in */ }
    else                              -> { /* Unexpected error */ }
}
```

---

## Step 10: Reconfiguration

To switch environments or update the OAuth config at runtime:

```kotlin
SrgLoginSdk.shutdown()
// Then call initialize(...) and create(config) again with the new config
```

:::warning
Always cancel any active `observeTokenState()` collection before calling `shutdown()`.
:::

---

## SDK Package Reference

| Class / Function | Package |
|---|---|
| `SrgLoginSdk` | `ch.srg.login.sdk` |
| `SrgLogin` | `ch.srg.login.sdk` |
| `SrgLoginConfig` | `ch.srg.login.sdk` |
| `AppIdentity` | `ch.srg.login.sdk` |
| `Environment` | `ch.srg.login.sdk` |
| `handleRedirect()` | `ch.srg.login.sdk` *(top-level function)* |
| `AndroidAuthContext` | `ch.srg.login.sdk.auth` |
| `Credentials` | `ch.srg.login.sdk.auth` |
| `LoginState` | `ch.srg.login.sdk.auth` |
| `TokenState` | `ch.srg.login.sdk.auth` |
| `LogoutType` | `ch.srg.login.sdk.auth` |
| `SrgLoginError` | `ch.srg.login.sdk.errors` *(plural)* |
| `SdkResult` | `ch.srg.login.sdk.result` |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `401 Unauthorized` during Gradle sync | PAT missing SAML SSO authorization | Configure SSO → Authorize for `swisstxt` |
| `Could not resolve ch.srg.login:srglogin-core-android` | Missing repository | Add the `maven` block to `settings.gradle.kts` |
| `Unresolved reference: handleRedirect` | Wrong import | Import `ch.srg.login.sdk.handleRedirect` (top-level) |
| `Unresolved reference: SrgLoginError` | Wrong package | Use `ch.srg.login.sdk.errors` (plural) |
| `invalid_client` in browser during login | Environment mismatch | Verify `Environment` matches your `clientId` registration |
| `Failed to fetch OpenID config` | Using `Environment.DEV` | Only `Environment.INT` and `Environment.PROD` are available |

---

## Related

- [Migration Guide (Cidaas → SRG Login)](/docs/migration/android) — Migrate from the Cidaas SDK
- [SDK Documentation Portal](https://swisstxt.github.io/srg-login-sdk-docs/) — Full SDK documentation
- [SDK Distribution — Android](https://github.com/swisstxt/srg-login-sdk-distribution-android) — SDK artifacts
- [Android Sample App](https://github.com/swisstxt/srg-login-sdk-sample-android) — Working reference implementation

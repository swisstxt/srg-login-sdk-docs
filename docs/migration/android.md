---
sidebar_position: 2
---

# Cidaas → SRG Login SDK (Android)

This guide helps BU developers migrate their Android applications from the **Cidaas SDK** (`cidaas-sdk-android-v2`) to the **SRG Login SDK** (`srglogin-core-android`).

---

## Why Migrate?

| | Cidaas SDK | SRG Login SDK |
|---|---|---|
| **Maintainer** | Cidaas (third-party) | SRG SSR Login team |
| **Platform** | Android only | Kotlin Multiplatform (Android, iOS, TV, Web, JVM) |
| **Architecture** | Callbacks | Coroutines + Flow |
| **Token storage** | Cidaas internal | Android Keystore (hardware-backed) |
| **Token refresh** | Manual | Automatic (proactive refresh) |
| **Logout** | Broken (workaround needed) | Built-in (local, front-channel, back-channel) |
| **Error handling** | `WebAuthError` (opaque) | Sealed class `SrgLoginError` (type-safe) |
| **IDP coupling** | Cidaas-specific | IDP-agnostic (works with any OAuth 2.0/OIDC provider) |
| **Min SDK** | 26 | 21 |

---

## Migration Overview

| Step | What to do |
|------|------------|
| 1 | Replace the dependency (Jitpack → GitHub Pages Maven) |
| 2 | Remove `cidaas.xml`, configure in Kotlin |
| 3 | Replace `Cidaas.getInstance()` with `SrgLoginSdk.initialize()` + `SrgLoginSdk.create()` |
| 4 | Update the AndroidManifest (redirect intent filters + logout callback) |
| 5 | Replace `loginWithBrowser()` callback with `srgLogin.login()` Flow |
| 6 | Replace custom logout with `srgLogin.logout()` |
| 7 | Clean up removed dependencies and files |

---

## Step 1: Replace the Dependency

### Remove Cidaas

**settings.gradle.kts** — Remove the Jitpack repository:

```kotlin
// REMOVE
maven {
    url = uri("https://jitpack.io")
}
```

**app/build.gradle.kts** — Remove the Cidaas dependency:

```kotlin
// REMOVE
implementation("com.github.cidaas:cidaas-sdk-android-v2:3.2.9")
```

### Add SRG Login SDK

**settings.gradle.kts** — Add the GitHub Pages Maven repository (no authentication required):

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://swisstxt.github.io/srg-login-sdk-distribution-android/") }
    }
}
```

**app/build.gradle.kts**:

```kotlin
dependencies {
    implementation("ch.srg.login:srglogin-core-android:<VERSION>")
}
```

> See the [Android Integration Guide](/docs/getting-started/android) for full setup instructions including version catalog configuration.

---

## Step 2: Remove Cidaas Configuration

Delete the Cidaas XML configuration file:

```
app/src/main/cidaas.xml   ← DELETE THIS FILE
```

The SRG Login SDK uses Kotlin code for configuration (see Step 4).

---

## Step 3: Replace SDK Initialization

### Before (Cidaas)

```kotlin
val cidaas = Cidaas.getInstance(context)
```

### After (SRG Login SDK)

Two-step initialization:

**1. In your Application class:**

```kotlin
import ch.srg.login.sdk.SrgLoginSdk

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        SrgLoginSdk.initialize(
            platformContext = this,
            isDebugBuild = BuildConfig.DEBUG,
        )
    }
}
```

**2. Create an SrgLogin instance with your OAuth config:**

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

### Configuration Mapping

| Cidaas (`cidaas.xml`) | SRG Login SDK (`SrgLoginConfig`) |
|---|---|
| `DomainURL` | `environment` (enum: `DEV`, `INT`, `PROD`) |
| `ClientId` | `clientId` |
| `RedirectURL` | `redirectUri` |
| `CidaasVersion` | Not needed |
| — | `appIdentity` (NEW, required) |

### Environment Mapping

| Cidaas `DomainURL` | SRG Login SDK `Environment` |
|---|---|
| `https://account-dev.srgssr.ch` | `Environment.DEV` |
| `https://account-int.srgssr.ch` | `Environment.INT` |
| `https://account.srgssr.ch` | `Environment.PROD` |

:::warning
The `environment` **must** match the environment in which your `clientId` was registered. A mismatch results in `invalid_client` errors during login.
:::

> `appId`, `appName`, and `appVersion` must be resolved dynamically at runtime — never hardcode these values. See [Business Unit Identities](/docs/reference/bu-identities) for the full list of `businessUnit` / `businessUnitName` values.

---

## Step 4: Update the AndroidManifest

Two changes:
1. Add `android:launchMode="singleTask"` to the activity
2. Add a second intent filter for the logout callback

```xml
<uses-permission android:name="android.permission.INTERNET" />

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

    <!-- Logout callback (NEW — required by SRG Login SDK) -->
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

:::warning
`android:launchMode="singleTask"` is mandatory. Without it, the OAuth redirect creates a new activity instance instead of returning to the existing one.
:::

### Handle the redirect in code

```kotlin
import ch.srg.login.sdk.handleRedirect  // Top-level function!

override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleRedirect(intent)
}
```

> `handleRedirect` is a **top-level function** — not a method on `SrgLoginSdk`. Import it directly.

---

## Step 5: Replace Login

### Before (Cidaas) — Callback-based

```kotlin
cidaas.loginWithBrowser(activityContext, null, object : EventResult<AccessTokenEntity> {
    override fun success(result: AccessTokenEntity?) {
        val accessToken = result?.access_token
    }

    override fun failure(error: WebAuthError?) {
        val errorMessage = error?.errorMessage
    }
})
```

### After (SRG Login SDK) — Flow-based

```kotlin
import ch.srg.login.sdk.auth.AndroidAuthContext
import ch.srg.login.sdk.auth.Credentials
import ch.srg.login.sdk.auth.LoginState

viewModelScope.launch {
    val authContext = AndroidAuthContext(
        context = activity,
        activity = activity,
    )

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
}
```

**Key differences:**
- `EventResult` callback → Kotlin **Flow** collected in a coroutine
- `AccessTokenEntity` → `LoginState.Success` containing a `tokenSet`
- `WebAuthError` → `SrgLoginError` (package: `ch.srg.login.sdk.errors`)

---

## Step 6: Replace Logout

### Before (Cidaas)

The Cidaas SDK logout was not working, requiring a custom front-channel / back-channel implementation.

### After (SRG Login SDK)

**Front-channel logout** — clears the server session and local tokens:

```kotlin
val authContext = AndroidAuthContext(context = activity, activity = activity)
srgLogin.logout(
    logoutType = LogoutType.FrontChannel(
        postLogoutRedirectUri = "your-app-scheme://logout"
    ),
    authContext = authContext,
)
```

**Local-only logout** — clears local tokens only:

```kotlin
srgLogin.logout(logoutType = LogoutType.LocalOnly)
```

No workaround needed. The SDK handles everything natively.

---

## Step 7: Clean Up

After migration, remove the following from your project:

- [ ] `app/src/main/cidaas.xml` — Cidaas configuration file
- [ ] Cidaas dependency from `build.gradle.kts`
- [ ] Jitpack repository from `settings.gradle.kts`
- [ ] Custom front-channel / back-channel logout implementation
- [ ] All `import de.cidaas.*` references
- [ ] Any `EventResult` / `WebAuthError` / `AccessTokenEntity` usages

---

## API Mapping Reference

| Cidaas SDK | SRG Login SDK | Notes |
|---|---|---|
| `Cidaas.getInstance(context)` | `SrgLoginSdk.initialize()` + `SrgLoginSdk.create(config)` | Two-step init |
| `cidaas.xml` | `SrgLoginConfig(...)` | Kotlin code, no XML |
| `DomainURL` | `Environment.INT` / `.PROD` | Enum instead of raw URL |
| `ClientId` | `clientId` | Same value |
| `RedirectURL` | `redirectUri` | Same value |
| `loginWithBrowser(ctx, null, callback)` | `srgLogin.login(credentials, authContext)` | Returns Flow |
| `EventResult<AccessTokenEntity>` | `LoginState.Success` / `LoginState.Failure` | Flow-based |
| `WebAuthError` | `SrgLoginError` | Package: `ch.srg.login.sdk.errors` |
| Custom front/back-channel logout | `srgLogin.logout(logoutType, authContext)` | Works natively |
| `AccessTokenEntity` | `srgLogin.getAccessToken()` → `SdkResult` | Pattern match on `Success`/`Failure` |
| N/A | `srgLogin.observeTokenState()` | New: real-time token state observation |
| N/A | `srgLogin.openSsoClient(url, authContext)` | New: open authenticated web pages |

---

## FAQ

### Do I need to change anything in the Cidaas Admin UI?

No. Your `clientId`, `redirectUri`, scopes, and app configuration remain unchanged. The SRG Login SDK uses the same OAuth 2.0/OIDC endpoints.

### Will users need to log in again after migration?

Yes. The token storage is different (Android Keystore vs Cidaas internal), so existing tokens are not migrated.

### Can I use both SDKs during a transition period?

Not recommended. Both SDKs would manage tokens independently, causing conflicts. Migrate completely in one step.

### Does the SRG Login SDK support minSdk 26 like Cidaas?

The SRG Login SDK supports **minSdk 21** — lower than Cidaas (26). No change needed.

### Where are tokens stored?

The SRG Login SDK uses **Android Keystore** (hardware-backed encryption) instead of Cidaas' internal storage.

---

## Related

- [Android Integration Guide](/docs/getting-started/android) — Full step-by-step SDK integration
- [Android Sample App](https://github.com/swisstxt/srg-login-sdk-sample-android) — Working reference implementation
- [Error Handling](/docs/guides/error-handling) — SrgLoginError types and patterns
- [Token Management](/docs/guides/token-management) — Token refresh, monitoring, states
- [Business Unit Identities](/docs/reference/bu-identities) — AppIdentity values

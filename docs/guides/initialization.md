---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Initialization

The SDK must be initialized **once** at app startup before any login, token, or logout operation. Initialization sets up secure token storage and configures internal logging.

## Two-Step Process

1. **`initialize()`** — sets up the platform runtime (storage, logging)
2. **`create(config)`** — creates an `SrgLogin` instance with your OAuth configuration

> **Web** is single-step — the `SrgLoginWeb` constructor performs both at once (see the Web tab below).

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
import ch.srg.login.sdk.SrgLoginSdk

// Step 1: In Application.onCreate()
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        SrgLoginSdk.initialize(
            platformContext = this,
            isDebugBuild = BuildConfig.DEBUG,
        )
    }
}

// Step 2: Create an SrgLogin instance (Activity, ViewModel, or DI)
val srgLogin = SrgLoginSdk.create(config)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
import SRGLoginCore

// Step 1: In App.init() or AppDelegate
SrgLoginSdk.shared.initialize(isDebugBuild: true)

// Step 2: Create an SrgLogin instance
let srgLogin = SrgLoginSdk.shared.create(config: config)
```

  </TabItem>
  <TabItem value="web" label="Web">

Web is **single-step** — the `SrgLoginWeb` constructor both sets up the runtime and creates the instance:

```typescript
import { SrgLoginWeb } from "@swisstxt/srg-login-sdk";

const sdk = new SrgLoginWeb(
  "<your-client-id>",
  `${window.location.origin}/callback`,   // redirectUri
  "INT",                                   // environment
  "ch.example.web", "My Web App", "1.0.0", // appId, appName, appVersion
  "SRF", "Schweizer Radio und Fernsehen",  // businessUnit, businessUnitName
  `${window.location.origin}/`,            // postLogoutRedirectUri
  true,                                    // enableLogging
);
```

  </TabItem>
</Tabs>

:::note Android TV / Google TV / tvOS
Device-flow platforms initialize exactly like their mobile counterpart — Android TV like Android, tvOS like iOS (same `initialize()` + `create(config)`). Only the login method differs (`LoginMethod.Device`).
:::

## Parameters

### `isDebugBuild`

Controls the SDK log level:

| Value | Log level | Visible logs |
|---|---|---|
| `true` | DEBUG | All (VERBOSE, DEBUG, INFO, WARNING, ERROR) |
| `false` | INFO | INFO, WARNING, ERROR only |

> On **web**, logging is controlled by the `enableLogging` boolean passed to the `SrgLoginWeb` constructor (last argument), not by `isDebugBuild`.

### `platformContext` (Android only)

The Android `Context` (typically `applicationContext`). Required for Chrome Custom Tabs and Android Keystore access.

### `tokenStorageConfig` (optional)

Customise the storage key alias and file name to avoid collisions when multiple SDK instances coexist. Defaults are fine for most apps.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
SrgLoginSdk.initialize(
    platformContext = this,
    isDebugBuild = BuildConfig.DEBUG,
    tokenStorageConfig = TokenStorageConfig(
        keystoreAlias = "your_app_token_key",
        fileName = "your_app_tokens",
    ),
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
SrgLoginSdk.shared.initialize(
    tokenStorageConfig: TokenStorageConfig(
        keystoreAlias: "your_app_token_key",
        fileName: "your_app_tokens"
    )
)
```

  </TabItem>
  <TabItem value="web" label="Web">

The `SrgLoginWeb` facade stores tokens in the browser's `sessionStorage` by default and does **not** expose a `tokenStorageConfig` — there is no equivalent parameter on web.

  </TabItem>
</Tabs>

## Lifecycle

- Call `initialize()` **once** — calling it again is a no-op
- Call `create(config)` to get an `SrgLogin` instance — you can call this multiple times with different configs
- Call `shutdown()` before re-initializing (e.g., environment switching at runtime)

> **Web**: the `SrgLoginWeb` facade has no `initialize` / `shutdown` lifecycle — construct one instance, and to reconfigure simply create a new `SrgLoginWeb`.

:::warning
Always cancel any active `observeTokenState()` subscription before calling `shutdown()`.
:::

## Related

- [Configuration](/docs/guides/configuration) — `SrgLoginConfig`, `Environment`, `AppIdentity`
- [Getting Started — Android](/docs/getting-started/android#step-2-initialize-the-sdk)
- [Getting Started — Android TV / Google TV](/docs/getting-started/android-tv#step-2-initialize-the-sdk)
- [Getting Started — iOS](/docs/getting-started/ios#step-2-initialize-the-sdk)
- [Getting Started — tvOS](/docs/getting-started/tvos#step-2-initialize-the-sdk)
- [Getting Started — Web](/docs/getting-started/web#step-2-initialize-the-sdk)

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
</Tabs>

## Parameters

### `isDebugBuild`

Controls the SDK log level:

| Value | Log level | Visible logs |
|---|---|---|
| `true` | DEBUG | All (VERBOSE, DEBUG, INFO, WARNING, ERROR) |
| `false` | INFO | INFO, WARNING, ERROR only |

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
</Tabs>

## Lifecycle

- Call `initialize()` **once** — calling it again is a no-op
- Call `create(config)` to get an `SrgLogin` instance — you can call this multiple times with different configs
- Call `shutdown()` before re-initializing (e.g., environment switching at runtime)

:::warning
Always cancel any active `observeTokenState()` subscription before calling `shutdown()`.
:::

## Related

- [Configuration](/docs/guides/configuration) — `SrgLoginConfig`, `Environment`, `AppIdentity`
- [Getting Started — Android](/docs/getting-started/android#step-2-initialize-the-sdk)
- [Getting Started — iOS](/docs/getting-started/ios#step-2-initialize-the-sdk)

---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Custom Token Storage

The SDK stores tokens in platform-native secure storage by default. You can customize storage keys and behavior via `TokenStorageConfig` — passed at SDK initialization.

## Default Storage

| Platform | Storage mechanism | Key protection |
|----------|------------------|---------------|
| **Android** | EncryptedSharedPreferences | Android Keystore (hardware-backed TEE/StrongBox when available) |
| **iOS** | iOS Keychain | Secure Enclave (when available) |

By default, all SDK instances share the same storage namespace:

| Parameter | Default value |
|-----------|--------------|
| `keystoreAlias` | `"srg_login_sdk_token_key"` |
| `fileName` | `"srg_login_tokens"` |
| `enableBackup` | `false` |

## TokenStorageConfig

`TokenStorageConfig` is passed to `SrgLoginSdk.initialize()` — before creating any `SrgLogin` instance:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
SrgLoginSdk.initialize(
    tokenStorageConfig = TokenStorageConfig(
        keystoreAlias = "my_app_token_key",
        fileName = "my_app_tokens",
        enableBackup = false
    ),
    platformContext = applicationContext,
    isDebugBuild = BuildConfig.DEBUG
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
SrgLoginSdk.shared.initialize(
    tokenStorageConfig: TokenStorageConfig(
        keystoreAlias: "my_app_token_key",
        fileName: "my_app_tokens",
        enableBackup: false
    ),
    platformContext: nil,
    isDebugBuild: false
)
```

  </TabItem>
</Tabs>

## Configuration Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `keystoreAlias` | `String` | `"srg_login_sdk_token_key"` | Alias for key generation in Android Keystore. On iOS, used as the Keychain service name. |
| `fileName` | `String` | `"srg_login_tokens"` | Name of the EncryptedSharedPreferences file (Android). On iOS, used as the Keychain access group prefix. |
| `enableBackup` | `Boolean` | `false` | Allow backup of the storage file. **Android only** — controls whether the storage file is included in Android Auto Backup. |

:::danger
Setting `enableBackup = true` means tokens may be included in cloud backups. This is generally **not recommended** for OAuth tokens — a restored backup may contain expired or revoked tokens.
:::

## Multi-Instance Storage

When using `SrgLoginSdk.create()` multiple times (e.g., for different `clientId` configurations), each instance automatically gets isolated storage based on its `clientId` and `environment`. You do **not** need to create separate `TokenStorageConfig` instances for each.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
// Initialize once with shared storage config
SrgLoginSdk.initialize(
    platformContext = applicationContext,
    isDebugBuild = BuildConfig.DEBUG
)

// Create separate instances — storage is isolated by clientId + environment
val srgLoginProd = SrgLoginSdk.create(
    SrgLoginConfig(
        clientId = "prod-client-id",
        redirectUri = "myapp://callback",
        appIdentity = appIdentity,
        environment = Environment.PROD,
    )
)

val srgLoginInt = SrgLoginSdk.create(
    SrgLoginConfig(
        clientId = "int-client-id",
        redirectUri = "myapp://callback",
        appIdentity = appIdentity,
        environment = Environment.INT,
    )
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
SrgLoginSdk.shared.initialize(platformContext: nil, isDebugBuild: false)

let srgLoginProd = SrgLoginSdk.shared.create(config: SrgLoginConfig(
    clientId: "prod-client-id",
    redirectUri: "myapp://callback",
    appIdentity: appIdentity,
    environment: .prod
))

let srgLoginInt = SrgLoginSdk.shared.create(config: SrgLoginConfig(
    clientId: "int-client-id",
    redirectUri: "myapp://callback",
    appIdentity: appIdentity,
    environment: .int_
))
```

  </TabItem>
</Tabs>

## When to Customize

| Scenario | Recommendation |
|----------|---------------|
| Single app, single SDK instance | Use defaults — no customization needed |
| App already uses `"srg_login_sdk_token_key"` alias for something else | Change `keystoreAlias` |
| Multiple apps sharing the same device profile | Change `fileName` to avoid collisions |
| Enterprise/MDM apps requiring backup | Set `enableBackup = true` (with caution) |
| Migration from another SDK | Match old storage keys during migration, then switch |

## Platform Details

### Android: EncryptedSharedPreferences

The SDK uses Jetpack Security's `EncryptedSharedPreferences` backed by Android Keystore:

- **Key generation**: AES-256-GCM master key stored in Android Keystore under the `keystoreAlias`
- **File**: SharedPreferences file named `fileName` in the app's private directory
- **Hardware backing**: Uses TEE (Trusted Execution Environment) or StrongBox when available
- **Encryption**: AES-256-SIV for keys, AES-256-GCM for values

### iOS: Keychain

The SDK uses the iOS Keychain Services API:

- **Service name**: Derived from `keystoreAlias`
- **Access control**: `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` — tokens available after first unlock, not synced to other devices
- **Hardware backing**: Secure Enclave when available (iPhone 5s+, iPad Air+)
- **Migration**: Tokens survive app updates but are removed on app uninstall

## What Is Stored

| Data | Stored | Notes |
|------|:------:|-------|
| Access token (JWT) | Yes | Encrypted at rest |
| Refresh token | Yes | Encrypted at rest |
| ID token | Yes | Encrypted at rest |
| Token metadata (expiry, issued-at) | Yes | Used for monitoring |
| User passwords | Never | Not handled by SDK |
| Authorization codes | Never | Ephemeral, discarded after exchange |
| PKCE code verifiers | Never | Ephemeral, discarded after exchange |

## Related

- [Initialization](/docs/guides/initialization) — `initialize()` with `TokenStorageConfig`
- [Security](/docs/guides/security) — Token storage security model
- [Token Management](/docs/guides/token-management) — Token lifecycle

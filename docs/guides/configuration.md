---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Configuration

After initialization, create an `SrgLogin` instance by passing a `SrgLoginConfig` object. This config contains your OAuth client credentials, redirect URIs, app identity, and target environment.

## SrgLoginConfig

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
import ch.srg.login.sdk.SrgLoginSdk
import ch.srg.login.sdk.config.SrgLoginConfig
import ch.srg.login.sdk.config.AppIdentity
import ch.srg.login.sdk.config.Environment

val config = SrgLoginConfig(
    clientId = "your-oauth-client-id",
    redirectUri = "your-app-scheme://callback",
    postLogoutRedirectUri = "your-app-scheme://logout",
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

  </TabItem>
  <TabItem value="ios" label="iOS">

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

  </TabItem>
</Tabs>

## Environment

Use `environment` to select the OIDC endpoints. Each environment has its own OpenID Connect discovery endpoint and its own set of registered clients.

| Environment | Android | iOS | OIDC Server |
|-------------|---------|-----|-------------|
| Development | `Environment.DEV` | `.dev` | `account-dev.srgssr.ch` |
| Integration | `Environment.INT` | `.int` | `account-int.srgssr.ch` |
| Production | `Environment.PROD` | `.prod` | `account.srgssr.ch` |

:::danger
The `environment` **must** match the environment in which your `clientId` was registered. A mismatch results in `invalid_client` errors during login. Confirm with the SRG SSR identity team which environment your `clientId` belongs to.
:::

## AppIdentity

`AppIdentity` provides metadata for Sentry error tracking. All fields are required.

### Dynamic fields

:::warning
`appId`, `appName`, and `appVersion` must be resolved dynamically at runtime — never hardcode these values.
:::

### Business Unit values

`businessUnit` and `businessUnitName` must use **exact values** from the table below. These values are used as Sentry filters to categorize and route error reports — incorrect or custom values will break Sentry dashboards and alerting.

| `businessUnit` | `businessUnitName` |
|---|---|
| `"SRF"` | `"Schweizer Radio und Fernsehen"` |
| `"RTS"` | `"Radio Télévision Suisse"` |
| `"RSI"` | `"Radiotelevisione svizzera di lingua italiana"` |
| `"RTR"` | `"Radiotelevisiun Svizra Rumantscha"` |
| `"SWI"` | `"SWI swissinfo.ch"` |
| `"SWISSTXT"` | `"SWISS TXT"` |
| `"SRG"` | `"SRG SSR"` |

See [Business Unit Identities](/docs/reference/bu-identities) for the full reference.

## Reconfiguration

To switch environments or update the OAuth config at runtime, shut the SDK down first:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
SrgLoginSdk.shutdown()
// Then call initialize(...) and create(config) again with the new config
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
SrgLoginSdk.shared.shutdown()
// Then call initialize(...) and create(config:) again with the new config
```

  </TabItem>
</Tabs>

## Related

- [Initialization](/docs/guides/initialization) — `initialize()` parameters and lifecycle
- [Business Unit Identities](/docs/reference/bu-identities) — Full BU reference table

---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Business Unit Identities

The `AppIdentity` in `SrgLoginConfig` requires exact `businessUnit` and `businessUnitName` values. These are used as Sentry filters to categorize and route error reports — incorrect or custom values will break Sentry dashboards and alerting.

## Allowed Values

| `businessUnit` | `businessUnitName` |
|---|---|
| `"SRF"` | `"Schweizer Radio und Fernsehen"` |
| `"RTS"` | `"Radio Télévision Suisse"` |
| `"RSI"` | `"Radiotelevisione svizzera di lingua italiana"` |
| `"RTR"` | `"Radiotelevisiun Svizra Rumantscha"` |
| `"SWI"` | `"SWI swissinfo.ch"` |
| `"SWISSTXT"` | `"SWISS TXT"` |
| `"SRG"` | `"SRG SSR"` |

## Usage

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
AppIdentity(
    appId = packageName,
    appName = applicationInfo.loadLabel(packageManager).toString(),
    appVersion = packageManager.getPackageInfo(packageName, 0).versionName ?: "unknown",
    businessUnit = "SRF",
    businessUnitName = "Schweizer Radio und Fernsehen"
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
AppIdentity(
    appId: Bundle.main.bundleIdentifier ?? "",
    appName: Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "",
    appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "",
    businessUnit: "SRF",
    businessUnitName: "Schweizer Radio und Fernsehen"
)
```

  </TabItem>
</Tabs>

:::warning
`appId`, `appName`, and `appVersion` must be resolved dynamically at runtime — never hardcode these values.
:::

## Related

- [Configuration](/docs/guides/configuration) — Full `SrgLoginConfig` setup
- [Initialization](/docs/guides/initialization) — SDK initialization with `AppIdentity`

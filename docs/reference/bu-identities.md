---
sidebar_position: 1
---

# Business Unit Identities

The `AppIdentity` in `SrgLoginConfig` requires exact `businessUnit` and `businessUnitName` values. These are used as Sentry filters to categorize and route error reports — incorrect or custom values will break Sentry dashboards and alerting.

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

```kotlin
AppIdentity(
    appId = packageName,
    appName = applicationInfo.loadLabel(packageManager).toString(),
    appVersion = packageManager.getPackageInfo(packageName, 0).versionName ?: "unknown",
    businessUnit = "SRF",
    businessUnitName = "Schweizer Radio und Fernsehen"
)
```

:::warning
`appId`, `appName`, and `appVersion` must be resolved dynamically at runtime — never hardcode these values.
:::

---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Sentry Integration

The SDK includes built-in error tracking via Sentry. Errors are captured automatically at critical SDK locations and reported with multi-tenant context — no configuration required from your app.

## How It Works

The SDK uses its own internal Sentry client, completely isolated from your application's Sentry instance (if any). There are no singleton conflicts or shared state.

| Aspect | Details |
|--------|---------|
| **Client** | Custom HTTP client (direct POST to Sentry Store API v7) |
| **DSN** | Internal, per-environment — not exposed to consumers |
| **Isolation** | Separate from any app-level Sentry SDK |
| **Initialization** | Fully automatic — zero configuration for SDK consumers |
| **Failure mode** | Fail-safe — errors in error tracking never break the SDK |

## Automatic Capture

The SDK captures errors at **38 critical locations** across all subsystems:

| Subsystem | Capture points | Examples |
|-----------|:--------------:|---------|
| Token Management | 5 | Refresh failures, validation errors |
| Authentication | 7 | Login failures, PKCE errors, callback processing |
| Storage Operations | 14 | Android Keystore / iOS Keychain failures |
| API Service | 3 | Network errors, token exchange failures |
| JWT Validation | 6 | Signature verification, claim validation |
| Logout Token Validation | 2 | Back-channel logout failures |
| OIDC Discovery | 1 | Configuration fetch failures |

:::info
`invalid_grant` errors are **excluded** from Sentry — a revoked refresh token is an expected operational condition (e.g., IDP-side logout, password change), not a bug.
:::

## AppIdentity and Sentry Tags

The `AppIdentity` you provide in `SrgLoginConfig` is used to tag every Sentry event. This enables filtering errors by business unit and application in the Sentry dashboard.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
val config = SrgLoginConfig(
    clientId = "your-client-id",
    redirectUri = "yourapp://callback",
    appIdentity = AppIdentity(
        appId = packageName,
        appName = applicationInfo.loadLabel(packageManager).toString(),
        appVersion = packageManager.getPackageInfo(packageName, 0).versionName ?: "unknown",
        businessUnit = "SRF",
        businessUnitName = "Schweizer Radio und Fernsehen"
    ),
    environment = Environment.PROD,
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let config = SrgLoginConfig(
    clientId: "your-client-id",
    redirectUri: "yourapp://callback",
    appIdentity: AppIdentity(
        appId: Bundle.main.bundleIdentifier ?? "",
        appName: Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "",
        appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "",
        businessUnit: "SRF",
        businessUnitName: "Schweizer Radio und Fernsehen"
    ),
    environment: .prod
)
```

  </TabItem>
</Tabs>

### Sentry Tags

Each error event is enriched with the following tags:

| Tag | Source | Example |
|-----|--------|---------|
| `app.id` | `AppIdentity.appId` | `ch.srf.news` |
| `app.name` | `AppIdentity.appName` | `SRF News` |
| `app.version` | `AppIdentity.appVersion` | `2.5.3` |
| `business_unit` | `AppIdentity.businessUnit` | `SRF` |
| `sdk.version` | Auto-detected | `1.0.0-beta.3` |
| `platform` | Auto-detected | `Android`, `iOS` |
| `os.version` | Auto-detected | `14.0`, `17.4` |
| `device.model` | Auto-detected | `Pixel 8`, `iPhone 15` |
| `environment` | `SrgLoginConfig.environment` | `PROD` |

## Per-Environment Configuration

Error tracking is enabled in all environments with isolated Sentry projects:

| Environment | Tracking | Sentry project |
|-------------|:--------:|----------------|
| **DEV** | Enabled | Shared with INT |
| **INT** | Enabled | Shared with DEV |
| **PROD** | Enabled | Dedicated project |

## Privacy and Anonymization

The SDK uses a **double anonymization** model (HASHED_SUB) for GDPR compliance:

| Layer | What happens |
|-------|-------------|
| **Layer 1** | The IDP provides an anonymized `sub` claim (UUID) — no real user identity |
| **Layer 2** | The SDK hashes `SHA-256(sub + salt + businessUnit)` → first 16 hex chars |

The result is a GDPR-compliant, irreversible identifier. Environment-specific salts prevent cross-BU correlation.

### PII Sanitization

Token values and secrets are **never** included in Sentry events. The SDK's `SecurityUtils` automatically redacts:

- Access tokens, refresh tokens, ID tokens
- Authorization codes
- PKCE code verifiers
- Passwords and client secrets

## Opt Out

To disable error tracking entirely, set `enableErrorTracking = false`:

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
val config = SrgLoginConfig(
    clientId = "your-client-id",
    redirectUri = "yourapp://callback",
    appIdentity = appIdentity,
    environment = Environment.PROD,
    enableErrorTracking = false  // Disable SDK error tracking
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
let config = SrgLoginConfig(
    clientId: "your-client-id",
    redirectUri: "yourapp://callback",
    appIdentity: appIdentity,
    environment: .prod,
    enableErrorTracking: false
)
```

  </TabItem>
</Tabs>

:::warning
When to disable:
- Debug/development builds (errors logged to console only)
- Privacy-sensitive applications with strict compliance requirements
- During testing/QA where you control the environment
:::

## Compatibility with Your App's Sentry

The SDK's Sentry client is completely independent:

| Concern | Answer |
|---------|--------|
| Does it conflict with my app's Sentry SDK? | No — separate HTTP client, no shared singleton |
| Does it use `SentrySDK.init()`? | No — direct HTTP POST to Sentry Store API |
| Can I use my own Sentry DSN? | Not needed — the SDK manages its own DSN internally |
| Does it add dependencies? | No — uses Ktor (already a dependency) for HTTP |

## Related

- [Configuration](/docs/guides/configuration) — `SrgLoginConfig` and `AppIdentity`
- [Business Unit Identities](/docs/reference/bu-identities) — Exact `businessUnit` values
- [Security](/docs/guides/security) — Logging and PII sanitization

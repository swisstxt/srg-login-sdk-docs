---
sidebar_position: 1
---

import Link from '@docusaurus/Link';

# API Reference

The complete Kotlin API documentation, auto-generated from KDoc comments using [Dokka](https://github.com/Kotlin/dokka).

<Link className="button button--primary button--lg" to="pathname:///api-reference/kotlin/index.html">Browse the Kotlin API Reference</Link>

<br/><br/>

## Key packages

| Package | Description |
|---------|-------------|
| `ch.srg.login.sdk` | Main entry point — `SrgLogin`, `SrgLoginSdk`, `SrgLoginConfig`, `AppIdentity`, `Environment` |
| `ch.srg.login.sdk.auth` | Authentication — `LoginMethod`, `LoginState`, `TokenState`, `LogoutType`, `LogoutResult`, auth contexts |
| `ch.srg.login.sdk.model` | Data models — `TokenSet`, `AccessToken`, `UserInfo`, `IdTokenClaims` |
| `ch.srg.login.sdk.token` | Token storage (`TokenStorageConfig`) |
| `ch.srg.login.sdk.errors` | Error types — `SrgLoginError` sealed class |
| `ch.srg.login.sdk.result` | `SdkResult` success/failure wrapper |
| `ch.srg.login.sdk.events` | Lifecycle events — `SdkLifecycleEvent`, observers |
| `ch.srg.login.sdk.js` | Web facade — `SrgLoginWeb`, `UserInfoJs`, `LoginResultJs` |
| `ch.srg.login.sdk.logging` | Logging configuration |

## Common entry points

- **`SrgLogin`** — Main SDK facade: `login()`, `logout()`, `getAccessToken()`, `isAuthenticated()`
- **`SrgLoginConfig`** — SDK configuration: OAuth endpoints, client ID, scopes
- **`TokenState`** — Observable authentication state: `Valid`, `Expired`, `NoTokens`, ...
- **`SrgLoginError`** — Sealed error hierarchy for type-safe error handling

## Generate locally

```bash
cd srg-login-mobile-sdk
./gradlew :srglogin-core:dokkaGenerateHtml
# Output: srglogin-core/build/dokka/html/
```

:::note
This reference is generated from the `develop` branch and will be automatically updated on each SDK release via the CI/CD pipeline.
:::

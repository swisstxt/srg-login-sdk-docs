---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OAuth Scopes

OAuth 2.0 scopes define the level of access your application requests from the Identity Provider (IDP). The SDK manages scope negotiation automatically, but you can request additional scopes at login time.

## Default Scope

The SDK always includes `openid` in every authorization request — this is required for OIDC compliance and cannot be removed.

If you call `login()` without specifying `additionalScopes`, only `openid` is requested.

## Available Scopes

| Scope | Purpose | Included by default | Typical use |
|-------|---------|:------------------:|-------------|
| `openid` | OIDC authentication — returns an ID token | Yes | Always required |
| `offline_access` | Request a refresh token for silent token renewal | No | Long-lived sessions |
| `profile` | Access user profile claims (name, picture, etc.) | No | Personalization |
| `email` | Access user email address | No | Account linking, notifications |

:::info
The exact set of supported scopes depends on your IDP configuration. The SDK reads `scopes_supported` from the OIDC Discovery document at runtime.
:::

## Requesting Scopes

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
// Login with refresh token + profile access
srgLogin.login(
    loginMethod = LoginMethod.Web,
    authContext = authContext,
    additionalScopes = listOf("offline_access", "profile", "email")
)

// Minimal login — only "openid" is requested
srgLogin.login(loginMethod = LoginMethod.Web, authContext = authContext)
```

  </TabItem>
  <TabItem value="android-tv" label="Android TV / Google TV">

```kotlin
// Device flow — additionalScopes are requested the same way
srgLogin.login(
    loginMethod = LoginMethod.Device,
    authContext = authContext,
    additionalScopes = listOf("offline_access", "profile", "email")
)
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
// Login with refresh token + profile access
let loginFlow = srgLogin.login(
    loginMethod: LoginMethod.Web.shared,
    authContext: authContext,
    additionalScopes: ["offline_access", "profile", "email"]
)

// Minimal login — only "openid" is requested
let minimalFlow = srgLogin.login(loginMethod: LoginMethod.Web.shared, authContext: authContext)
```

  </TabItem>
  <TabItem value="tvos" label="tvOS">

```swift
// Device flow — additionalScopes are requested the same way
let loginFlow = srgLogin.login(
    loginMethod: LoginMethod.Device.shared,
    authContext: TvOSAuthContext(),
    additionalScopes: ["offline_access", "profile", "email"]
)
```

  </TabItem>
  <TabItem value="web" label="Web">

```typescript
// On web, the requested scopes are the argument to login()
await sdk.login(["offline_access", "profile", "email"]);

// Minimal login — only "openid" is requested
await sdk.login([]);
```

  </TabItem>
</Tabs>

## Scope Behavior

### `openid`

Always included. Triggers OIDC authentication — the IDP returns an **ID token** (JWT) alongside the access token. The SDK uses the ID token for:

- JWT signature verification (RSA / ECDSA via JWKS)
- `sub` claim extraction (user identity)
- Token expiry validation (`exp` claim)

### `offline_access`

Requests a **refresh token**. Without this scope, the IDP may not issue a refresh token, and the SDK cannot silently renew the access token when it expires.

:::warning
If your IDP does not return a refresh token, the user will need to log in again when the access token expires. Always request `offline_access` for production apps.
:::

### `profile`

Grants access to standard OIDC profile claims in the ID token or UserInfo endpoint:

| Claim | Description |
|-------|-------------|
| `name` | Full name |
| `given_name` | First name |
| `family_name` | Last name |
| `picture` | Profile picture URL |
| `locale` | Preferred locale |

### `email`

Grants access to email claims:

| Claim | Description |
|-------|-------------|
| `email` | Email address |
| `email_verified` | Whether the email is verified |

## Granted Scopes

After login, you can check which scopes were actually granted by the IDP via the `TokenSet`:

```kotlin
// The TokenSet.scope property contains the granted scopes (space-separated)
// e.g. "openid offline_access profile"
```

:::tip
The IDP may grant fewer scopes than requested. Always check the granted scopes if your app depends on specific claims.
:::

## Related

- [Authentication](/docs/guides/authentication) — Login flow and PKCE
- [Token Management](/docs/guides/token-management) — Token lifecycle and refresh
- [Configuration](/docs/guides/configuration) — SDK configuration

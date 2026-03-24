---
sidebar_position: 7
---

# Security

The SRG Login SDK follows OAuth 2.0 security best practices for native mobile apps, as defined in [RFC 8252](https://tools.ietf.org/html/rfc8252) (OAuth 2.0 for Native Apps) and [RFC 7636](https://tools.ietf.org/html/rfc7636) (PKCE).

## PKCE (Proof Key for Code Exchange)

All `Credentials.Web` login flows use PKCE automatically. This prevents authorization code interception attacks.

| Step | What happens |
|------|-------------|
| 1 | SDK generates a cryptographically random `code_verifier` (43-128 characters) |
| 2 | SDK derives a `code_challenge` using SHA-256 |
| 3 | Authorization request includes the `code_challenge` |
| 4 | IDP returns an authorization code to the redirect URI |
| 5 | SDK exchanges the code + `code_verifier` for tokens |
| 6 | IDP verifies the `code_verifier` matches the `code_challenge` |

Even if an attacker intercepts the authorization code, they cannot exchange it without the `code_verifier` — which never leaves the device.

## Secure Browser

The SDK uses the platform's system-managed secure browser — not an embedded `WebView`. This prevents the app from intercepting user credentials.

| Platform | Secure Browser | Why |
|----------|---------------|-----|
| **Android** | Chrome Custom Tabs | Runs in a separate process. The app cannot read page content or inject JavaScript. |
| **iOS** | `ASWebAuthenticationSession` | System-managed browser sheet. Isolated from the app. Shares cookies with Safari. |

:::danger
Embedded `WKWebView` / `WebView` login is intentionally **not supported**. Embedded browsers allow the host app to intercept credentials — this is a security anti-pattern for OAuth.
:::

## Token Storage

Tokens are stored using hardware-backed encryption on each platform:

| Platform | Storage mechanism | Key protection |
|----------|------------------|---------------|
| **Android** | Android Keystore + EncryptedSharedPreferences | Hardware-backed (TEE/StrongBox when available) |
| **iOS** | iOS Keychain | Secure Enclave (when available) |

### What is stored

- Access token (JWT)
- Refresh token
- ID token
- Token metadata (expiry, issued-at)

### What is NOT stored

- User passwords
- Authorization codes
- PKCE code verifiers (ephemeral, discarded after exchange)

## Transport Security

- All communication uses HTTPS (TLS 1.2+)
- Certificate pinning is handled by the platform's network stack
- No sensitive data is sent via query parameters (tokens use POST bodies)

## Logging

The SDK includes a configurable logger. In production (`isDebugBuild = false`), only INFO/WARNING/ERROR are logged. Token values and secrets are **never** logged at any level.

| Data | Logged? |
|------|---------|
| Token values (access, refresh, ID) | Never |
| Authorization codes | Never |
| PKCE code verifiers | Never |
| Client ID | Debug only |
| Redirect URIs | Debug only |
| Token state transitions | Always (state name only, no token data) |
| Error types | Always |

## Related

- [Authentication](/docs/guides/authentication) — PKCE flow details
- [Token Management](/docs/guides/token-management) — Token lifecycle
- [Initialization](/docs/guides/initialization) — `isDebugBuild` log level configuration

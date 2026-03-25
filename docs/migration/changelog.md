---
sidebar_position: 2
---

# Changelog

All notable changes to the SRG Login SDK are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

:::info
This changelog is synced from the SDK repository on each release.
:::

## [1.0.0-beta.3] — 2026-03-04

### Fixed

- **iOS callback scheme extracted from wrong URL** (LOGIN-1726) — `ASWebAuthenticationSession` received `callbackURLScheme = "https"` instead of the app's custom scheme because `extractCallbackScheme` was called with the authorization URL, not the `redirect_uri`. Fixed by extracting the scheme from `redirect_uri` (login) and `post_logout_redirect_uri` (logout). `CFBundleURLTypes` in `Info.plist` is no longer required.

- **SPM pre-release integration** (LOGIN-1723) — `publish-prerelease.yml` never computed the XCFramework checksum, leaving `Package.swift` with a `"PLACEHOLDER"` checksum that SPM rejects. The workflow now computes the checksum via `swift package compute-checksum`, updates `Package.swift`, and force-moves the tag.

- **Explicit `minCompileSdk=21` in AAR metadata** (LOGIN-1719) — AGP 9.0 defaulted `minCompileSdk` to `compileSdk` (36), forcing consumers to use `compileSdk >= 36`. The SDK uses no API above 23, so consumer apps can now use any `compileSdk >= 21`.

- **Token expiry handling cleanup** (LOGIN-1698) — Removed broken `TokenResponseDto.expiresAt` and `isExpired` computed getters that called `Clock.System.now()` on every access. `isAuthenticated()` now delegates to `jwtValidationService.isAccessTokenExpired()`. Excluded `invalid_grant` from Sentry (expected operational condition, not a bug).

- **`invalid_grant` handling** (LOGIN-1699) — Fixed multiple issues: `observeTokenState()` never emitted intermediate states (`ExpiringSoon`, `Expired`, `Refreshing`); `isAuthenticated()` returned `true` during `RefreshFailed(InvalidGrant)`; monitoring delayed `NoTokens` by up to 300s after session invalidation. New `SdkLifecycleEvent.SessionInvalidated` event emitted on forced session termination.

- **Token monitoring state transitions** (LOGIN-1695) — `ExpiringSoon` was never emitted when proactive refresh was disabled. Monitoring interval used a non-deterministic DTO getter instead of JWT `exp` claim. Multiple edge cases fixed for restart, refresh success handling, and cancellation.

### Added

- **ProGuard/R8 consumer rules** (LOGIN-1679) — `consumer-rules.pro` embedded in the AAR protects kotlinx-serialization classes, Kotlin metadata annotations, and enum methods from aggressive R8 optimization.

### Changed

- **Renamed `app` module to `androidApp`** (LOGIN-1705) — Aligns with KMP naming convention.

- **Reduced public API surface** (LOGIN-1680) — 17 classes/interfaces marked `internal`. Removed dead `LogoutConfig` class. Regenerated BCV KLib API dump.

- **Per-environment Sentry DSN** (LOGIN-1643) — DEV now has error tracking enabled (shares Sentry project with INT). PROD has a dedicated Sentry project. All environments have full observability.

### Added

- **Release infrastructure** (LOGIN-1676) — SDK versioning via `gradle.properties`, runtime `SdkBuildConfig.kt`, Maven publishing to GitHub Packages, SNAPSHOT/pre-release/stable workflows, iOS XCFramework + SPM, binary compatibility validator.

- **iOS CI/CD** (LOGIN-1675) — `ios-tests` and `ios-build` jobs on macOS runners. Optional on develop PRs, required on main PRs. Step 2 of gradual platform enablement.

- **App Identity for Sentry** (LOGIN-1612) — Mandatory `AppIdentity` in `SrgLoginConfig` for multi-tenant error attribution. New Sentry tags: `app.id`, `app.name`, `app.version`. **Breaking Change**: constructor and factory methods require `AppIdentity`.

- **SKIE plugin for Swift interop** (LOGIN-1645) — Kotlin `Flow<T>` available as Swift `AsyncSequence`, `suspend fun` as Swift `async`. Removed manual `FlowExtensions.swift` bridge.

- **iOS Sentry validation** (LOGIN-1614) — iOS HTTP logging sanitization, 30 iOS-specific tests for error tracking.

### Fixed

- **iOS SSO client fire-and-forget** (LOGIN-1523) — `openSsoClient()` no longer hangs on iOS; browser launches and success returns immediately.

---

## [1.0.0-beta.2] — 2026-01-06

### Added

- **iOS locale selector with `ui_locales`** (LOGIN-1616) — Locale dropdown in iOS sample app (de, fr, it, en, rm). Demonstrates `additionalParameters` usage.

- **iOS token refresh UI** (LOGIN-1492) — Real-time token state observation, color-coded state indicators, manual refresh button.

- **Additional OAuth/OIDC parameters** (LOGIN-1596) — `additionalParameters` on `login()` for `ui_locales`, `prompt`, `display`, `max_age`, `login_hint`, `acr_values`. OIDC Core 1.0 Section 3.1.2.1 compliant.

- **Token monitoring** (LOGIN-1509) — Background monitoring with adaptive intervals, proactive refresh, observable `TokenState`, multi-tenant support.

- **Branch protection** (LOGIN-1474) — GitHub Actions CI/CD, `CODEOWNERS`, pre-push hooks for `main` and `develop`.

- **Internal event architecture** — 14 lifecycle events, SharedFlow-based event bus, `FakeSdkEventEmitter` test double.

- **SDK error tracking** (LOGIN-1588) — Custom HTTP Sentry client, zero-config for SDK consumers, privacy-first double anonymization (HASHED_SUB), automatic capture at 38 critical locations.

- **iOS test infrastructure** (LOGIN-1597) — 97 iOS-specific tests across 6 test files (crypto, keychain, auth, logging, platform, context). 712 total tests on iOS simulator.

- **CI/CD workflows** (LOGIN-1479) — Develop PR workflow (~8-10 min), main PR workflow (~20-30 min), 4-layer security scanning (OWASP, GitLeaks, License, CodeQL).

---

## [1.0.0-beta.1] — 2025-11-15

### Added

- Initial beta release of the SRG Login KMP SDK
- OAuth 2.0 Authorization Code + PKCE flow
- Android: Chrome Custom Tabs, Android Keystore + EncryptedSharedPreferences
- iOS: ASWebAuthenticationSession, iOS Keychain
- Token management with automatic refresh
- Front-channel, local-only, and back-channel logout
- SSO client support (`openSsoClient`)
- Configurable logging with PII sanitization
- `SrgLoginConfig` with `Environment` (DEV, INT, PROD)
- `SdkResult<T>` for type-safe success/failure handling
- `SrgLoginError` sealed class with pattern matching

## Related

- [Migration from Cidaas — Android](/docs/migration/android)
- [Migration from Cidaas — iOS](/docs/migration/ios)
- [Getting Started — Android](/docs/getting-started/android)
- [Getting Started — iOS](/docs/getting-started/ios)

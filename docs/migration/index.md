---
sidebar_position: 1
---

# Migration Guides

This section contains guides for migrating from previous authentication solutions to the SRG Login SDK.

## From Cidaas SDK

- [Android Migration Guide](/docs/migration/android) — Migrate from Cidaas Android SDK to SRG Login SDK
- [iOS Migration Guide](/docs/migration/ios) — Migrate from Cidaas iOS SDK to SRG Login SDK

Both guides cover dependency replacement, configuration migration, login/logout flow changes, and a complete API mapping reference.

:::info
The same `clientId`, `redirectUri`, and Cidaas Admin UI configuration remain unchanged — only the client-side SDK code changes. Users will need to log in once after the update (token storage is different).
:::

## Changelog

See the [Changelog](/docs/migration/changelog) for a complete list of changes per version.

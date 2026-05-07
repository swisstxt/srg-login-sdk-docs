---
sidebar_position: 1
---

# Upgrade Guides

Step-by-step guides for upgrading the SRG Login SDK from one version to the next within your existing app.

:::info Migrating from another SDK?
If you are integrating the SRG Login SDK for the first time and need to preserve users authenticated via a previous SDK (e.g., Cidaas SDK), see the [Migration Guides](/docs/migration) instead.
:::

## Available upgrades

| Version | Released | Effort | Highlights |
|---|---|---|---|
| [v1.0.0-beta.12](/docs/upgrades/v1.0.0-beta.12) | May 2026 | ~30–45 min | 4 new features · 7 breaking changes · critical JWT parsing fix |

## Adding a new upgrade page

When publishing a new SDK version, create a new file in this folder named after the target version (e.g., `v1.0.0-RC.1.md`). Use the [latest upgrade page](/docs/upgrades/v1.0.0-beta.12) as a reference, or copy the [template](#) (`_template.md` in this folder, hidden from production).

Recommended sections, in order:

1. **At a glance** — counts and effort estimate
2. **What's new** — new features with examples
3. **Breaking changes** — table with before/after and required action
4. **Stability improvements** — invisible-to-app fixes
5. **Per-platform notes** — Android, iOS, tvOS specifics
6. **Migration checklist** — actionable items for app developers
7. **What's coming next** — preview of the following release
8. **Need help?** — pair-programming offer

Use `sidebar_position` in frontmatter to control ordering (lower number = higher in sidebar; latest version should have `sidebar_position: 2` since `index.md` is `1`).

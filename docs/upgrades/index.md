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
| [v1.0.0-rc.1](/docs/upgrades/v1.0.0-rc.1) | June 2026 | ~5 min | First Release Candidate · no breaking changes (API frozen, identical to beta.13) · new Android TV / Google TV sample app |
| [v1.0.0-beta.13](/docs/upgrades/v1.0.0-beta.13) | May 2026 | ~15–30 min | `srgLogin.getUserInfo()` API · 2 breaking changes (claims moved to `userInfo`, strict `isAuthenticated()`) · Ktor OkHttp engine on Android |
| [v1.0.0-beta.12](/docs/upgrades/v1.0.0-beta.12) | May 2026 | ~30–45 min | 4 new features · 7 breaking changes · critical JWT parsing fix |

## Adding a new upgrade page

When publishing a new SDK version, create a new file in this folder named after the target version (e.g., `v1.0.0-rc.1.md`). Use the [latest upgrade page](/docs/upgrades/v1.0.0-rc.1) as a reference, or copy the [template](#) (`_template.md` in this folder, hidden from production).

Recommended sections, in order:

1. **At a glance** — counts and effort estimate
2. **What's new** — new features with examples
3. **Breaking changes** — table with before/after and required action
4. **Stability improvements** — invisible-to-app fixes
5. **Per-platform notes** — Android, iOS, tvOS specifics
6. **Migration checklist** — actionable items for app developers
7. **What's coming next** — preview of the following release
8. **Need help?** — pair-programming offer

To publish the page so it actually appears on the site, complete **all** of these steps — the Upgrades sidebar is **manually curated**, so creating the file alone is not enough:

1. **Register the page in `sidebars.ts`** — add it to the `Upgrades` category `items`, right after `'upgrades/index'` so the newest version is on top (e.g. `'upgrades/v1.0.0-rc.1'`). **This is the step that makes the page show up in the sidebar.**
2. **Add a row** for the new version at the top of the *Available upgrades* table above.
3. **Build** with `npm run build` to validate (strict broken-link checking).

:::note `sidebar_position` does not control ordering here
The Upgrades sidebar is defined explicitly in `sidebars.ts` (not auto-generated), so the `sidebar_position` value in a page's frontmatter has **no effect** on its position in this section. The order shown is the order of entries in the `sidebars.ts` `items` array.
:::

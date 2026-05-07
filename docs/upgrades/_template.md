---
sidebar_position: 99
draft: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

{/*
TEMPLATE — Upgrade Guide

This file is excluded from the production build via `draft: true`.

To create a new upgrade page:
  1. Copy this file to `vX.Y.Z.md` (target version, e.g., `v1.0.0-RC.1.md`).
  2. Remove the `draft: true` line.
  3. Set `sidebar_position` to control sidebar ordering (lower = higher in sidebar;
     newest version typically gets `sidebar_position: 2`, just below `index.md`).
  4. Replace all `<...>` placeholders with the actual content.
  5. Wrap any platform-specific code in <Tabs> / <TabItem> blocks (Android default).
  6. Add an entry to the Available upgrades table in `index.md`.
  7. Add the new page to `sidebars.ts` under the Upgrades category.
*/}

# Upgrade to vX.Y.Z

> **Released**: Month Year
> **Estimated effort**: ~X minutes per app

One-paragraph summary of the release: what's new at a glance and the migration story.

## At a glance

| | |
|---|---|
| 🆕 New features | count and short list |
| ⚠️ Breaking changes | count and source tickets |
| 🐛 Bug fixes | count and severity |
| 🎯 Estimated effort per app | ~X min |

---

## What's new

### 🆕 Feature name

Short description of the feature, who it's for, and why it matters.

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
// Minimal Android usage example
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
// Minimal iOS usage example
```

  </TabItem>
</Tabs>

:::info When to use this
Optional note on use cases or prerequisites.
:::

(Repeat for each major feature.)

---

## ⚠️ Breaking changes

Short framing: how many tickets, single migration effort, etc.

| # | Ticket | Before | After | Action |
|---|---|---|---|---|
| 1 | LOGIN-XXXX | `<old API>` | `<new API>` | What the app developer must do |

### Concrete migration examples

**Before:**

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
// old Android code
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
// old iOS code
```

  </TabItem>
</Tabs>

**After:**

<Tabs>
  <TabItem value="android" label="Android" default>

```kotlin
// new Android code
```

  </TabItem>
  <TabItem value="ios" label="iOS">

```swift
// new iOS code
```

  </TabItem>
</Tabs>

:::tip Migration tip
Searchable patterns to find all call sites that need updating.
:::

---

## Stability improvements *(no action required)*

- Bullet per fix, with LOGIN-XXXX reference

---

## Per-platform notes

### Android

Android-specific notes: minSdk, NSC, gradle, etc.

### iOS

iOS-specific notes: SPM version, SKIE-generated APIs, Info.plist, etc.

### tvOS / Android TV *(if applicable)*

TV-specific notes.

---

## Migration checklist

- [ ] Bump SDK dependency to `<version>`
- [ ] Item per breaking change
- [ ] Smoke-test login, refresh, and logout end-to-end
- [ ] Verify your CI still passes after the dependency bump

---

## What's coming next

Brief preview of the next planned release: features in flight, RC plans, etc.

---

## Need help?

The SRG Login SDK team is available for pair-programming sessions to help your Regional Unit migrate. Reach out via the usual SRG internal channels.

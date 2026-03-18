---
sidebar_position: 2
---

# Android Integration

:::info
This guide covers Android smartphone and tablet integration. For Android TV, see [Android TV](/docs/getting-started/android-tv).
:::

## Installation

Add the Maven repository to `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://swisstxt.github.io/srg-login-sdk-distribution-android/") }
    }
}
```

Add the dependency to `build.gradle.kts`:

```kotlin
dependencies {
    implementation("ch.srg.login:srglogin-core-android:<VERSION>")
}
```

No authentication required.

## Initialize

_Coming soon — see the [Android distribution README](https://github.com/swisstxt/srg-login-sdk-distribution-android) for a complete quickstart._

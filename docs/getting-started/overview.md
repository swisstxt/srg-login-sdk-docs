---
sidebar_position: 1
---

# Overview

The SRG Login SDK is a Kotlin Multiplatform (KMP) authentication library implementing OAuth 2.0 and OpenID Connect standards. It provides a unified API across platforms with platform-specific secure storage and browser integration.

## Requirements

| Platform | Minimum version | Build tool |
|----------|----------------|------------|
| Android | SDK 21 (Android 5.0) | Gradle 8.11+ / JDK 17+ |
| iOS | iOS 15.0+ | Xcode 15+ / Swift 5.9+ |
| Android TV | SDK 21 | Gradle 8.11+ / JDK 17+ |
| tvOS | tvOS 13.0+ | Xcode 15+ |

## Features

- Authorization Code Flow with PKCE (RFC 7636)
- Automatic token refresh with configurable monitoring
- Hardware-backed token storage (Android Keystore / iOS Keychain)
- IDP-agnostic design (works with any OAuth 2.0 / OIDC provider)
- Sentry error tracking with per-BU tagging
- Device Code Flow for TV platforms (planned)

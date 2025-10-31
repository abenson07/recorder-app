# Shared Code

This directory contains code shared between the web and native versions of the app.

## Structure

- `store/` - Zustand store (platform-agnostic state management)
- `hooks/` - Shared React hooks (if platform-agnostic)
- `lib/` - Shared utility functions and platform abstractions

## Platform Detection

Use `shared/lib/platform.ts` to detect which platform you're running on and conditionally import/use platform-specific code.


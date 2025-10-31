# Syncing Shared Code

Since Metro bundler doesn't support symlinks, the `shared/` code is copied to both:
- `web/src/shared/` 
- `native/src/shared/`

## Manual Sync Required

When you make changes to code in the root `shared/` directory, you need to manually sync it to both locations:

```bash
# From project root
cp -r shared/* web/src/shared/
cp -r shared/* native/src/shared/
```

## Future Improvement

Consider using a build script or tool like:
- `rsync` for automated syncing
- A custom npm script that syncs before build
- A proper monorepo tool (e.g., Turborepo, Nx) with proper workspace configuration

For now, manual sync after changes to `shared/` code.


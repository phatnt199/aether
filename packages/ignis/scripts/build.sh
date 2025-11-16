#!/bin/sh

echo "START | Building application..."

# Clean previous build
rm -rf dist

# Build with tsc using fast build config (minimal type checking)
tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json

echo "DONE | Build application (use 'bun run typecheck' for full type checking)"

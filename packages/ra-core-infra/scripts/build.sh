#!/bin/sh

echo "START | Building application..."
tsc -p tsconfig.json && tsc-alias -p tsconfig.json
# vite build

echo "DONE | Build application"

#!/bin/sh

echo "START | Building application..."
tsc -p tsconfig.json && tsc-alias -p tsconfig.json

cp -r "$(pwd)/tsconfig.json" "$(pwd)/dist/tsconfig.base.json"

echo "DONE | Build application"

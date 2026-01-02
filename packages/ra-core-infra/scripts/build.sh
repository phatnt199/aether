#!/bin/sh

echo "START | Building application..."

tsc -p tsconfig.json && \
tsc-alias -p tsconfig.json && \
echo "DONE | Build application" || \
{ exit 1; }

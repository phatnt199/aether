#!/bin/sh

echo "START | Building application..."

tsc -p tsconfig.json && tsc-alias -p tsconfig.json
sudo chmod +x dist/bin/*.js

echo "DONE | Build application"

#!/bin/sh

provision_opt=$1
case "$provision_opt" in
"no-version")
  echo "No versioning for current build!"
  ;;
*)
  npm version $provision_opt
  ;;
esac

echo "\nCleaning up resources ..."
bun run clean

echo "\nBuilding latest release..."
if ! bun run build; then
    echo "❌ Build failed!"
    exit 1
fi

echo "\nCalculating bundle size..."
bun run size

echo "\nPLEASE PUSH LATEST BUILT FOR ANY CHANGE(S)"

#!/bin/sh

provision_opt=$1
case "$provision_opt" in
"no-version")
  echo "No versioning for current build!"
  ;;
*)
  pnpm version $provision_opt
  ;;
esac

echo "\nCleaning up resources ..."
pnpm clean

echo "\nBuilding latest release..."
pnpm build

echo "\nPLEASE PUSH LATEST BUILT FOR ANY CHANGE(S)"

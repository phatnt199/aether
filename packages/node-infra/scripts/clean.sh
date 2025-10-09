#!/bin/sh

echo "Clean up ...START"
./node_modules/.bin/lb-clean dist *.tsbuildinfo .eslintcache

rm -rf artifact.zip

echo "Clean up ...DONE"

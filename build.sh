#!/bin/bash
set -e

echo "Building frontend..."
npm run build

echo "Building server..."
./node_modules/.bin/esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile=dist/index.cjs \
  --external:fsevents \
  --external:pg \
  --external:pg-native \
  --external:bufferutil \
  --external:utf-8-validate

echo "Build complete!"
ls -lh dist/index.cjs 2>/dev/null && ls -lh dist/index.html 2>/dev/null || ls dist/

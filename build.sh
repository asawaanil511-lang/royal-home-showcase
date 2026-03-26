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
  --external:fsevents

echo "Build complete!"
ls -lh dist/index.cjs dist/index.html

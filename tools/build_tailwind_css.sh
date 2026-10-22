#!/usr/bin/env bash
# Build assets/tailwind.css for index.html. Same Tailwind v3 line the
# cdn.tailwindcss.com runtime used, compiled ahead of time.
set -euo pipefail
cd "$(dirname "$0")/.."
npx --yes tailwindcss@3.4.17 -c tailwind.config.cjs -i tools/tailwind.input.css -o assets/tailwind.css --minify

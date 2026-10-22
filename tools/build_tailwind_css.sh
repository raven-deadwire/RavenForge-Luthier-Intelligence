#!/usr/bin/env bash
# Build the prebuilt Tailwind CSS files. Same Tailwind v3 line the
# cdn.tailwindcss.com runtime used, compiled ahead of time.
#   assets/tailwind.css               index.html
#   assets/configurator-tailwind.css  configurator.html, configurator-preview.html
set -euo pipefail
cd "$(dirname "$0")/.."
npx --yes tailwindcss@3.4.17 -c tailwind.config.cjs -i tools/tailwind.input.css -o assets/tailwind.css --minify
npx --yes tailwindcss@3.4.17 -c tailwind.configurator.config.cjs -i tools/tailwind.input.css -o assets/configurator-tailwind.css --minify

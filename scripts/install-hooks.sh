#!/usr/bin/env bash
set -euo pipefail

# One-time activation for this repo's .githooks/ — run manually:
#   ./scripts/install-hooks.sh
# Not invoked automatically (not on clone, not by any other script).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

git -C "$ROOT" config core.hooksPath .githooks
chmod +x "$ROOT"/.githooks/*

echo "Installed: core.hooksPath -> .githooks"
echo "Active hooks:"
for hook in "$ROOT"/.githooks/*; do
  echo "  - $(basename "$hook")"
done

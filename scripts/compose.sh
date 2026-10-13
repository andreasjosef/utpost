#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  compose=(docker compose)
elif command -v podman >/dev/null 2>&1; then
  compose=(podman compose)
else
  echo "compose.sh: neither docker nor podman found on PATH" >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."
"${compose[@]}" "$@"

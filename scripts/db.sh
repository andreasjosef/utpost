#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  compose=(docker compose)
elif command -v podman >/dev/null 2>&1; then
  compose=(podman compose)
else
  echo "db.sh: neither docker nor podman found on PATH" >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."
"${compose[@]}" -f docker-compose.dev.yml "$@"

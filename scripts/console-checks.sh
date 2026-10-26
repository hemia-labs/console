#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bun install --frozen-lockfile
bun run --cwd apps/api lint
bun run --cwd apps/web lint
bun run --cwd apps/api test --runInBand
bun run --cwd apps/api test:e2e --runInBand
bun run test:web
bun run test:release
bun run --cwd apps/api build
bun run --cwd apps/web build
bash scripts/console-smoke.sh

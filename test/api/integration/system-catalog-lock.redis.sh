#!/usr/bin/env bash
set -euo pipefail
console_root="$(cd "$(dirname "$0")/../../.." && pwd)"
container="console-system-lock-test-$$"
trap 'docker rm -f -v "$container" >/dev/null 2>&1 || true' EXIT
docker run -d --rm --name "$container" -p 127.0.0.1::6379 redis:8-alpine >/dev/null
for attempt in {1..30}; do
 if docker exec "$container" redis-cli ping >/dev/null 2>&1; then break; fi
 sleep 1
done
SYSTEM_LOCK_TEST_PORT="$(docker port "$container" 6379/tcp | awk -F: '{print $NF}')" node "$console_root/test/api/integration/system-catalog-lock.integration.cjs"

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
smoke_dir=$(mktemp -d)
smoke_project="console-smoke-${GITHUB_RUN_ID:-$$}"
export CONSOLE_API_ENV_FILE="$smoke_dir/api.env"
export CONSOLE_BIND_ADDRESS=127.0.0.1
export CONSOLE_API_PORT=0 CONSOLE_WEB_PORT=0
export CONSOLE_PUBLIC_URL="${CONSOLE_PUBLIC_URL:-https://console.hemia.cloud}"
cleanup() {
  docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf -- "$smoke_dir"
}
trap cleanup EXIT
sed 's/REPLACE_ON_SERVER/ci-placeholder/g; s/REDIS_HOST=host.docker.internal/REDIS_HOST=redis/' apps/api/.env.production.example > "$CONSOLE_API_ENV_FILE"
cat > "$smoke_dir/redis.json" <<'JSON'
{"services":{"redis":{"image":"redis:8-alpine","command":["redis-server","--requirepass","ci-placeholder"]}}}
JSON
docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" build
docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" up -d --wait --wait-timeout 120
# Readiness must detect a session store outage, then recover without a restart.
docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" stop redis
docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" exec -T api node -e "fetch('http://127.0.0.1:3016/health/ready').then(r=>process.exit(r.status===503?0:1)).catch(()=>process.exit(1))"
docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" start redis
docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" up -d --wait --wait-timeout 120
docker compose -p "$smoke_project" -f docker-compose.yml -f "$smoke_dir/redis.json" exec -T api node -e "(async()=>{for(let i=0;i<20;i++){try{const r=await fetch('http://127.0.0.1:3016/health/ready',{signal:AbortSignal.timeout(3000)});if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,500))}process.exit(1)})()"

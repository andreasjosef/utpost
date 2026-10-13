#!/usr/bin/env bash
# Mätningar till beslutsdokumentet (docs/decisions/databas.md): vad kostar /api/tours i dag,
# hur många mätpunkter finns, och hur stort blir den största turen som Mongo-dokument.
# Resultatet skrivs både till terminalen och till docs/decisions/matningar/tours-<tid>.log.
#
# Kräver att databaserna kör (npm run db:up). Startar API:et själv om det inte redan svarar.
#   bash scripts/measure-tours.sh          # mät mot den data som finns
#   bash scripts/measure-tours.sh --seed   # seeda om först (TÖMMER Postgres-tabellerna)
#
# Obs: mongo:smoke skriver den största turen som ett dokument i Mongo-collectionen tours.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

API=http://localhost:4000
LOG_DIR=docs/decisions/matningar
LOG="$LOG_DIR/tours-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$LOG_DIR"
exec > >(tee "$LOG") 2>&1

api_pid=
cleanup() { [[ -n $api_pid ]] && kill "$api_pid" 2>/dev/null || true; }
trap cleanup EXIT

echo "# Mätning av turer – $(date '+%Y-%m-%d %H:%M')"
echo "commit: $(git rev-parse --short HEAD) ($(git branch --show-current))"
echo

if [[ ${1:-} == --seed ]]; then
  echo "## Seed"
  npm run seed --silent
  echo
fi

# Starta API:et om det inte redan kör, och vänta tills det svarar.
if ! curl -sf "$API/api/health" >/dev/null; then
  (cd api && exec node src/index.js >/dev/null 2>&1) &
  api_pid=$!
  for _ in $(seq 30); do
    curl -sf "$API/api/health" >/dev/null && break
    sleep 0.5
  done
  curl -sf "$API/api/health" >/dev/null || { echo "API:et startade inte på $API" >&2; exit 1; }
fi

echo "## Postgres"
# Går via api/src/db/client.js, så att samma anslutning som API:et används (oberoende av docker/podman).
pg_json=$(node --input-type=module -e "
import { pool } from './api/src/db/client.js';
const one = async (sql) => (await pool.query(sql)).rows[0];
const counts = await one(\`select
  (select count(*)::int from tours) as tours,
  (select count(*)::int from tour_logs) as tour_logs,
  (select count(*)::int from photos) as photos\`);
const per = await one(\`select min(n)::int as min, round(avg(n), 1)::float as avg, max(n)::int as max
  from (select count(*) as n from tour_logs group by tour_id) t\`);
const largest = await one('select tour_id, count(*)::int as points from tour_logs group by tour_id order by 2 desc, 1 limit 1');
console.log(JSON.stringify({ ...counts, per, largest }));
await pool.end();
")
jq -r '"rader i tours:      \(.tours)",
       "rader i tour_logs:  \(.tour_logs)",
       "rader i photos:     \(.photos)",
       "punkter per tur:    min \(.per.min) · snitt \(.per.avg) · max \(.per.max)",
       "största turen:      id \(.largest.tour_id) med \(.largest.points) punkter"' <<<"$pg_json"
if [[ $(jq .tours <<<"$pg_json") == 0 ]]; then
  echo "Inga turer – kör med --seed." >&2
  exit 1
fi
echo

echo "## GET /api/tours"
body=$(mktemp)
trap 'cleanup; rm -f "$body"' EXIT
time_s=$(curl -sf -o "$body" -w '%{time_total}' "$API/api/tours")
full=$(wc -c <"$body")
no_logs=$(jq -c 'map(del(.logs))' "$body" | wc -c)
n=$(jq length "$body")
with_guide=$(jq '[.[] | select(.guide_id != null)] | length' "$body")
points_in_response=$(jq '[.[].logs | length] | add' "$body")
# Frågorna räknas ur routes/tours.js: 1 för listan, sedan per tur users + photos + tour_logs,
# och guides bara när turen har en guide.
queries=$((1 + 3 * n + with_guide))
echo "turer i svaret:     $n ($with_guide med guide)"
echo "mätpunkter i svaret: $points_in_response"
echo "svarets storlek:    $full bytes ($((full / 1024)) kB)"
echo "utan logs:          $no_logs bytes ($((no_logs / 1024)) kB) – det projektionen { logs: 0 } ungefär skickar"
echo "andel som är logs:  $(( (full - no_logs) * 100 / full )) %"
echo "svarstid:           ${time_s} s"
echo "databasfrågor:      $queries (1 + 3 × $n + $with_guide guider, ur routes/tours.js)"
echo

echo "## Största turen som Mongo-dokument (mongo:smoke)"
largest_id=$(jq .largest.tour_id <<<"$pg_json")
largest_points=$(jq .largest.points <<<"$pg_json")
smoke=$(npm run mongo:smoke --silent -- "$largest_id")
grep -E '^(Postgres|MongoDB):' <<<"$smoke"
kb=$(sed -nE 's/^MongoDB: +1 dokument, ([0-9.]+) kB/\1/p' <<<"$smoke")
echo
echo "## Gränsen 16 MB"
awk -v kb="$kb" -v p="$largest_points" 'BEGIN {
  per = kb / p
  max = 16 * 1024 / per
  printf "per punkt:          %.3f kB\n", per
  printf "max punkter/dokument: ~%d\n", max
  printf "det motsvarar:      %.0f h med en punkt per sekund · %.0f dygn med en var 5:e minut\n", max / 3600, max * 300 / 86400
}'
echo
echo "Logg: $LOG"

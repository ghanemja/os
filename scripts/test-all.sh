#!/usr/bin/env bash
# Runs `npm test` in every project folder and summarizes the results.
set -u
cd "$(dirname "$0")/.."
pass=(); fail=()
for dir in */; do
  dir="${dir%/}"
  [ -f "$dir/package.json" ] || continue
  if (cd "$dir" && npm test --silent >/dev/null 2>&1); then pass+=("$dir"); else fail+=("$dir"); fi
done
echo "passed (${#pass[@]}): ${pass[*]:-}"
echo "failed (${#fail[@]}): ${fail[*]:-}"
[ ${#fail[@]} -eq 0 ]

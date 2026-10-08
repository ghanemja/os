#!/usr/bin/env bash
# Splits each project folder into its own public GitHub repository,
# keeping that folder's git history.
#
# Requirements: git, and the GitHub CLI (`gh auth login` done once).
# Usage:  ./scripts/publish-repos.sh [owner] [project ...]
#   owner defaults to ghanemja; with no projects, every project folder is published.
# Safe to re-run: existing repos are reused and pushes are fast-forward only.
set -euo pipefail
cd "$(dirname "$0")/.."

owner="${1:-ghanemja}"; shift || true
projects=("$@")
if [ ${#projects[@]} -eq 0 ]; then
  for d in */; do d="${d%/}"; [ -f "$d/LICENSE" ] && projects+=("$d"); done
fi

for name in "${projects[@]}"; do
  echo "==> $name"
  desc=$(sed -n 's/^  "description": "\(.*\)",$/\1/p' "$name/package.json" 2>/dev/null | head -1)
  if ! gh repo view "$owner/$name" >/dev/null 2>&1; then
    gh repo create "$owner/$name" --public --description "${desc:-$name}"
  fi
  branch="split/$name"
  git subtree split --prefix="$name" -b "$branch" >/dev/null
  git push "https://github.com/$owner/$name.git" "$branch:main"
  git branch -D "$branch" >/dev/null
done
echo "Published ${#projects[@]} repositories under github.com/$owner"

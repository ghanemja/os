#!/usr/bin/env bash
# Splits each project folder into its own public GitHub repository,
# keeping that folder's git history.
#
# Requirements: git, and the GitHub CLI (`gh auth login` done once).
# Usage:  ./scripts/publish-repos.sh [owner] [project ...]
#   owner defaults to ghanemja; with no projects, every project folder is published.
# Safe to re-run: existing repos are reused and pushes are fast-forward only.
# A failure on one project is reported and the rest still run.
# Projects with .github/workflows/pages.yml also get GitHub Pages turned on.
set -uo pipefail
cd "$(dirname "$0")/.."

owner="${1:-ghanemja}"; shift || true
projects=("$@")
if [ ${#projects[@]} -eq 0 ]; then
  for d in */; do d="${d%/}"; [ -f "$d/LICENSE" ] && projects+=("$d"); done
fi

publish_one() {
  local name="$1" desc branch="split/$1"
  desc=$(sed -n 's/^  "description": "\(.*\)",$/\1/p' "$name/package.json" 2>/dev/null | head -1)
  if ! gh repo view "$owner/$name" >/dev/null 2>&1; then
    gh repo create "$owner/$name" --public --description "${desc:-$name}" || return 1
    sleep 2  # GitHub rate-limits rapid repo creation
  fi
  git branch -D "$branch" >/dev/null 2>&1
  git subtree split --prefix="$name" -b "$branch" >/dev/null || return 1
  git push "https://github.com/$owner/$name.git" "$branch:main" || { git branch -D "$branch" >/dev/null; return 1; }
  git branch -D "$branch" >/dev/null
  if [ -f "$name/.github/workflows/pages.yml" ]; then
    # Serve the site from the Pages workflow. POST enables Pages; PUT updates it if already on.
    gh api -X POST "repos/$owner/$name/pages" -f build_type=workflow >/dev/null 2>&1 ||
      gh api -X PUT "repos/$owner/$name/pages" -f build_type=workflow >/dev/null 2>&1 ||
      echo "   (could not enable Pages; turn it on under Settings → Pages → Source: GitHub Actions)"
    # The push may have triggered a deploy before Pages was on; run it again now that it is.
    sleep 3
    gh workflow run pages.yml -R "$owner/$name" >/dev/null 2>&1 || true
    echo "   site: https://$owner.github.io/$name/ (live in a minute or two)"
  fi
}

failed=()
for name in "${projects[@]}"; do
  echo "==> $name"
  publish_one "$name" || { failed+=("$name"); echo "!! $name failed, continuing"; }
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "Failed (${#failed[@]}): ${failed[*]}"
  echo "Retry just those:  ./scripts/publish-repos.sh $owner ${failed[*]}"
  exit 1
fi
echo "Published ${#projects[@]} repositories under github.com/$owner"

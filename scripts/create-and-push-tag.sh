#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
VERSION_BACKEND=$(jq -r '.version' ./backend/package.json)
VERSION_FRONTEND=$(jq -r '.version' ./frontend/package.json)

if [[ "$BRANCH" != "master" ]]; then
  echo 'Must be on master to create and push new tag!'
  exit 1
fi
if [[ "${VERSION_BACKEND}" != "${VERSION_FRONTEND}" ]]; then
  echo "Version mismatch between backend (${VERSION_BACKEND}) and frontend (${VERSION_FRONTEND})! Please use bump-project-to-version.sh first."
  exit 1
fi

echo "Creating a new tag \"v${VERSION_BACKEND}\""

git tag -a "v${VERSION_BACKEND}" -m "v${VERSION_BACKEND}"
git push origin "v${VERSION_BACKEND}"

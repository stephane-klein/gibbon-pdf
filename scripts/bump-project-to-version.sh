#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

if [[ $# -eq 0 ]] ; then
    echo "Must give a version as argument!"
    exit 0
fi
if [ ! -x "$(command -v jq)" ]; then
    echo "Must have jq in your path!"
    exit 1
fi

echo "Bump project to version \"${1}\""

jq -c ".version = \"${1}\"" ./backend/package.json > tmp.$$.json \
    && jq . tmp.$$.json > ./backend/package.json \
    && rm tmp.$$.json
jq -c ".version = \"${1}\"" ./frontend/package.json > tmp.$$.json \
    && jq . tmp.$$.json > ./frontend/package.json \
    && rm tmp.$$.json

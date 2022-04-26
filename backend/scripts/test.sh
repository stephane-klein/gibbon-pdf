#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

docker run \
    --rm \
    -e PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    -e PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    -v "${PWD}/src/:/src/src/" \
    -v "${PWD}/test:/src/test/" \
    -v "${PWD}/package.json:/src/package.json" \
    -v "${PWD}/yarn.lock:/src/yarn.lock" \
    node:14.19.1-alpine3.15 \
    sh -c "apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont && cd /src/ && yarn && yarn run test"

#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

docker rm -f test-gibbon-pdf
rm -rf node_modules/

docker run \
    --rm \
    --name test-gibbon-pdf \
    -e PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    -e PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    -v "${PWD}:/src/" \
    node:14.16.0-alpine3.13 \
    sh -c "apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont && cd /src/ && yarn && yarn run test"

docker rm -f test-gibbon-pdf
rm -rf node_modules/
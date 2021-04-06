#!/usr/bin/env bash
set -e

cd $(dirname "$0")

(
    cd ../frontend
    unset REACT_APP_API_URL
    yarn run build
)

(
    cd ..
    docker build . -f docker-image/Dockerfile -t harobed/poc-generate-pdf-with-html-template-and-jsonschema:latest
)
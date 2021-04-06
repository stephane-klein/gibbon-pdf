FROM node:11.14.0-alpine

RUN echo @edge http://nl.alpinelinux.org/alpine/v3.10/community >> /etc/apk/repositories \
    && echo @edge http://nl.alpinelinux.org/alpine/v3.10/main >> /etc/apk/repositories \
    && apk add --no-cache \
    chromium@edge \
    harfbuzz@edge \
    nss@edge \
    freetype@edge \
    ttf-freefont@edge \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.

RUN mkdir -p /src/
WORKDIR /src/

COPY frontend/build/ /src/frontend/
COPY backend/package.json /src/
COPY backend/yarn.lock /src/

RUN yarn install

COPY backend/src/ /src/src/

ENV PORT=5000
EXPOSE 5000

ENV TEMPLATES_PATH=/templates/
ENV STATIC_PATH=/src/frontend/
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

RUN chown pptruser /src/ -R

USER pptruser

CMD yarn run start
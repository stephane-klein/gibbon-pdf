FROM node:14.16.0-alpine3.13

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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
COPY pdf-templates/ /templates/

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
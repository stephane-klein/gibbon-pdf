FROM node:14.19.1-alpine3.15

RUN mkdir -p /src/

COPY frontend/ /src/frontend/
WORKDIR /src/frontend/

RUN yarn install
RUN yarn run build

FROM node:14.19.1-alpine3.15

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
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

COPY --from=0 /src/frontend/build/ /src/frontend/
COPY backend/package.json /src/
COPY backend/yarn.lock /src/
COPY pdf-templates/ /templates/

RUN yarn install

COPY backend/src/ /src/src/

ENV PORT=5000
ENV TEMPLATES_PATH=/templates/
ENV STATIC_PATH=/src/frontend/
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

EXPOSE 5000

RUN chown pptruser /src/ -R

USER pptruser

CMD yarn run start

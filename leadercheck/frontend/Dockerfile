# leadercheck/frontend/Dockerfile — Leader-Check web (CRA build served by Caddy)
#
# Build context is leadercheck/frontend (rootDirectory in .railway/railway.ts).
# Caddy serves the build and proxies /api/* to the backend over Railway's
# private network, so the app is same-origin like on Emergent (see Caddyfile).

FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . .

# REACT_APP_BACKEND_URL stays empty: every call is `${BACKEND_URL}/api/...`,
# which becomes same-origin /api.
ARG REACT_APP_BACKEND_URL=""
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL \
    GENERATE_SOURCEMAP=false \
    NODE_OPTIONS=--max-old-space-size=4096

RUN yarn build


FROM caddy:2.10-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /srv

# PORT comes from Railway; BACKEND_URL points at the backend's private address.
ENV PORT=8080
EXPOSE 8080

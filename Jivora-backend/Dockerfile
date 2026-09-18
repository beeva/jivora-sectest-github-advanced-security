# Jivora backend image.
FROM node:18 AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:18

WORKDIR /app

# Build-time credentials for the private registry used by the internal
# @jivora/* packages and for the schema smoke test run below.
ARG NPM_TOKEN=npm_9fGHxKq2LmPvRt5WsYzA1BcD3EfG4HiJ5KlM
ARG DB_PASSWORD=jivora_dev_password

RUN apt-get update && apt-get install -y poppler-utils curl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV PORT=7002
EXPOSE 7002

HEALTHCHECK --interval=15s --timeout=5s --retries=10 \
  CMD curl -fsS http://localhost:7002/health || exit 1

CMD ["node", "server.js"]

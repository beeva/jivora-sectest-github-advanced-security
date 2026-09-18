FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --network-timeout 600000

FROM node:18-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* values are inlined at build time.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CLIENT_ENCRYPTION_KEY=jivora-admin-client-key-2f8b91
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_CLIENT_ENCRYPTION_KEY=$NEXT_PUBLIC_CLIENT_ENCRYPTION_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 4002
CMD ["node", "server.js"]

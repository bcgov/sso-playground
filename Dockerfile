FROM node:22.18.0-alpine as base
FROM base AS deps
WORKDIR /app
COPY ./package.json yarn.lock ./
RUN yarn install --frozen-lockfile


FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM base AS runner
WORKDIR /app
ENV HOSTNAME=0.0.0.0
COPY public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js" ]

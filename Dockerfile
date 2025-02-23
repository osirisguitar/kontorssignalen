# This is a slimmed-down version of the Dockerfile used in the Next.js examples.
# -> https://github.com/vercel/next.js/tree/canary/examples/with-docker

FROM node:20 AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_TLS_REJECT_UNAUTHORIZED 0

COPY package*json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm ci --omit dev

# Production image, copy all the files and run next.
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000
CMD ["npm", "run", "start"]

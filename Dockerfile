FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Install frontend dependencies
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

# Build frontend
FROM base AS frontend-builder
WORKDIR /app

COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend ./frontend

WORKDIR /app/frontend
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app

ARG API_PATH=/api

# Install jq for JSON manipulation
RUN apk add --no-cache jq

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

WORKDIR /app/backend
# Update tsoa.json spec.basePath with the API_PATH using jq
RUN jq --arg path "$API_PATH" '.spec.basePath = $path' tsoa.json > tsoa.tmp && mv tsoa.tmp tsoa.json
RUN npm run build

# Final production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV FRONTEND_ORIGIN=http://localhost:8000
ENV API_PATH=/api
ENV DATABASE_PATH=/app/backend/database/database.sqlite

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy backend build (dist and public folders)
COPY --from=backend-builder /app/backend/dist ./backend
COPY --from=backend-builder /app/backend/public ./backend/public
# Copy sequelize files for migrations
COPY --from=backend-builder /app/backend/config ./backend/config
COPY --from=backend-builder /app/backend/migrations ./backend/migrations
COPY --from=backend-builder /app/backend/seeders ./backend/seeders

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Copy Next.js module for the server
COPY --from=deps /app/frontend/node_modules/next ./node_modules/next

# Install backend production dependencies only
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev
WORKDIR /app

## remove .env
RUN rm -f /app/frontend/.env && rm -f /app/backend/.env

# Copy custom entrypoint.js that combines frontend and backend
COPY entrypoint.js ./

# Expose the port
EXPOSE 8000

# Run database migrations and start the combined server
CMD ["node", "entrypoint.js"]

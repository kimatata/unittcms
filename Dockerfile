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

# Final production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV FRONTEND_ORIGIN=http://localhost:8000

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy backend files
COPY backend ./backend

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Copy Next.js module for the server
COPY --from=deps /app/frontend/node_modules/next ./node_modules/next

# Install backend dependencies directly in the container to ensure native modules are built correctly
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
WORKDIR /app

# Copy custom combined_server.js that combines frontend and backend
COPY combined_server.js ./

# Expose the port
EXPOSE 8000

# Run database migrations and start the combined server
CMD ["node", "combined_server.js"]

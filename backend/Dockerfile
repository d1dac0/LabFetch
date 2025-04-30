# Stage 1: Build Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build Source (if needed, e.g., for TypeScript)
# Skip for now as we are using plain JS initially
# FROM node:18-alpine AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# RUN npm run build # Assuming a build script exists

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app
# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
# Copy source code (or built code from builder stage if used)
COPY . .

EXPOSE 3001
CMD [ "node", "index.js" ] 
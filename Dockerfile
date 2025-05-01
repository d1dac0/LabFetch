# Stage 1: Build Backend Dependencies & Code
FROM node:20-slim AS backend-builder

# Install Python and build tools needed for native modules (like bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
# Copy source code first
COPY backend .
# Ensure node_modules doesn't exist before installing
RUN rm -rf node_modules
# Install production dependencies using npm install
RUN npm install --omit=dev --ignore-scripts # Use install, omit dev deps, ignore package scripts initially
# Explicitly rebuild bcrypt
RUN npm rebuild bcrypt --build-from-source

# Stage 2: Build Frontend Dependencies & Assets
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --build-from-source
COPY frontend .
RUN npx vite build

# Stage 3: Final Production Image
FROM node:20-slim

# Install supervisor and nginx
# Use debian package manager (apt-get) as node:20-slim is based on Debian
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy built backend code and dependencies from backend-builder stage
COPY --from=backend-builder /app/backend ./backend

# Copy built frontend assets from frontend-builder stage to nginx root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# --- Nginx Configuration ---
# Copy the Nginx configuration file provided in the frontend directory
# Note: Ensure nginx.conf correctly proxies /api/ to the backend
# Since backend runs on localhost:3001 *within the container*, proxy_pass should be http://localhost:3001
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# --- Supervisor Setup ---
# Copy the supervisor configuration file
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose the port Nginx listens on
EXPOSE 80

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 
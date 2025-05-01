# Use a Node.js base image
FROM node:20-slim

# Install supervisor and nginx
# Use debian package manager (apt-get) as node:20-slim is based on Debian
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# --- Backend Setup ---
# Copy backend package files and install dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --production

# Copy backend source code
COPY backend ./backend

# --- Frontend Setup ---
# Copy frontend package files first
COPY frontend/package.json frontend/package-lock.json* ./frontend/
# Install dependencies
RUN cd frontend && npm install --build-from-source
# Copy the rest of the frontend source code
COPY frontend ./frontend
# Build static assets
RUN cd frontend && npx vite build

# --- Copy Frontend Build Output to Nginx Root ---
# Make sure the build output is copied correctly
COPY frontend/dist /usr/share/nginx/html/

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
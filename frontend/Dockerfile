# Stage 1: Build the React application
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --build-from-source # Force rebuild of native deps
COPY . .
RUN npx vite build # Use vite build directly again

# Stage 2: Serve the static files with Nginx
FROM nginx:stable

# Ensure target directory exists with correct owner before copying
RUN mkdir -p /usr/share/nginx/html && chown nginx:nginx /usr/share/nginx/html

# Copy built assets and Nginx config
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Re-apply ownership and permissions recursively after copy
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 
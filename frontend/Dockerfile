# Frontend Dockerfile
FROM node:25-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install security updates
RUN apk --no-cache add dumb-init

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginxuser -u 1001 -G nginx
RUN chown -R nginxuser:nginx /usr/share/nginx/html
RUN chown -R nginxuser:nginx /var/cache/nginx
RUN chown -R nginxuser:nginx /var/log/nginx
RUN chown -R nginxuser:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginxuser:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginxuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start Nginx
CMD ["dumb-init", "nginx", "-g", "daemon off;"]
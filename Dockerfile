# ==============================================================================
# AlgoRecall — Production Dockerfile
# ==============================================================================
FROM node:22-alpine AS runtime

WORKDIR /app

# Enforce production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV MAX_USERS=5
ENV DATA_DIR=/app/data

# Copy application files (Zero external runtime dependencies)
COPY package.json ./
COPY server.js ./
COPY embedded-store.js ./
COPY index.html ./
COPY css/ ./css/
COPY js/ ./js/

# Create data directory with appropriate permissions
RUN mkdir -p /app/data && chown -R node:node /app

# User security hardening (run as unprivileged node user)
USER node

# Expose standard application port
EXPOSE 3000

# Native health check against /api/status
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/status').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Launch native HTTP server
CMD ["node", "server.js"]

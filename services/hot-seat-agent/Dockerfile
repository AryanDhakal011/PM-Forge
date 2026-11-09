FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/services/hot-seat-agent
COPY services/hot-seat-agent/package*.json ./
RUN npm ci
COPY services/hot-seat-agent/src ./src
COPY src/lib/hot-seat /app/src/lib/hot-seat
# Shared pure TypeScript modules resolve the same installed validator as the worker.
RUN ln -s /app/services/hot-seat-agent/node_modules /app/node_modules
ENV NODE_ENV=production
USER node
CMD ["npm","start"]

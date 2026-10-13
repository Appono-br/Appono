FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --workspace backend --omit=dev --ignore-scripts && npm cache clean --force

COPY backend/src backend/src
COPY backend/scripts backend/scripts
COPY backend/evaluation backend/evaluation
COPY backend/api backend/api

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "backend/src/server.js"]

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "tsx", "src/server.ts"]
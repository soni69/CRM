# ---------- Сборка клиента ----------
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/contracts/package.json shared/contracts/
COPY server/package.json server/
COPY client/package.json client/
RUN npm install --workspace=client --workspace=shared/contracts --include-workspace-root=false
COPY shared/contracts shared/contracts
COPY client client
RUN npm run build -w client

# ---------- Зависимости сервера (better-sqlite3 собирается из исходников) ----------
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/contracts/package.json shared/contracts/
COPY server/package.json server/
RUN npm install --workspace=server --workspace=shared/contracts --include-workspace-root=false --omit=dev

# ---------- Продакшн ----------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app /app
COPY shared/contracts shared/contracts
COPY server server
COPY --from=build /app/client/dist client/dist
EXPOSE 3001
VOLUME ["/app/data", "/app/uploads"]
WORKDIR /app/server
CMD ["npm", "start"]

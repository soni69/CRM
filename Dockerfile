# ---------- Сборка клиента ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/contracts/package.json shared/contracts/
COPY server/package.json server/
COPY client/package.json client/
RUN npm install --workspace=client --workspace=shared/contracts --include-workspace-root=false
COPY shared/contracts shared/contracts
COPY client client
RUN npm run build -w client

# ---------- Продакшн ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY shared/contracts/package.json shared/contracts/
COPY server/package.json server/
RUN npm install --workspace=server --workspace=shared/contracts --include-workspace-root=false --omit=dev
COPY shared/contracts shared/contracts
COPY server server
COPY --from=build /app/client/dist client/dist
EXPOSE 3001
VOLUME ["/app/data", "/app/uploads"]
WORKDIR /app/server
CMD ["npm", "start"]

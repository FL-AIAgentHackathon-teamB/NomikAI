# Frontend Dockerfile  
FROM node:20-slim AS builder

WORKDIR /app

# 依存関係のコピーとインストール
COPY package.json package-lock.json ./
RUN npm ci

# ソースコードのコピー
COPY . .

# Next.jsのビルド
RUN npm run build

# Production image
FROM node:20-slim

WORKDIR /app

# 本番環境用の依存関係のみインストール
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ビルド成果物のコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# ポート公開
EXPOSE 8080

# 環境変数
ENV NODE_ENV=production
ENV PORT=8080

# アプリケーション起動
CMD ["npm", "start"]

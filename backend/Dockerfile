# Backend Dockerfile
FROM node:20-slim

WORKDIR /app

# 依存関係のコピーとインストール（devDependencies含む）
COPY package.json package-lock.json ./
RUN npm ci

# ソースコードのコピー
COPY tsconfig.json ./
COPY src ./src

# TypeScriptのビルド
RUN npm run build

# 不要なdevDependenciesを削除
RUN npm prune --production

# ポート公開
EXPOSE 8080

# 環境変数
ENV NODE_ENV=production
ENV PORT=8080

# アプリケーション起動
CMD ["node", "dist/index.js"]

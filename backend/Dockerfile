FROM node:20-slim AS base
WORKDIR /app

# Instalar dependências apenas
COPY package*.json ./
RUN apt-get update -y && apt-get install -y openssl
RUN npm ci --only=production --ignore-scripts

# Gerar Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar código fonte
COPY src ./src

# Usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

CMD ["node", "src/server.js"]

# Stage de desenvolvimento
FROM base AS development
RUN npm ci
CMD ["node_modules/.bin/nodemon", "src/server.js"]

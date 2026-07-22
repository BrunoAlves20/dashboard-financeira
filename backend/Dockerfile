# Etapa 1: Build
FROM node:20-alpine AS builder

# Define o diretório de trabalho no Linux
WORKDIR /app

# Copia arquivos de dependências e configuração do Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDependencies necessárias para o build)
RUN npm install

# Copia o código-fonte
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Gera o build de produção (cria a pasta /app/dist/src ou /app/dist)
RUN npm run build

EXPOSE 3000

# Executa as migrações do banco e em seguida inicia o NestJS em produção
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
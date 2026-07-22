# Etapa 1: Build do Angular
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --configuration=production

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

# Remove o HTML padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o build do Angular (ajuste o caminho se o Angular 17 mudou a pasta de saída)
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copia a configuração personalizada de rotas
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
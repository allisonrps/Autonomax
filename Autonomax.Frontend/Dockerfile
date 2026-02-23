# Estágio de Build
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de Servidor (Nginx para servir os arquivos estáticos)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração para suportar o React Router
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# Utpost-klienten (Vue), multi-stage (M4).
# Steg 1 bygger appen med Node. Steg 2 kopierar bara dist/ till nginx, så Node och node_modules
# följer inte med in i den slutliga imagen.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY client/package.json client/
RUN npm ci --workspace=client

COPY shared/ shared/
COPY client/ client/
RUN npm run build --workspace=client

FROM nginx:1.27-alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

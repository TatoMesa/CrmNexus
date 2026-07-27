# --- ETAPA DE COMPILACIÓN ---
FROM node:22-alpine AS build

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Desactivar verificación estricta de SSL por posibles problemas de red en la descarga
RUN npm config set strict-ssl false

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar la aplicación React
RUN npm run build

# --- ETAPA DE PRODUCCIÓN ---
FROM node:22-alpine

WORKDIR /app

# Copiar package.json y package-lock.json para instalar solo dependencias de producción
COPY package*.json ./
RUN npm config set strict-ssl false
RUN npm install --only=production

# Copiar el compilado de la etapa anterior y el servidor express
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

# Exponer el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV PORT=3000
ENV NODE_ENV=production

# Arrancar la aplicación
CMD ["node", "server.js"]

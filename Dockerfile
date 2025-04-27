# Imagen base de Node.js
FROM node:20-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar solo package.json y package-lock.json
COPY server/package*.json ./server/

# Copiar el código de cliente y server
COPY cliente ./cliente
COPY server ./server

# Movernos a carpeta server
WORKDIR /app/server

# Instalar dependencias dentro del contenedor
RUN npm install

# Exponer puerto
EXPOSE 3000

# Comando para arrancar
CMD ["node", "server.js"]
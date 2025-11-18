# Compilar la aplicación
FROM node:18 AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# Copiamos todo el backend
COPY . .

RUN npm run build

# Imagen final 
FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
RUN npm install --omit=dev

# Copiar dist y frontend
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/frontend ./frontend

# COPY --from=build /usr/src/app/.env .env   <- lo quitamos para seguridad al subirlo a cloud

##EXPOSE 3000
EXPOSE 8080

CMD ["node", "dist/main.js"]

# Étape 1 : Build de l'application Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (npm ci est plus fiable pour production)
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Builder l'application en mode production
RUN npm run build -- --configuration production

# Étape 2 : Servir avec Nginx
FROM nginx:1.25-alpine

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis l'étape précédente
COPY --from=build /app/dist/card-angular /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]


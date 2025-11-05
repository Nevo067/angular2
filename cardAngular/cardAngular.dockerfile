# Étape 1 : Build de l'application Angular
FROM node:20-alpine AS build

# Variable d'environnement pour l'URL de l'API
ARG API_URL=http://146.59.230.54:8080/api
ENV API_URL=${API_URL}

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

# Variable d'environnement pour l'URL de l'API (runtime)
ENV API_URL=http://146.59.230.54:8080/api

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis l'étape précédente
COPY --from=build /app/dist/card-angular /usr/share/nginx/html

# Créer le script d'initialisation pour remplacer l'URL au démarrage
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-substitute-api-url.sh && \
    echo 'echo "🔧 Configuration de l API URL: ${API_URL}"' >> /docker-entrypoint.d/40-substitute-api-url.sh && \
    echo 'find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://146.59.230.54:8080/api|${API_URL}|g" {} \;' >> /docker-entrypoint.d/40-substitute-api-url.sh && \
    echo 'echo "✅ API URL configurée"' >> /docker-entrypoint.d/40-substitute-api-url.sh && \
    chmod +x /docker-entrypoint.d/40-substitute-api-url.sh

# Exposer le port 80
EXPOSE 80

# Démarrer nginx (les scripts dans /docker-entrypoint.d/ seront exécutés automatiquement)
CMD ["nginx", "-g", "daemon off;"]


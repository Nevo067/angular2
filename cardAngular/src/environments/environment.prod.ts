// Variable d'environnement pour l'URL de l'API
// Peut être remplacée au build ou via nginx
declare const API_URL: string;

export const environment = {
  production: true,
  // Utilise la variable d'environnement ou une valeur par défaut
  apiUrl: typeof API_URL !== 'undefined' ? API_URL : 'http://146.59.230.54:8080/api'
};

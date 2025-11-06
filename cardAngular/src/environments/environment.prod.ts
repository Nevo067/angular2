// Variable d'environnement pour l'URL de l'API
// Peut être remplacée au build ou via nginx
declare const API_URL: string;

export const environment = {
  production: true,
  // Cette URL sera remplacée par le Dockerfile au démarrage du conteneur
  // Elle doit correspondre à celle recherchée par le script sed (ligne 37 du Dockerfile)
  apiUrl: typeof API_URL !== 'undefined' ? API_URL : 'http://146.59.230.54:8080/api'
};

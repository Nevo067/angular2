/**
 * Modèle pour l'upload de fichiers
 */
export interface FileUploadResponse {
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
}

/**
 * Modèle pour la réponse d'upload
 */
export interface UploadResponse {
  success: boolean;
  message: string;
  file?: FileUploadResponse;
}

/**
 * Modèle pour les informations d'un fichier
 */
export interface FileInfo {
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: Date;
  url: string;
}

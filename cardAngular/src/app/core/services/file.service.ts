import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { map, catchError, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FileUploadResponse, UploadResponse, FileInfo } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.apiUrl || 'http://localhost:8080';
  }

  /**
   * Upload un fichier
   */
  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.baseUrl}/files/upload`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Upload un fichier avec progression
   */
  uploadFileWithProgress(file: File): Observable<HttpProgressEvent> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/files/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          return event as HttpProgressEvent;
        }
        return null;
      }),
      filter(event => event !== null),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère une image par son nom de fichier
   */
  getImage(fileName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/files/${fileName}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère l'URL d'une image
   */
  getImageUrl(fileName: string): string {
    return `${this.baseUrl}/files/${fileName}`;
  }

  /**
   * Supprime un fichier
   */
  deleteFile(fileName: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/files/${fileName}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les informations d'un fichier
   */
  getFileInfo(fileName: string): Observable<FileInfo> {
    return this.http.get<FileInfo>(`${this.baseUrl}/files/info/${fileName}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de l\'opération sur le fichier';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Erreur FileService:', errorMessage);
    throw new Error(errorMessage);
  }
}

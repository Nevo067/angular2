import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected readonly baseUrl: string;

  constructor(protected http: HttpClient) {
    this.baseUrl = environment.apiUrl || 'http://localhost:8080';
  }

  /**
   * Effectue une requête GET
   */
  protected get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log('🔍 Requête API:', fullUrl);
    console.log('🔍 Base URL:', this.baseUrl);
    console.log('🔍 Endpoint:', endpoint);

    return this.http.get<ApiResponse<T>>(fullUrl, { params: httpParams })
      .pipe(
        map(response => response.data || response as any),
        catchError(this.handleError)
      );
  }

  /**
   * Effectue une requête GET paginée
   */
  protected getPaginated<T>(endpoint: string, paginationParams?: PaginationParams): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();

    if (paginationParams) {
      if (paginationParams.page) {
        httpParams = httpParams.set('page', paginationParams.page.toString());
      }
      if (paginationParams.limit) {
        httpParams = httpParams.set('limit', paginationParams.limit.toString());
      }
      if (paginationParams.sortBy) {
        httpParams = httpParams.set('sortBy', paginationParams.sortBy);
      }
      if (paginationParams.sortOrder) {
        httpParams = httpParams.set('sortOrder', paginationParams.sortOrder);
      }
    }

    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Effectue une requête POST
   */
  protected post<T>(endpoint: string, data: any): Observable<T> {
    console.log(`📤 POST ${this.baseUrl}${endpoint}`);
    console.log('📦 Données envoyées:', data);
    console.log('📦 JSON stringifié:', JSON.stringify(data, null, 2));
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map(response => response.data || response as any),
        catchError(this.handleError)
      );
  }

  /**
   * Effectue une requête PUT
   */
  protected put<T>(endpoint: string, data: any): Observable<T> {
    console.log(`📤 PUT ${this.baseUrl}${endpoint}:`, data);
    return this.http.put<any>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map(response => {
          console.log(`📥 Réponse PUT ${endpoint}:`, response);
          console.log(`📥 Type de réponse:`, typeof response);
          console.log(`📥 Réponse est null/undefined:`, response === null || response === undefined);

          // Si la réponse est vide ou null, considérer comme succès
          if (response === null || response === undefined || response === '') {
            console.log('✅ Réponse vide détectée - considérée comme succès');
            return { success: true } as T;
          }

          // Si la réponse a une structure ApiResponse, extraire data
          if (response && typeof response === 'object' && 'data' in response) {
            return response.data;
          }

          // Sinon, retourner la réponse telle quelle
          return response;
        }),
        catchError(error => {
          console.log(`❌ Erreur PUT ${endpoint}:`, error);
          console.log(`❌ Status:`, error.status);
          console.log(`❌ Message:`, error.message);

          // Si c'est un code 200, ne pas le traiter comme une erreur
          if (error.status === 200) {
            console.log('✅ Code 200 détecté dans catchError - retourner succès');
            return of({ success: true } as T);
          }

          return this.handleError(error);
        })
      );
  }

  /**
   * Effectue une requête DELETE
   */
  protected delete<T>(endpoint: string): Observable<T> {
    console.log(`📤 DELETE ${this.baseUrl}${endpoint}`);
    return this.http.delete<any>(`${this.baseUrl}${endpoint}`)
      .pipe(
        map(response => {
          console.log(`📥 Réponse DELETE ${endpoint}:`, response);
          console.log(`📥 Type de réponse:`, typeof response);
          console.log(`📥 Réponse est null/undefined:`, response === null || response === undefined);

          // Si la réponse est vide ou null, considérer comme succès
          if (response === null || response === undefined || response === '') {
            console.log('✅ Réponse vide détectée - considérée comme succès');
            return { success: true } as T;
          }

          // Si la réponse a une structure ApiResponse, extraire data
          if (response && typeof response === 'object' && 'data' in response) {
            return response.data;
          }

          // Sinon, retourner la réponse telle quelle
          return response;
        }),
        catchError(error => {
          console.log(`❌ Erreur DELETE ${endpoint}:`, error);
          console.log(`❌ Status:`, error.status);
          console.log(`❌ Message:`, error.message);

          // Si c'est un code 200, ne pas le traiter comme une erreur
          if (error.status === 200) {
            console.log('✅ Code 200 détecté dans catchError - retourner succès');
            return of({ success: true } as T);
          }

          return this.handleError(error);
        })
      );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue';

    // Si c'est un code 200, ne pas le traiter comme une erreur
    if (error.status === 200) {
      console.log('✅ Réponse 200 reçue (succès) - ne pas traiter comme erreur');
      // Retourner un succès au lieu d'une erreur
      return throwError(() => new Error('Réponse 200 - succès'));
    }

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Erreur API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

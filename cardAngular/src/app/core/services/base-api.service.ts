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
   * Si `environment.apiUrl` se termine déjà par `/api` (convention du projet),
   * retire un préfixe redondant `/api/...` sur l’endpoint pour éviter `/api/api/...`.
   */
  protected normalizeEndpoint(endpoint: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    if (base.endsWith('/api') && endpoint.startsWith('/api/')) {
      return endpoint.substring(4);
    }
    return endpoint;
  }

  private resolveUrl(endpoint: string): string {
    return `${this.baseUrl}${this.normalizeEndpoint(endpoint)}`;
  }

  private logDebug(...args: unknown[]): void {
    if (!environment.production) {
      console.log(...args);
    }
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

    const fullUrl = this.resolveUrl(endpoint);
    this.logDebug('🔍 Requête API:', fullUrl);
    this.logDebug('🔍 Base URL:', this.baseUrl);
    this.logDebug('🔍 Endpoint:', endpoint);

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

    return this.http.get<PaginatedResponse<T>>(this.resolveUrl(endpoint), { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Effectue une requête POST
   */
  protected post<T>(endpoint: string, data: any): Observable<T> {
    this.logDebug(`📤 POST ${this.resolveUrl(endpoint)}`);
    this.logDebug('📦 Données envoyées:', data);
    this.logDebug('📦 JSON stringifié:', JSON.stringify(data, null, 2));
    return this.http.post<ApiResponse<T>>(this.resolveUrl(endpoint), data)
      .pipe(
        map(response => response.data || response as any),
        catchError(this.handleError)
      );
  }

  /**
   * Effectue une requête PUT
   */
  protected put<T>(endpoint: string, data: any): Observable<T> {
    this.logDebug(`📤 PUT ${this.resolveUrl(endpoint)}:`, data);
    return this.http.put<any>(this.resolveUrl(endpoint), data)
      .pipe(
        map(response => {
          this.logDebug(`📥 Réponse PUT ${endpoint}:`, response);
          this.logDebug(`📥 Type de réponse:`, typeof response);
          this.logDebug(`📥 Réponse est null/undefined:`, response === null || response === undefined);

          // Si la réponse est vide ou null, considérer comme succès
          if (response === null || response === undefined || response === '') {
            this.logDebug('✅ Réponse vide détectée - considérée comme succès');
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
          this.logDebug(`❌ Erreur PUT ${endpoint}:`, error);
          this.logDebug(`❌ Status:`, error.status);
          this.logDebug(`❌ Message:`, error.message);

          // Certains serveurs / proxies peuvent faire remonter un 200 dans le flux d’erreur HttpClient ;
          // on traite comme succès minimal pour ne pas bloquer l’UI.
          if (error.status === 200) {
            this.logDebug('✅ Code 200 détecté dans catchError - retourner succès');
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
    this.logDebug(`📤 DELETE ${this.resolveUrl(endpoint)}`);
    return this.http.delete<any>(this.resolveUrl(endpoint))
      .pipe(
        map(response => {
          this.logDebug(`📥 Réponse DELETE ${endpoint}:`, response);
          this.logDebug(`📥 Type de réponse:`, typeof response);
          this.logDebug(`📥 Réponse est null/undefined:`, response === null || response === undefined);

          if (response === null || response === undefined || response === '') {
            this.logDebug('✅ Réponse vide détectée - considérée comme succès');
            return { success: true } as T;
          }

          if (response && typeof response === 'object' && 'data' in response) {
            return response.data;
          }

          return response;
        }),
        catchError(error => {
          this.logDebug(`❌ Erreur DELETE ${endpoint}:`, error);
          this.logDebug(`❌ Status:`, error.status);
          this.logDebug(`❌ Message:`, error.message);

          if (error.status === 200) {
            this.logDebug('✅ Code 200 détecté dans catchError - retourner succès');
            return of({ success: true } as T);
          }

          return this.handleError(error);
        })
      );
  }

  /**
   * Gestion des erreurs HTTP.
   *
   * Note : la branche `error.status === 200` est un filet rare ; en pratique les succès
   * HTTP ne passent pas par `handleError`. Les `catchError` sur PUT/DELETE gèrent le cas
   * « 200 dans le flux d’erreur » avant d’appeler cette méthode.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue';

    if (error.status === 200) {
      if (!environment.production) {
        console.log('✅ Réponse 200 reçue (succès) — handleError ignoré côté flux normal');
      }
      return throwError(() => new Error('Réponse 200 - succès'));
    }

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    if (!environment.production) {
      console.error('Erreur API:', errorMessage);
    }
    return throwError(() => new Error(errorMessage));
  }
}

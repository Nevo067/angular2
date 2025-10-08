import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  Effect,
  CreateEffectRequest,
  UpdateEffectRequest,
  PaginationParams
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class EffectService extends BaseApiService {
  private readonly endpoint = '/Effect';

  /**
   * Récupère tous les effets avec conditions et actions
   */
  getAllEffects(paginationParams?: PaginationParams): Observable<Effect[]> {
    return this.get<Effect[]>(this.endpoint, paginationParams);
  }

  /**
   * Récupère un effet par son ID
   */
  getEffectById(id: number): Observable<Effect> {
    return this.get<Effect>(`${this.endpoint}/${id}`);
  }

  /**
   * Récupère un effet complet avec conditions et actions
   */
  getEffectComplete(id: number): Observable<Effect> {
    return this.get<Effect>(`${this.endpoint}/${id}/complete`);
  }

  /**
   * Récupère seulement les conditions d'un effet
   */
  getEffectConditions(id: number): Observable<any[]> {
    return this.get<any[]>(`${this.endpoint}/${id}/conditions`);
  }

  /**
   * Récupère seulement les actions d'un effet
   */
  getEffectActions(id: number): Observable<any[]> {
    return this.get<any[]>(`${this.endpoint}/${id}/actions`);
  }

  /**
   * Crée un nouvel effet
   */
  createEffect(effect: CreateEffectRequest): Observable<Effect> {
    return this.post<Effect>(this.endpoint, effect);
  }

  /**
   * Met à jour un effet existant
   */
  updateEffect(effect: UpdateEffectRequest): Observable<Effect> {
    return this.put<Effect>(this.endpoint, effect);
  }

  /**
   * Supprime un effet
   */
  deleteEffect(id: number): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Recherche des effets par nom
   */
  searchEffectsByName(name: string): Observable<Effect[]> {
    return this.get<Effect[]>(`${this.endpoint}/search`, { name });
  }

  // ===== GESTION DES CONDITIONS =====

  /**
   * Ajoute une condition à un effet
   */
  addConditionToEffect(effectId: number, conditionId: number): Observable<any> {
    return this.put<any>(`${this.endpoint}/addCondition/${effectId}/${conditionId}`, {});
  }

  /**
   * Ajoute plusieurs conditions à un effet
   */
  addConditionsToEffect(effectId: number, conditionIds: number[]): Observable<any> {
    return this.put<any>(`${this.endpoint}/${effectId}/conditions`, conditionIds);
  }

  /**
   * Remplace toutes les conditions d'un effet
   */
  replaceEffectConditions(effectId: number, conditionIds: number[]): Observable<any> {
    console.log(`🔄 Remplacement des conditions pour l'effet ${effectId}:`, conditionIds);
    return this.put<any>(`${this.endpoint}/${effectId}/replaceConditions`, conditionIds);
  }

  /**
   * Supprime une condition d'un effet
   */
  removeConditionFromEffect(effectId: number, conditionId: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/${effectId}/conditions/${conditionId}`);
  }

  // ===== GESTION DES ACTIONS =====

  /**
   * Ajoute une action à un effet
   */
  addActionToEffect(effectId: number, actionId: number): Observable<any> {
    return this.put<any>(`${this.endpoint}/addAction/${effectId}/${actionId}`, {});
  }

  /**
   * Ajoute plusieurs actions à un effet
   */
  addActionsToEffect(effectId: number, actionIds: number[]): Observable<any> {
    return this.put<any>(`${this.endpoint}/${effectId}/actions`, actionIds);
  }

  /**
   * Remplace toutes les actions d'un effet
   */
  replaceEffectActions(effectId: number, actionIds: number[]): Observable<any> {
    console.log(`🔄 Remplacement des actions pour l'effet ${effectId}:`, actionIds);
    return this.put<any>(`${this.endpoint}/${effectId}/replaceActions`, actionIds);
  }

  /**
   * Supprime une action d'un effet
   */
  removeActionFromEffect(effectId: number, actionId: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/${effectId}/actions/${actionId}`);
  }
}

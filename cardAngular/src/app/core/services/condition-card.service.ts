import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  ConditionCard,
  CreateConditionCardRequest,
  UpdateConditionCardRequest,
  PaginationParams
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ConditionCardService extends BaseApiService {
  private readonly endpoint = '/ConditionCard';

  /**
   * Récupère toutes les conditions
   */
  getAllConditions(paginationParams?: PaginationParams): Observable<ConditionCard[]> {
    return this.get<ConditionCard[]>(this.endpoint, paginationParams);
  }

  /**
   * Récupère une condition par son ID
   */
  getConditionById(id: number): Observable<ConditionCard> {
    return this.get<ConditionCard>(`${this.endpoint}/${id}`);
  }

  /**
   * Crée une nouvelle condition
   */
  createCondition(condition: CreateConditionCardRequest): Observable<ConditionCard> {
    return this.post<ConditionCard>(this.endpoint, condition);
  }

  /**
   * Met à jour une condition existante
   */
  updateCondition(condition: UpdateConditionCardRequest): Observable<ConditionCard> {
    return this.put<ConditionCard>(this.endpoint, condition);
  }

  /**
   * Supprime une condition
   */
  deleteCondition(id: number): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Recherche des conditions par nom
   */
  searchConditionsByName(name: string): Observable<ConditionCard[]> {
    return this.get<ConditionCard[]>(`${this.endpoint}/search`, { name });
  }

  /**
   * Récupère toutes les conditions d'une carte spécifique
   */
  getConditionsByCardId(cardId: number): Observable<ConditionCard[]> {
    return this.get<ConditionCard[]>(`${this.endpoint}/card/${cardId}`);
  }

  /**
   * Récupère toutes les conditions d'un effet spécifique
   */
  getConditionsByEffectId(effectId: number): Observable<ConditionCard[]> {
    return this.get<ConditionCard[]>(`${this.endpoint}/effect/${effectId}`);
  }

  /**
   * Récupère toutes les conditions avec leurs actions
   * Utilise l'endpoint GET /ConditionCard/complete
   */
  getAllConditionsComplete(): Observable<ConditionCard[]> {
    return this.get<ConditionCard[]>(`${this.endpoint}/complete`);
  }

  /**
   * Récupère une condition spécifique avec ses actions
   * Utilise l'endpoint GET /ConditionCard/{id}/complete
   */
  getConditionComplete(id: number): Observable<ConditionCard> {
    return this.get<ConditionCard>(`${this.endpoint}/${id}/complete`);
  }

  /**
   * Récupère seulement les actions d'une condition
   * Utilise l'endpoint GET /ConditionCard/{id}/actions
   */
  getConditionActions(id: number): Observable<any[]> {
    return this.get<any[]>(`${this.endpoint}/${id}/actions`);
  }

  /**
   * Ajoute une action à une condition
   * Utilise l'endpoint PUT /ConditionCard/{conditionId}/actions/{actionId}
   */
  addActionToCondition(conditionId: number, actionId: number): Observable<any> {
    return this.put<any>(`${this.endpoint}/${conditionId}/actions/${actionId}`, {});
  }

  /**
   * Remplace toutes les actions d'une condition
   * Utilise l'endpoint PUT /ConditionCard/{conditionId}/actions
   */
  replaceConditionActions(conditionId: number, actionIds: number[]): Observable<any> {
    console.log(`🔄 Remplacement des actions pour la condition ${conditionId}:`, actionIds);
    return this.put<any>(`${this.endpoint}/${conditionId}/actions`, actionIds);
  }

  /**
   * Supprime une action d'une condition
   * Utilise l'endpoint DELETE /ConditionCard/{conditionId}/actions/{actionId}
   */
  removeActionFromCondition(conditionId: number, actionId: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/${conditionId}/actions/${actionId}`);
  }
}

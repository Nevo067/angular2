import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  ActionCard,
  CreateActionCardRequest,
  UpdateActionCardRequest,
  PaginationParams
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ActionCardService extends BaseApiService {
  private readonly endpoint = '/ActionCard';

  /**
   * Récupère toutes les actions
   */
  getAllActions(paginationParams?: PaginationParams): Observable<ActionCard[]> {
    return this.get<ActionCard[]>(this.endpoint, paginationParams);
  }

  /**
   * Récupère une action par son ID
   */
  getActionById(id: number): Observable<ActionCard> {
    return this.get<ActionCard>(`${this.endpoint}/${id}`);
  }

  /**
   * Crée une nouvelle action
   */
  createAction(action: CreateActionCardRequest): Observable<ActionCard> {
    return this.post<ActionCard>(this.endpoint, action);
  }

  /**
   * Met à jour une action existante
   */
  updateAction(action: UpdateActionCardRequest): Observable<ActionCard> {
    return this.put<ActionCard>(this.endpoint, action);
  }

  /**
   * Supprime une action
   */
  deleteAction(id: number): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Ajoute une condition à une action
   */
  addConditionToAction(actionId: number, conditionId: number): Observable<ActionCard> {
    return this.put<ActionCard>(`${this.endpoint}/addCondition/${actionId}/${conditionId}`, {});
  }

  /**
   * Recherche des actions par nom
   */
  searchActionsByName(name: string): Observable<ActionCard[]> {
    return this.get<ActionCard[]>(`${this.endpoint}/search`, { name });
  }

  /**
   * Récupère toutes les actions d'une carte spécifique
   */
  getActionsByCardId(cardId: number): Observable<ActionCard[]> {
    return this.get<ActionCard[]>(`${this.endpoint}/card/${cardId}`);
  }

  /**
   * Récupère toutes les actions d'un effet spécifique
   */
  getActionsByEffectId(effectId: number): Observable<ActionCard[]> {
    return this.get<ActionCard[]>(`${this.endpoint}/effect/${effectId}`);
  }
}

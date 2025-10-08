import { ActionCard } from './action-card.model';
import { Effect } from './effect.model';

/**
 * Modèle pour les conditions des cartes
 */
export interface ConditionCard {
  id: number;
  nameCondition: string;
  description: string;
  actions?: ActionCard[];
  effects?: Effect[];
}

/**
 * Modèle pour créer une nouvelle condition
 */
export interface CreateConditionCardRequest {
  nameCondition: string;
  description: string;
  actionIds?: number[];
}

/**
 * Modèle pour mettre à jour une condition
 */
export interface UpdateConditionCardRequest {
  id: number;
  nameCondition: string;
  description: string;
  actionIds?: number[];
}

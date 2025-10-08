import { ConditionCard } from './condition-card.model';
import { ActionCard } from './action-card.model';

/**
 * Modèle pour les effets des cartes
 */
export interface Effect {
  id: number;
  effectName: string;
  description: string;
  conditionCards: ConditionCard[];
  actions: ActionCard[];
}

/**
 * Modèle pour créer un nouvel effet
 */
export interface CreateEffectRequest {
  effectName: string;
  description: string;
  conditionCardIds: number[];
  actionIds: number[];
}

/**
 * Modèle pour mettre à jour un effet
 */
export interface UpdateEffectRequest {
  id: number;
  effectName: string;
  description: string;
  conditionCardIds: number[];
  actionIds: number[];
}

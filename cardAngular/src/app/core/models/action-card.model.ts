import { ConditionCard } from './condition-card.model';

/**
 * Modèle pour les actions des cartes
 */
export interface ActionCard {
  id: number;
  actionName: string;
  description: string;
  cardCondition: ConditionCard;
}

/**
 * Modèle pour créer une nouvelle action
 */
export interface CreateActionCardRequest {
  actionName: string;
  description: string;
  cardConditionId: number;
}

/**
 * Modèle pour mettre à jour une action
 */
export interface UpdateActionCardRequest {
  id: number;
  actionName: string;
  description: string;
  cardConditionId: number;
}

import { ConditionCard } from './condition-card.model';
import { ActionParameterValueDTO } from './action-parameter-value.model';

/**
 * Modèle pour les actions des cartes
 */
export interface ActionCard {
  id: number;
  actionName: string;
  description: string;
  cardCondition: ConditionCard;
  parameters?: ActionParameterValueDTO[];
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

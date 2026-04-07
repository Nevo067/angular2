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
  /** @deprecated côté API : liaisons = {@link conditionIds} ; conservé pour les anciens écrans */
  cardConditionId?: number;
  /** Ordre conservé ; absent = aucune liaison à la création */
  conditionIds?: number[];
}

/**
 * Modèle pour mettre à jour une action
 */
export interface UpdateActionCardRequest {
  id: number;
  actionName: string;
  description: string;
  cardConditionId?: number;
  /** Si absent, le back ne modifie pas les liaisons condition ↔ action */
  conditionIds?: number[];
}

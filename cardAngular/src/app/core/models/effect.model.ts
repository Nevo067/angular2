import { ConditionCard } from './condition-card.model';
import { ActionCard } from './action-card.model';
import { ConditionParameterValueDTO } from './condition-parameter-value.model';

/**
 * Condition liée à un effet avec paramètres propres à la liaison (API /complete, /conditions).
 */
export interface EffectCondition {
  effectConditionId?: number;
  conditionId: number;
  nameCondition?: string;
  description?: string;
  parameters?: ConditionParameterValueDTO[];
}

/**
 * Modèle pour les effets des cartes
 */
export interface Effect {
  id: number;
  effectName: string;
  description: string;
  /** Réponses complètes : paramètres par liaison effet/condition */
  conditions?: EffectCondition[];
  /** Réponse entité simple (GET /Effect/:id) : cartes sans paramètres de liaison */
  conditionCards?: ConditionCard[];
  actions: ActionCard[];
}

/** Affichage : unifie `conditions` (API complète) et `conditionCards` (entité). */
export function getEffectConditionsForDisplay(effect: Effect): { id: number; nameCondition?: string; description?: string }[] {
  if (effect.conditions?.length) {
    return effect.conditions.map(c => ({
      id: c.conditionId,
      nameCondition: c.nameCondition,
      description: c.description
    }));
  }
  return (effect.conditionCards || []).map(c => ({
    id: c.id,
    nameCondition: c.nameCondition,
    description: c.description
  }));
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

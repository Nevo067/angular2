import { firstValueFrom } from 'rxjs';
import { Effect, ActionCard } from '../../core/models';
import { ConditionParameterService } from '../../core/services/condition-parameter.service';
import { EffectParameterService } from '../../core/services/effect-parameter.service';
import { serializeParameterValues } from './export-parameters';

export function collectConditionParameterKeysFromEffects(effects: Effect[]): Set<string> {
  const pairs = new Set<string>();
  effects.forEach((effect) => {
    if (!effect.id) {
      return;
    }
    const ids: number[] = effect.conditions?.length
      ? effect.conditions.map((c) => c.conditionId)
      : (effect.conditionCards || []).map((c) => c.id);
    ids.filter(Boolean).forEach((cid) => pairs.add(`${effect.id}-${cid}`));
  });
  return pairs;
}

export function collectEffectActionParameterKeysFromEffects(effects: Effect[]): Set<string> {
  const pairs = new Set<string>();
  effects.forEach((effect) => {
    if (!effect.id) {
      return;
    }
    effect.actions?.forEach((action) => {
      if (action.id) {
        pairs.add(`${effect.id}-${action.id}`);
      }
    });
  });
  return pairs;
}

export async function loadConditionParametersMapForKeys(
  service: ConditionParameterService,
  keys: Set<string>
): Promise<Map<string, any[]>> {
  const map = new Map<string, any[]>();
  await Promise.all(
    Array.from(keys).map(async (key) => {
      const [effectIdStr, conditionIdStr] = key.split('-');
      const effectId = Number(effectIdStr);
      const conditionId = Number(conditionIdStr);
      try {
        const params = await firstValueFrom(service.list(effectId, conditionId));
        map.set(key, params ?? []);
      } catch {
        map.set(key, []);
      }
    })
  );
  return map;
}

export async function loadEffectActionParametersMapForKeys(
  service: EffectParameterService,
  keys: Set<string>
): Promise<Map<string, any[]>> {
  const map = new Map<string, any[]>();
  await Promise.all(
    Array.from(keys).map(async (key) => {
      const [effectIdStr, actionIdStr] = key.split('-');
      const effectId = Number(effectIdStr);
      const actionId = Number(actionIdStr);
      try {
        const params = await firstValueFrom(service.list(effectId, actionId));
        map.set(key, params ?? []);
      } catch {
        map.set(key, []);
      }
    })
  );
  return map;
}

/**
 * Nœud JSON « effet » pour export cartes / export effets (même forme).
 */
export function buildEffectExportNode(
  effect: Effect,
  actionsMap: Map<number, ActionCard>,
  conditionParamsMap: Map<string, any[]>,
  effectParamsMap: Map<string, any[]>
): Record<string, unknown> {
  const effectParametersByAction: Record<string, ReturnType<typeof serializeParameterValues>> = {};
  if (effect.actions) {
    effect.actions.forEach((action) => {
      if (action.id) {
        const effectParamsKey = `${effect.id}-${action.id}`;
        const effectParameters = effectParamsMap.get(effectParamsKey) || [];
        const serialized = serializeParameterValues(effectParameters);
        if (serialized.length > 0) {
          effectParametersByAction[String(action.id)] = serialized;
        }
      }
    });
  }

  const conditionRows =
    effect.conditions?.length
      ? effect.conditions
      : (effect.conditionCards || []).map((c) => ({
          conditionId: c.id,
          nameCondition: c.nameCondition,
          description: c.description,
          parameters: [] as any[]
        }));

  const effectData: Record<string, unknown> = {
    id: effect.id,
    effectName: effect.effectName || '',
    description: effect.description || '',
    conditionCards: conditionRows.map((condition: any) => {
      const cid = condition.conditionId ?? condition.id;
      const key = `${effect.id}-${cid}`;
      const embedded = condition.parameters;
      const conditionParams =
        embedded && embedded.length > 0 ? embedded : conditionParamsMap.get(key) || [];

      return {
        id: cid,
        nameCondition: condition.nameCondition || '',
        description: condition.description || '',
        parameters: serializeParameterValues(conditionParams)
      };
    }),
    actions: (effect.actions || []).map((action) => {
      const actionWithParameters = actionsMap.get(action.id);
      const parameters = actionWithParameters?.parameters || [];
      const effectParamsKey = `${effect.id}-${action.id}`;
      const linkRaw = effectParamsMap.get(effectParamsKey) || [];

      return {
        id: action.id,
        actionName: action.actionName || '',
        description: action.description || '',
        parameters: serializeParameterValues(parameters),
        effectLinkParameters: serializeParameterValues(linkRaw)
      };
    })
  };

  if (Object.keys(effectParametersByAction).length > 0) {
    effectData['effectParameters'] = effectParametersByAction;
  }

  return effectData;
}

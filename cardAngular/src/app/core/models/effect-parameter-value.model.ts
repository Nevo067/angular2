export interface EffectParameterValueDTO {
  id?: number;
  effectId: number;
  actionId: number;
  parameterDefinitionCode: string;
  valueString?: string | null;
  valueNumber?: number | null;
  enumOptionCode?: string | null;
}


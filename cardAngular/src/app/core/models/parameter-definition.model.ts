export type ParameterValueType = 'STRING' | 'NUMBER' | 'ENUM';

export interface ParameterDefinitionDTO {
  id?: number;
  code: string;
  label: string;
  valueType: ParameterValueType;
  description?: string;
}



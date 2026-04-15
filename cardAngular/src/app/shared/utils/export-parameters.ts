/**
 * Ligne JSON commune pour les valeurs de paramètres (action / condition / effet).
 */
export interface ParameterExportRow {
  parameterDefinitionCode: string;
  valueString: string | null;
  valueNumber: number | null;
  enumOptionCode: string | null;
}

export type ParameterValueLike = {
  parameterDefinitionCode: string;
  valueString?: string | null;
  valueNumber?: number | null;
  enumOptionCode?: string | null;
};

export function serializeParameterValues(
  params: ParameterValueLike[] | undefined | null
): ParameterExportRow[] {
  if (!params?.length) {
    return [];
  }
  return params.map((p) => ({
    parameterDefinitionCode: p.parameterDefinitionCode,
    valueString: p.valueString ?? null,
    valueNumber: p.valueNumber ?? null,
    enumOptionCode: p.enumOptionCode ?? null
  }));
}

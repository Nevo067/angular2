import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { EnumOptionDTO, ParameterDefinitionDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ParameterDefinitionService extends BaseApiService {

  listDefinitions(): Observable<ParameterDefinitionDTO[]> {
    return this.get<ParameterDefinitionDTO[]>(`/parameters/definitions`);
  }

  listEnumOptions(definitionCode: string): Observable<EnumOptionDTO[]> {
    return this.get<EnumOptionDTO[]>(`/parameters/definitions/${encodeURIComponent(definitionCode)}/options`);
  }

  createDefinition(payload: ParameterDefinitionDTO): Observable<ParameterDefinitionDTO> {
    return this.post<ParameterDefinitionDTO>(`/parameters/definitions`, payload);
  }

  updateDefinition(code: string, payload: ParameterDefinitionDTO): Observable<ParameterDefinitionDTO> {
    return super.put<ParameterDefinitionDTO>(`/parameters/definitions/${encodeURIComponent(code)}`, payload);
  }

  deleteDefinition(code: string): Observable<any> {
    return super.delete(`/parameters/definitions/${encodeURIComponent(code)}`);
  }

  addEnumOption(definitionCode: string, payload: EnumOptionDTO): Observable<EnumOptionDTO> {
    return this.post<EnumOptionDTO>(`/parameters/definitions/${encodeURIComponent(definitionCode)}/options`, payload);
  }

  deleteEnumOption(definitionCode: string, optionId: number): Observable<any> {
    return super.delete(`/parameters/definitions/${encodeURIComponent(definitionCode)}/options/${optionId}`);
  }

  updateEnumOption(definitionCode: string, optionId: number, payload: Partial<EnumOptionDTO>): Observable<EnumOptionDTO> {
    return super.put<EnumOptionDTO>(
      `/parameters/definitions/${encodeURIComponent(definitionCode)}/options/${optionId}`,
      payload as EnumOptionDTO
    );
  }

  reorderEnumOptions(definitionCode: string, orderedIds: number[]): Observable<void> {
    return super.put<void>(
      `/parameters/definitions/${encodeURIComponent(definitionCode)}/options/reorder`,
      { orderedIds }
    );
  }
}



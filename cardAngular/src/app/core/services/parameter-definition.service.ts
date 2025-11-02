import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { EnumOptionDTO, ParameterDefinitionDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ParameterDefinitionService extends BaseApiService {

  listDefinitions(): Observable<ParameterDefinitionDTO[]> {
    return this.get<ParameterDefinitionDTO[]>(`/api/parameters/definitions`);
  }

  listEnumOptions(definitionCode: string): Observable<EnumOptionDTO[]> {
    return this.get<EnumOptionDTO[]>(`/api/parameters/definitions/${encodeURIComponent(definitionCode)}/options`);
  }

  createDefinition(payload: ParameterDefinitionDTO): Observable<ParameterDefinitionDTO> {
    return this.post<ParameterDefinitionDTO>(`/api/parameters/definitions`, payload);
  }

  updateDefinition(code: string, payload: ParameterDefinitionDTO): Observable<ParameterDefinitionDTO> {
    return super.put<ParameterDefinitionDTO>(`/api/parameters/definitions/${encodeURIComponent(code)}`, payload);
  }

  deleteDefinition(code: string): Observable<any> {
    return super.delete(`/api/parameters/definitions/${encodeURIComponent(code)}`);
  }

  addEnumOption(definitionCode: string, payload: EnumOptionDTO): Observable<EnumOptionDTO> {
    return this.post<EnumOptionDTO>(`/api/parameters/definitions/${encodeURIComponent(definitionCode)}/options`, payload);
  }

  deleteEnumOption(definitionCode: string, optionId: number): Observable<any> {
    return super.delete(`/api/parameters/definitions/${encodeURIComponent(definitionCode)}/options/${optionId}`);
  }
}



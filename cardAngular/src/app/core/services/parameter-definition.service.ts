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
}



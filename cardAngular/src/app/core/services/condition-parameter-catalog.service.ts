import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ConditionParameterCatalogEntryDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ConditionParameterCatalogService extends BaseApiService {
  list(conditionId: number): Observable<ConditionParameterCatalogEntryDTO[]> {
    return this.get<ConditionParameterCatalogEntryDTO[]>(`/conditions/${conditionId}/parameter-definitions`);
  }

  add(conditionId: number, body: { parameterDefinitionCode: string }): Observable<ConditionParameterCatalogEntryDTO> {
    return this.post<ConditionParameterCatalogEntryDTO>(`/api/conditions/${conditionId}/parameter-definitions`, body);
  }

  remove(conditionId: number, linkId: number): Observable<unknown> {
    return this.delete(`/conditions/${conditionId}/parameter-definitions/${linkId}`);
  }
}

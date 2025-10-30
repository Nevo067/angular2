import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ConditionParameterValueDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ConditionParameterService extends BaseApiService {

  list(conditionId: number): Observable<ConditionParameterValueDTO[]> {
    return this.get<ConditionParameterValueDTO[]>(`/api/conditions/${conditionId}/parameters`);
  }

  upsert(conditionId: number, payload: ConditionParameterValueDTO): Observable<ConditionParameterValueDTO> {
    return this.post<ConditionParameterValueDTO>(`/api/conditions/${conditionId}/parameters`, payload);
  }

  delete(conditionId: number, id: number): Observable<any> {
    return this.delete<any>(`/api/conditions/${conditionId}/parameters/${id}`);
  }
}



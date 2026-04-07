import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ConditionParameterValueDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ConditionParameterService extends BaseApiService {

  list(effectId: number, conditionId: number): Observable<ConditionParameterValueDTO[]> {
    return this.get<ConditionParameterValueDTO[]>(`/effects/${effectId}/conditions/${conditionId}/parameters`);
  }

  upsert(effectId: number, conditionId: number, payload: ConditionParameterValueDTO): Observable<ConditionParameterValueDTO> {
    return this.post<ConditionParameterValueDTO>(`/effects/${effectId}/conditions/${conditionId}/parameters`, payload);
  }

  remove(effectId: number, conditionId: number, id: number): Observable<unknown> {
    return super.delete(`/effects/${effectId}/conditions/${conditionId}/parameters/${id}`);
  }
}

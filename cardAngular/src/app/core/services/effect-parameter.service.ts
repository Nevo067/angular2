import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { EffectParameterValueDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class EffectParameterService extends BaseApiService {

  list(effectId: number, actionId: number): Observable<EffectParameterValueDTO[]> {
    return this.get<EffectParameterValueDTO[]>(`/api/effects/${effectId}/actions/${actionId}/parameters`);
  }

  listAll(effectId: number): Observable<EffectParameterValueDTO[]> {
    return this.get<EffectParameterValueDTO[]>(`/api/effects/${effectId}/parameters`);
  }

  upsert(effectId: number, actionId: number, payload: EffectParameterValueDTO): Observable<EffectParameterValueDTO> {
    return this.post<EffectParameterValueDTO>(`/api/effects/${effectId}/actions/${actionId}/parameters`, payload);
  }

  remove(effectId: number, actionId: number, id: number): Observable<any> {
    return super.delete(`/api/effects/${effectId}/actions/${actionId}/parameters/${id}`);
  }
}


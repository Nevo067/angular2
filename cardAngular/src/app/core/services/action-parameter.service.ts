import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ActionParameterValueDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ActionParameterService extends BaseApiService {

  list(actionId: number): Observable<ActionParameterValueDTO[]> {
    return this.get<ActionParameterValueDTO[]>(`/actions/${actionId}/parameters`);
  }

  upsert(actionId: number, payload: ActionParameterValueDTO): Observable<ActionParameterValueDTO> {
    return this.post<ActionParameterValueDTO>(`/actions/${actionId}/parameters`, payload);
  }

  remove(actionId: number, id: number): Observable<any> {
    return super.delete(`/actions/${actionId}/parameters/${id}`);
  }
}



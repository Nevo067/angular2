import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ActionParameterValueDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ActionParameterService extends BaseApiService {

  list(actionId: number): Observable<ActionParameterValueDTO[]> {
    return this.get<ActionParameterValueDTO[]>(`/api/actions/${actionId}/parameters`);
  }

  upsert(actionId: number, payload: ActionParameterValueDTO): Observable<ActionParameterValueDTO> {
    return this.post<ActionParameterValueDTO>(`/api/actions/${actionId}/parameters`, payload);
  }

  delete(actionId: number, id: number): Observable<any> {
    return this.delete<any>(`/api/actions/${actionId}/parameters/${id}`);
  }
}



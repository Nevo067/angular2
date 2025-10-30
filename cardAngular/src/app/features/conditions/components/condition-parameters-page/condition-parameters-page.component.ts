import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConditionParameterService, ParameterDefinitionService } from '../../../../core/services';
import { ConditionParameterValueDTO, ParameterDefinitionDTO } from '../../../../core/models';

@Component({
  selector: 'app-condition-parameters-page',
  templateUrl: './condition-parameters-page.component.html',
  styleUrls: ['./condition-parameters-page.component.css']
})
export class ConditionParametersPageComponent implements OnInit {
  conditionId!: number;
  definitions: ParameterDefinitionDTO[] = [];
  values: ConditionParameterValueDTO[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private defs: ParameterDefinitionService,
    private svc: ConditionParameterService
  ) {}

  ngOnInit(): void {
    this.conditionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.defs.listDefinitions().subscribe(defs => {
      this.definitions = defs;
      this.svc.list(this.conditionId).subscribe(vals => {
        this.values = vals;
        this.loading = false;
      });
    });
  }

  onSave(payload: ConditionParameterValueDTO[]): void {
    const tasks = payload.map(p => this.svc.upsert(this.conditionId, p));
    let done = 0;
    tasks.forEach(obs => obs.subscribe(() => {
      done++;
      if (done === tasks.length) {
        this.load();
      }
    }));
  }
}



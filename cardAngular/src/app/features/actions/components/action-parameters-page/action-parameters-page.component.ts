import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActionParameterService, ParameterDefinitionService } from '../../../../core/services';
import { ActionParameterValueDTO, ParameterDefinitionDTO } from '../../../../core/models';

@Component({
  selector: 'app-action-parameters-page',
  templateUrl: './action-parameters-page.component.html',
  styleUrls: ['./action-parameters-page.component.css']
})
export class ActionParametersPageComponent implements OnInit {
  actionId!: number;
  definitions: ParameterDefinitionDTO[] = [];
  values: ActionParameterValueDTO[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private defs: ParameterDefinitionService,
    private svc: ActionParameterService
  ) {}

  ngOnInit(): void {
    this.actionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.defs.listDefinitions().subscribe(defs => {
      this.definitions = defs;
      this.svc.list(this.actionId).subscribe(vals => {
        this.values = vals;
        this.loading = false;
      });
    });
  }

  onSave(payload: ActionParameterValueDTO[]): void {
    // envoyer chaque valeur (upsert)
    const tasks = payload.map(p => this.svc.upsert(this.actionId, p));
    let done = 0;
    tasks.forEach(obs => obs.subscribe(() => {
      done++;
      if (done === tasks.length) {
        this.load();
      }
    }));
  }
}



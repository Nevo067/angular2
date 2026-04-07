import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConditionParameterService, ParameterDefinitionService } from '../../../../core/services';
import { ConditionParameterValueDTO, ParameterDefinitionDTO, ActionParameterValueDTO, EffectParameterValueDTO } from '../../../../core/models';
import { ParameterEditorComponent } from '../../../../shared/components/parameter-editor/parameter-editor.component';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';

@Component({
  selector: 'app-condition-parameters-page',
  templateUrl: './condition-parameters-page.component.html',
  styleUrls: ['./condition-parameters-page.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ParameterEditorComponent, MatSnackBarModule]
})
export class ConditionParametersPageComponent implements OnInit {
  effectId!: number;
  conditionId!: number;
  definitions: ParameterDefinitionDTO[] = [];
  values: ConditionParameterValueDTO[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private defs: ParameterDefinitionService,
    private svc: ConditionParameterService,
    private ui: UiFeedbackService
  ) {}

  ngOnInit(): void {
    this.effectId = Number(this.route.snapshot.paramMap.get('effectId'));
    this.conditionId = Number(this.route.snapshot.paramMap.get('conditionId'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.defs.listDefinitions().subscribe(defs => {
      this.definitions = defs;
      this.svc.list(this.effectId, this.conditionId).subscribe({
        next: vals => {
          this.values = vals;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.ui.showError('Impossible de charger les paramètres (liaison effet/condition introuvable ?)', 5000);
        }
      });
    });
  }

  onSave(payload: (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[]): void {
    const conditionParams = payload.filter((p): p is ConditionParameterValueDTO => {
      return !('effectId' in p) && !('actionId' in p);
    }) as ConditionParameterValueDTO[];

    const tasks = conditionParams.map(p => this.svc.upsert(this.effectId, this.conditionId, p));
    let done = 0;
    let errors = 0;

    tasks.forEach(obs => obs.subscribe({
      next: () => {
        done++;
        if (done + errors === tasks.length) {
          this.load();
          if (errors === 0) {
            this.ui.showSuccess('✓ Paramètres enregistrés avec succès');
          } else {
            this.ui.showWarning(`⚠ ${done} paramètre(s) enregistré(s), ${errors} erreur(s)`);
          }
        }
      },
      error: (error) => {
        errors++;
        console.error('Erreur lors de l\'enregistrement:', error);
        if (done + errors === tasks.length) {
          this.load();
          this.ui.showError('✕ Erreur lors de l\'enregistrement des paramètres');
        }
      }
    }));
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConditionParameterService, EffectParameterService, ParameterDefinitionService, EffectService } from '../../../../core/services';
import {
  EffectParameterValueDTO,
  ParameterDefinitionDTO,
  ActionParameterValueDTO,
  ConditionParameterValueDTO,
  Effect,
  ActionCard,
  EffectCondition
} from '../../../../core/models';
import { ParameterEditorComponent } from '../../../../shared/components/parameter-editor/parameter-editor.component';
import { ParameterDefinitionEditDialogComponent } from '../../../parameters/components/parameter-definition-edit-dialog/parameter-definition-edit-dialog.component';

@Component({
  selector: 'app-effect-parameters-page',
  templateUrl: './effect-parameters-page.component.html',
  styleUrls: ['./effect-parameters-page.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ParameterEditorComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule
  ]
})
export class EffectParametersPageComponent implements OnInit {
  effectId!: number;
  effect: Effect | null = null;
  definitions: ParameterDefinitionDTO[] = [];
  actionParameters: Map<number, EffectParameterValueDTO[]> = new Map();
  conditionParameters: Map<number, ConditionParameterValueDTO[]> = new Map();
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private effectService: EffectService,
    private defs: ParameterDefinitionService,
    private conditionParameterService: ConditionParameterService,
    private svc: EffectParameterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.effectId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;

    forkJoin({
      effect: this.effectService.getEffectComplete(this.effectId),
      definitions: this.defs.listDefinitions(),
      allParameters: this.svc.listAll(this.effectId)
    }).subscribe({
      next: ({ effect, definitions, allParameters }) => {
        this.effect = effect;
        this.definitions = definitions;

        this.actionParameters.clear();
        allParameters.forEach(param => {
          const actionId = param.actionId;
          if (!this.actionParameters.has(actionId)) {
            this.actionParameters.set(actionId, []);
          }
          this.actionParameters.get(actionId)!.push(param);
        });

        const conds = this.getConditions();
        if (conds.length === 0) {
          this.conditionParameters.clear();
          this.loading = false;
          return;
        }

        forkJoin(
          conds.map(c =>
            this.conditionParameterService.list(this.effectId, c.conditionId).pipe(
              catchError(() => of([] as ConditionParameterValueDTO[])),
              map(params => ({ cid: c.conditionId, params }))
            )
          )
        ).subscribe({
          next: rows => {
            this.conditionParameters.clear();
            rows.forEach(r => this.conditionParameters.set(r.cid, r.params));
            this.loading = false;
          },
          error: () => {
            this.conditionParameters.clear();
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.snackBar.open('✕ Erreur lors du chargement des données', 'Fermer', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  getActions(): ActionCard[] {
    return this.effect?.actions || [];
  }

  getConditions(): EffectCondition[] {
    const e = this.effect;
    if (!e) {
      return [];
    }
    if (e.conditions?.length) {
      return e.conditions;
    }
    return (e.conditionCards || []).map(c => ({
      conditionId: c.id,
      nameCondition: c.nameCondition,
      description: c.description
    }));
  }

  getActionParameters(actionId: number): EffectParameterValueDTO[] {
    return this.actionParameters.get(actionId) || [];
  }

  getConditionParameters(conditionId: number): ConditionParameterValueDTO[] {
    return this.conditionParameters.get(conditionId) || [];
  }

  onSaveCondition(conditionId: number, payload: (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[]): void {
    const conditionParams = payload.filter((p): p is ConditionParameterValueDTO => {
      return !('effectId' in p) && !('actionId' in p);
    }) as ConditionParameterValueDTO[];

    if (conditionParams.length === 0) {
      return;
    }

    const tasks = conditionParams.map(p => this.conditionParameterService.upsert(this.effectId, conditionId, p));
    let done = 0;
    let errors = 0;

    tasks.forEach(obs => obs.subscribe({
      next: () => {
        done++;
        if (done + errors === tasks.length) {
          this.conditionParameterService.list(this.effectId, conditionId).subscribe({
            next: params => this.conditionParameters.set(conditionId, params)
          });
          if (errors === 0) {
            this.snackBar.open('✓ Paramètres de condition enregistrés', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
          }
        }
      },
      error: () => {
        errors++;
        if (done + errors === tasks.length) {
          this.snackBar.open('✕ Erreur enregistrement paramètres condition', 'Fermer', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      }
    }));
  }

  openConditionParametersPage(conditionId: number): void {
    this.router.navigate(['/effects', this.effectId, 'conditions', conditionId, 'parameters']);
  }

  onSave(actionId: number, payload: (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[]): void {
    // Filtrer uniquement les EffectParameterValueDTO
    const effectParams = payload.filter((p): p is EffectParameterValueDTO => {
      return 'effectId' in p && 'actionId' in p;
    }) as EffectParameterValueDTO[];
    
    if (effectParams.length === 0) {
      console.log('Aucun paramètre à sauvegarder');
      return;
    }
    
    // Envoyer chaque valeur (upsert)
    const tasks = effectParams.map(p => this.svc.upsert(this.effectId, actionId, p));
    let done = 0;
    let errors = 0;
    
    tasks.forEach(obs => obs.subscribe({
      next: () => {
        done++;
        if (done + errors === tasks.length) {
          // Recharger les paramètres pour cette action
          this.svc.list(this.effectId, actionId).subscribe({
            next: (params) => {
              this.actionParameters.set(actionId, params);
            }
          });
          
          if (errors === 0) {
            this.snackBar.open('✓ Paramètres enregistrés avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open(`⚠ ${done} paramètre(s) enregistré(s), ${errors} erreur(s)`, 'Fermer', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            });
          }
        }
      },
      error: (error) => {
        errors++;
        console.error('Erreur lors de l\'enregistrement:', error);
        if (done + errors === tasks.length) {
          // Recharger les paramètres même en cas d'erreur
          this.svc.list(this.effectId, actionId).subscribe({
            next: (params) => {
              this.actionParameters.set(actionId, params);
            }
          });
          
          this.snackBar.open('✕ Erreur lors de l\'enregistrement des paramètres', 'Fermer', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      }
    }));
  }

  openNewDefinitionDialog(): void {
    const dialogRef = this.dialog.open(ParameterDefinitionEditDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { definition: undefined },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveNewDefinition(result);
      }
    });
  }

  private saveNewDefinition(data: any): void {
    this.defs.createDefinition(data).subscribe({
      next: () => {
        console.log('Définition créée avec succès');
        this.load(); // Recharger les définitions et valeurs
      },
      error: (error: any) => {
        console.error('Erreur lors de la création:', error);
        this.snackBar.open('Erreur lors de la création de la définition: ' + (error.message || 'Erreur inconnue'), 'Fermer', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}




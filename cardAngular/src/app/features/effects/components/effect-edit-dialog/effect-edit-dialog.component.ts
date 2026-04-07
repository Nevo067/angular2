import { Component, Inject, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Effect, ConditionCard, ActionCard, EffectParameterValueDTO, ParameterDefinitionDTO, ActionParameterValueDTO, ConditionParameterValueDTO } from '../../../../core/models';
import { ActionParameterService, ConditionCardService, ActionCardService, EffectParameterService, ParameterDefinitionService } from '../../../../core/services';
import { ParameterEditorComponent } from '../../../../shared/components/parameter-editor/parameter-editor.component';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';

@Component({
  selector: 'app-effect-edit-dialog',
  templateUrl: './effect-edit-dialog.component.html',
  styleUrls: ['./effect-edit-dialog.component.css'],
  standalone: false
})
export class EffectEditDialogComponent implements OnInit {
  effectForm!: FormGroup;
  isEditMode: boolean;
  availableConditions: ConditionCard[] = [];
  availableActions: ActionCard[] = [];
  parameterDefinitions: ParameterDefinitionDTO[] = [];
  actionParameters: Map<number, EffectParameterValueDTO[]> = new Map();
  /** Codes ParameterDefinition déclarés sur chaque carte action (filtre éditeur effet). */
  actionCatalogCodes: Map<number, Set<string>> = new Map();
  expandedActions: Set<number> = new Set();
  /** True pendant la sauvegarde des paramètres d’effet (évite double clic et indique l’attente). */
  saving = false;
  @ViewChildren(ParameterEditorComponent) parameterEditors!: QueryList<ParameterEditorComponent>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EffectEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { effect?: Effect },
    private conditionCardService: ConditionCardService,
    private actionCardService: ActionCardService,
    private actionParameterService: ActionParameterService,
    private effectParameterService: EffectParameterService,
    private parameterDefinitionService: ParameterDefinitionService,
    private router: Router,
    private ui: UiFeedbackService
  ) {
    this.isEditMode = !!data.effect;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAvailableData();
    this.loadParameterDefinitions();
    if (this.isEditMode) {
      this.loadEffectData();
      this.preloadAllParameters();
    }
  }

  private initializeForm(): void {
    this.effectForm = this.fb.group({
      id: [null],
      effectName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]],
      selectedConditions: this.fb.array([]),
      selectedActions: this.fb.array([])
    });
  }

  private loadAvailableData(): void {
    // Charger les conditions disponibles
    this.conditionCardService.getAllConditions().subscribe({
      next: (conditions) => {
        console.log('📋 Conditions disponibles chargées:', conditions);
        this.availableConditions = conditions;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des conditions:', error);
      }
    });

    // Charger les actions disponibles
    this.actionCardService.getAllActions().subscribe({
      next: (actions) => {
        this.availableActions = actions;
        console.log('📋 Actions disponibles chargées:', actions);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des actions:', error);
      }
    });
  }

  private loadEffectData(): void {
    if (this.data.effect) {
      this.effectForm.patchValue({
        id: this.data.effect.id,
        effectName: this.data.effect.effectName,
        description: this.data.effect.description
      });

      // Charger les conditions associées
      const conditionsArray = this.effectForm.get('selectedConditions') as FormArray;
      conditionsArray.clear();
      const conds = this.data.effect.conditions?.length
        ? this.data.effect.conditions.map(c => c.conditionId)
        : (this.data.effect.conditionCards || []).map(c => c.id);
      conds.forEach(cid => {
        conditionsArray.push(this.fb.control(cid));
      });

      // Charger les actions associées
      const actionsArray = this.effectForm.get('selectedActions') as FormArray;
      actionsArray.clear();
      if (this.data.effect.actions) {
        this.data.effect.actions.forEach(action => {
          actionsArray.push(this.fb.control(action.id));
        });
        // Les paramètres seront chargés uniquement quand l'utilisateur clique sur expand
      }
    }
  }

  private loadParameterDefinitions(): void {
    this.parameterDefinitionService.listDefinitions().subscribe({
      next: (defs) => {
        this.parameterDefinitions = defs;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des définitions de paramètres:', error);
      }
    });
  }

  private preloadAllParameters(): void {
    if (!this.data.effect?.id) return;

    const effectId = this.data.effect.id;
    const actions = this.data.effect.actions || [];

    if (actions.length === 0) return;

    forkJoin(
      actions.map(action =>
        forkJoin({
          values: this.effectParameterService.list(effectId, action.id).pipe(catchError(() => of([] as EffectParameterValueDTO[]))),
          catalog: this.actionParameterService.list(action.id).pipe(catchError(() => of([] as ActionParameterValueDTO[])))
        }).pipe(
          map(({ values, catalog }) => ({
            actionId: action.id,
            values,
            codes: new Set(catalog.map(c => c.parameterDefinitionCode).filter((x): x is string => !!x))
          }))
        )
      )
    ).subscribe({
      next: rows => {
        rows.forEach(r => {
          this.actionParameters.set(r.actionId, r.values);
          this.actionCatalogCodes.set(r.actionId, r.codes);
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du préchargement des paramètres:', error);
      }
    });
  }

  getActionParameters(actionId: number): EffectParameterValueDTO[] {
    return this.actionParameters.get(actionId) || [];
  }

  getDefinitionsForAction(actionId: number): ParameterDefinitionDTO[] {
    const codes = this.actionCatalogCodes.get(actionId);
    if (!codes || codes.size === 0) {
      return [];
    }
    return this.parameterDefinitions.filter(d => codes.has(d.code));
  }

  actionHasDeclaredParameters(actionId: number): boolean {
    const codes = this.actionCatalogCodes.get(actionId);
    return !!codes && codes.size > 0;
  }

  toggleActionParameters(actionId: number): void {
    if (this.expandedActions.has(actionId)) {
      this.expandedActions.delete(actionId);
    } else {
      this.expandedActions.add(actionId);
      // Charger les paramètres si pas encore chargés
      if (!this.actionParameters.has(actionId) && this.data.effect?.id) {
        const effectId = this.data.effect.id;
        forkJoin({
          values: this.effectParameterService.list(effectId, actionId).pipe(catchError(() => of([] as EffectParameterValueDTO[]))),
          catalog: this.actionParameterService.list(actionId).pipe(catchError(() => of([] as ActionParameterValueDTO[])))
        }).subscribe({
          next: ({ values, catalog }) => {
            this.actionParameters.set(actionId, values);
            this.actionCatalogCodes.set(
              actionId,
              new Set(catalog.map(c => c.parameterDefinitionCode).filter((x): x is string => !!x))
            );
          },
          error: (error) => {
            console.error(`❌ Erreur lors du chargement des paramètres:`, error);
            this.actionParameters.set(actionId, []);
            this.actionCatalogCodes.set(actionId, new Set());
          }
        });
      }
    }
  }

  isActionParametersExpanded(actionId: number): boolean {
    return this.expandedActions.has(actionId);
  }

  onSaveActionParameters(actionId: number, payload: (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[]): void {
    if (!this.data.effect?.id) return;

    // Filtrer et caster uniquement les EffectParameterValueDTO
    const effectParams = payload.filter((p): p is EffectParameterValueDTO => {
      return 'effectId' in p && 'actionId' in p;
    }) as EffectParameterValueDTO[];

    const effectId = this.data.effect.id;
    const tasks = effectParams.map(p => firstValueFrom(this.effectParameterService.upsert(effectId, actionId, p)));

    Promise.all(tasks).then(() => {
      // Recharger les paramètres
      this.effectParameterService.list(effectId, actionId).subscribe({
        next: (params) => {
          this.actionParameters.set(actionId, params);
        }
      });
    }).catch(error => {
      console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
    });
  }

  onSave(): void {
    if (this.effectForm.invalid) {
      this.markFormGroupTouched();
      this.ui.showError('Remplissez le nom (2 caractères minimum) et la description avant d’enregistrer.', 5000);
      return;
    }
    if (this.saving) {
      return;
    }

    const formValue = this.effectForm.getRawValue();

    if (this.isEditMode && this.data.effect?.id) {
      this.saving = true;
      this.saveAllParameters()
        .then(() => {
          this.dialogRef.close(formValue);
        })
        .catch(() => {
          this.ui.showWarning(
            'Certains paramètres d’effet n’ont pas pu être enregistrés. Les conditions et actions sont tout de même enregistrées.',
            8000
          );
          this.dialogRef.close(formValue);
        })
        .finally(() => {
          this.saving = false;
        });
    } else {
      this.dialogRef.close(formValue);
    }
  }

  // Nouvelle méthode pour sauvegarder tous les paramètres
  private async saveAllParameters(): Promise<void> {
    if (!this.data.effect?.id) return;

    const effectId = this.data.effect.id;
    const selectedActions = this.getSelectedActions();
    const promises: Promise<void>[] = [];

    // Récupérer les valeurs actuelles depuis les parameter-editors (même si non sauvegardées)
    this.parameterEditors.forEach(editor => {
      if (editor.ownerType === 'effect' && editor.effectId === effectId && editor.actionId) {
        const currentValues = editor.getCurrentValues();
        const effectParams = currentValues.filter((p): p is EffectParameterValueDTO => {
          return 'effectId' in p && 'actionId' in p;
        }) as EffectParameterValueDTO[];

        // Sauvegarder chaque paramètre
        effectParams.forEach(param => {
          const promise = firstValueFrom(
            this.effectParameterService.upsert(effectId, editor.actionId!, param)
          ).then(() => {
            console.log(`✅ Paramètre sauvegardé pour l'action ${editor.actionId} (${param.parameterDefinitionCode})`);
          }).catch(error => {
            console.error(`❌ Erreur lors de la sauvegarde du paramètre ${param.parameterDefinitionCode} pour l'action ${editor.actionId}:`, error);
            throw error;
          });
          promises.push(promise);
        });
      }
    });

    // Attendre que tous les paramètres soient sauvegardés
    if (promises.length > 0) {
      await Promise.all(promises);
      console.log('✅ Tous les paramètres ont été sauvegardés');
    } else {
      console.log('ℹ️ Aucun paramètre à sauvegarder');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    const mark = (control: AbstractControl): void => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        Object.values(control.controls).forEach(mark);
      } else if (control instanceof FormArray) {
        control.controls.forEach(mark);
      }
    };
    mark(this.effectForm);
  }

  // Méthodes pour la validation des erreurs
  hasError(controlName: string, errorType: string): boolean {
    const control = this.effectForm.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.effectForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    return '';
  }

  // Gestion des conditions
  get selectedConditionsArray(): FormArray {
    return this.effectForm.get('selectedConditions') as FormArray;
  }

  toggleCondition(conditionId: number): void {
    const conditionsArray = this.selectedConditionsArray;
    const existingIndex = conditionsArray.controls.findIndex(control => control.value === conditionId);

    console.log('🔄 Toggle condition:', conditionId, 'Index existant:', existingIndex);

    if (existingIndex >= 0) {
      conditionsArray.removeAt(existingIndex);
      console.log('➖ Condition supprimée, nouvelles conditions:', conditionsArray.value);
    } else {
      // Ajouter à la fin pour maintenir l'ordre de sélection
      conditionsArray.push(this.fb.control(conditionId));
      console.log('➕ Condition ajoutée, nouvelles conditions:', conditionsArray.value);
    }
  }

  isConditionSelected(conditionId: number): boolean {
    const isSelected = this.selectedConditionsArray.controls.some(control => control.value === conditionId);
    console.log('🔍 Condition', conditionId, 'sélectionnée:', isSelected);
    return isSelected;
  }

  // Gestion des actions
  get selectedActionsArray(): FormArray {
    return this.effectForm.get('selectedActions') as FormArray;
  }

  toggleAction(actionId: number): void {
    const actionsArray = this.selectedActionsArray;
    const existingIndex = actionsArray.controls.findIndex(control => control.value === actionId);

    console.log('🔄 Toggle action:', actionId, 'Index existant:', existingIndex);

    if (existingIndex >= 0) {
      actionsArray.removeAt(existingIndex);
      console.log('➖ Action supprimée, nouvelles actions:', actionsArray.value);
    } else {
      // Ajouter à la fin pour maintenir l'ordre de sélection
      actionsArray.push(this.fb.control(actionId));
      console.log('➕ Action ajoutée, nouvelles actions:', actionsArray.value);
    }
  }

  isActionSelected(actionId: number): boolean {
    const isSelected = this.selectedActionsArray.controls.some(control => control.value === actionId);
    console.log('🔍 Action', actionId, 'sélectionnée:', isSelected);
    return isSelected;
  }

  /**
   * Ordre identique au FormArray (selectedConditions). Ne pas utiliser filter() seul sur
   * available* : l’ordre du catalogue ne suit pas l’ordre de sélection, ce qui cassait
   * remove/move par index dans le *ngFor.
   */
  getSelectedConditions(): ConditionCard[] {
    const selectedIds = this.selectedConditionsArray.controls.map(control => control.value);
    const byId = new Map(this.availableConditions.map(c => [c.id, c]));
    return selectedIds.map(id => byId.get(id)).filter((c): c is ConditionCard => c != null);
  }

  getSelectedActions(): ActionCard[] {
    const selectedIds = this.selectedActionsArray.controls.map(control => control.value);
    const byId = new Map(this.availableActions.map(a => [a.id, a]));
    return selectedIds.map(id => byId.get(id)).filter((a): a is ActionCard => a != null);
  }

  // Méthodes pour réorganiser l'ordre
  moveConditionUp(conditionId: number): void {
    const conditionsArray = this.selectedConditionsArray;
    const index = conditionsArray.controls.findIndex(c => c.value === conditionId);
    if (index > 0) {
      const condition = conditionsArray.at(index);
      conditionsArray.removeAt(index);
      conditionsArray.insert(index - 1, condition);
    }
  }

  moveConditionDown(conditionId: number): void {
    const conditionsArray = this.selectedConditionsArray;
    const index = conditionsArray.controls.findIndex(c => c.value === conditionId);
    if (index >= 0 && index < conditionsArray.length - 1) {
      const condition = conditionsArray.at(index);
      conditionsArray.removeAt(index);
      conditionsArray.insert(index + 1, condition);
    }
  }

  moveActionUp(actionId: number): void {
    const actionsArray = this.selectedActionsArray;
    const index = actionsArray.controls.findIndex(c => c.value === actionId);
    if (index > 0) {
      const action = actionsArray.at(index);
      actionsArray.removeAt(index);
      actionsArray.insert(index - 1, action);
    }
  }

  moveActionDown(actionId: number): void {
    const actionsArray = this.selectedActionsArray;
    const index = actionsArray.controls.findIndex(c => c.value === actionId);
    if (index >= 0 && index < actionsArray.length - 1) {
      const action = actionsArray.at(index);
      actionsArray.removeAt(index);
      actionsArray.insert(index + 1, action);
    }
  }

  removeCondition(conditionId: number): void {
    const arr = this.selectedConditionsArray;
    const idx = arr.controls.findIndex(c => c.value === conditionId);
    if (idx >= 0) {
      arr.removeAt(idx);
    }
  }

  removeAction(actionId: number): void {
    const arr = this.selectedActionsArray;
    const idx = arr.controls.findIndex(c => c.value === actionId);
    if (idx >= 0) {
      arr.removeAt(idx);
    }
    this.expandedActions.delete(actionId);
    this.actionParameters.delete(actionId);
    this.actionCatalogCodes.delete(actionId);
  }

  canMoveConditionUp(conditionId: number): boolean {
    const idx = this.selectedConditionsArray.controls.findIndex(c => c.value === conditionId);
    return idx > 0;
  }

  canMoveConditionDown(conditionId: number): boolean {
    const arr = this.selectedConditionsArray;
    const idx = arr.controls.findIndex(c => c.value === conditionId);
    return idx >= 0 && idx < arr.length - 1;
  }

  canMoveActionUp(actionId: number): boolean {
    const idx = this.selectedActionsArray.controls.findIndex(c => c.value === actionId);
    return idx > 0;
  }

  canMoveActionDown(actionId: number): boolean {
    const arr = this.selectedActionsArray;
    const idx = arr.controls.findIndex(c => c.value === actionId);
    return idx >= 0 && idx < arr.length - 1;
  }

  // Obtenir l'ordre de sélection
  getConditionSelectionOrder(conditionId: number): number {
    const conditionsArray = this.selectedConditionsArray;
    const index = conditionsArray.controls.findIndex(control => control.value === conditionId);
    return index >= 0 ? index + 1 : 0;
  }

  getActionSelectionOrder(actionId: number): number {
    const actionsArray = this.selectedActionsArray;
    const index = actionsArray.controls.findIndex(control => control.value === actionId);
    return index >= 0 ? index + 1 : 0;
  }

  openParametersPage(): void {
    if (this.data.effect?.id) {
      // Fermer le dialogue et naviguer vers la page de paramètres
      this.dialogRef.close();
      this.router.navigate(['/effects', this.data.effect.id, 'parameters']);
    }
  }
}

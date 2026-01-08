import { Component, Inject, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Effect, ConditionCard, ActionCard, EffectParameterValueDTO, ParameterDefinitionDTO, ActionParameterValueDTO, ConditionParameterValueDTO } from '../../../../core/models';
import { ConditionCardService, ActionCardService, EffectParameterService, ParameterDefinitionService } from '../../../../core/services';
import { ParameterEditorComponent } from '../../../../shared/components/parameter-editor/parameter-editor.component';

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
  expandedActions: Set<number> = new Set();
  @ViewChildren(ParameterEditorComponent) parameterEditors!: QueryList<ParameterEditorComponent>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EffectEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { effect?: Effect },
    private conditionCardService: ConditionCardService,
    private actionCardService: ActionCardService,
    private effectParameterService: EffectParameterService,
    private parameterDefinitionService: ParameterDefinitionService,
    private router: Router
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
      if (this.data.effect.conditionCards) {
        this.data.effect.conditionCards.forEach(condition => {
          conditionsArray.push(this.fb.control(condition.id));
        });
      }

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

    // Charger tous les paramètres pour toutes les actions en parallèle
    const loadTasks = actions.map(action =>
      this.effectParameterService.list(effectId, action.id)
    );

    // Utiliser forkJoin pour charger tous les paramètres en parallèle
    forkJoin(loadTasks).subscribe({
      next: (results) => {
        results.forEach((params, index) => {
          const actionId = actions[index].id;
          this.actionParameters.set(actionId, params);
        });
        console.log('✅ Tous les paramètres préchargés:', this.actionParameters);
      },
      error: (error) => {
        console.error('❌ Erreur lors du préchargement des paramètres:', error);
      }
    });
  }

  getActionParameters(actionId: number): EffectParameterValueDTO[] {
    return this.actionParameters.get(actionId) || [];
  }

  toggleActionParameters(actionId: number): void {
    if (this.expandedActions.has(actionId)) {
      this.expandedActions.delete(actionId);
    } else {
      this.expandedActions.add(actionId);
      // Charger les paramètres si pas encore chargés
      if (!this.actionParameters.has(actionId) && this.data.effect?.id) {
        this.effectParameterService.list(this.data.effect.id, actionId).subscribe({
          next: (params) => {
            this.actionParameters.set(actionId, params);
          },
          error: (error) => {
            console.error(`❌ Erreur lors du chargement des paramètres:`, error);
            this.actionParameters.set(actionId, []);
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
    if (this.effectForm.valid) {
      const formValue = this.effectForm.value;
      console.log('💾 Sauvegarde de l\'effet:', formValue);
      console.log('📋 Actions sélectionnées:', formValue.selectedActions);
      console.log('📋 Conditions sélectionnées:', formValue.selectedConditions);

      // Sauvegarder tous les paramètres modifiés avant de fermer
      if (this.isEditMode && this.data.effect?.id) {
        this.saveAllParameters().then(() => {
          console.log('✅ Tous les paramètres sauvegardés, fermeture du dialog');
          this.dialogRef.close(formValue);
        }).catch(error => {
          console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
          // Demander confirmation pour continuer quand même
          if (confirm('Erreur lors de la sauvegarde des paramètres. Voulez-vous continuer quand même ?')) {
            this.dialogRef.close(formValue);
          }
        });
      } else {
        // Pas en mode édition ou pas d'effet, fermer directement
        this.dialogRef.close(formValue);
      }
    } else {
      console.log('❌ Formulaire invalide:', this.effectForm.errors);
      this.markFormGroupTouched();
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
    Object.keys(this.effectForm.controls).forEach(key => {
      const control = this.effectForm.get(key);
      control?.markAsTouched();
    });
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

  getSelectedConditions(): ConditionCard[] {
    const selectedIds = this.selectedConditionsArray.controls.map(control => control.value);
    return this.availableConditions.filter(condition => selectedIds.includes(condition.id));
  }

  getSelectedActions(): ActionCard[] {
    const selectedIds = this.selectedActionsArray.controls.map(control => control.value);
    return this.availableActions.filter(action => selectedIds.includes(action.id));
  }

  // Méthodes pour réorganiser l'ordre
  moveConditionUp(index: number): void {
    if (index > 0) {
      const conditionsArray = this.selectedConditionsArray;
      const condition = conditionsArray.at(index);
      conditionsArray.removeAt(index);
      conditionsArray.insert(index - 1, condition);
    }
  }

  moveConditionDown(index: number): void {
    const conditionsArray = this.selectedConditionsArray;
    if (index < conditionsArray.length - 1) {
      const condition = conditionsArray.at(index);
      conditionsArray.removeAt(index);
      conditionsArray.insert(index + 1, condition);
    }
  }

  moveActionUp(index: number): void {
    if (index > 0) {
      const actionsArray = this.selectedActionsArray;
      const action = actionsArray.at(index);
      actionsArray.removeAt(index);
      actionsArray.insert(index - 1, action);
    }
  }

  moveActionDown(index: number): void {
    const actionsArray = this.selectedActionsArray;
    if (index < actionsArray.length - 1) {
      const action = actionsArray.at(index);
      actionsArray.removeAt(index);
      actionsArray.insert(index + 1, action);
    }
  }

  removeCondition(index: number): void {
    this.selectedConditionsArray.removeAt(index);
  }

  removeAction(index: number): void {
    this.selectedActionsArray.removeAt(index);
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

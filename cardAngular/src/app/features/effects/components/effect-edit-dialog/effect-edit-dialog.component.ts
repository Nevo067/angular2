import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Effect, ConditionCard, ActionCard } from '../../../../core/models';
import { ConditionCardService, ActionCardService } from '../../../../core/services';

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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EffectEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { effect?: Effect },
    private conditionCardService: ConditionCardService,
    private actionCardService: ActionCardService
  ) {
    this.isEditMode = !!data.effect;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAvailableData();
    if (this.isEditMode) {
      this.loadEffectData();
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
      }
    }
  }

  onSave(): void {
    if (this.effectForm.valid) {
      const formValue = this.effectForm.value;
      console.log('💾 Sauvegarde de l\'effet:', formValue);
      console.log('📋 Actions sélectionnées:', formValue.selectedActions);
      console.log('📋 Conditions sélectionnées:', formValue.selectedConditions);
      this.dialogRef.close(formValue);
    } else {
      console.log('❌ Formulaire invalide:', this.effectForm.errors);
      this.markFormGroupTouched();
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
}

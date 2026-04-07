import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConditionCard, ActionCard } from '../../../../core/models';
import { ActionCardService } from '../../../../core/services';

@Component({
  selector: 'app-condition-edit-dialog',
  templateUrl: './condition-edit-dialog.component.html',
  styleUrls: ['./condition-edit-dialog.component.css'],
  standalone: false
})
export class ConditionEditDialogComponent implements OnInit {
  conditionForm!: FormGroup;
  isEditMode: boolean;
  availableActions: ActionCard[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConditionEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { condition?: ConditionCard },
    private actionCardService: ActionCardService
  ) {
    this.isEditMode = !!data.condition;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAvailableActions();
    if (this.isEditMode) {
      this.loadConditionData();
    }
  }

  private initializeForm(): void {
    this.conditionForm = this.fb.group({
      id: [null],
      nameCondition: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]],
      selectedActions: this.fb.array([])
    });
  }

  private loadAvailableActions(): void {
    this.actionCardService.getAllActions().subscribe({
      next: (actions) => {
        this.availableActions = actions;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des actions:', error);
      }
    });
  }

  private loadConditionData(): void {
    if (this.data.condition) {
      this.conditionForm.patchValue({
        id: this.data.condition.id,
        nameCondition: this.data.condition.nameCondition,
        description: this.data.condition.description
      });

      // Charger les actions associées si elles existent
      const actionsArray = this.conditionForm.get('selectedActions') as FormArray;
      actionsArray.clear();
      if (this.data.condition.actions) {
        this.data.condition.actions.forEach(action => {
          actionsArray.push(this.fb.control(action.id));
        });
      }
    }
  }

  onSave(): void {
    if (this.conditionForm.valid) {
      const formValue = this.conditionForm.value;
      this.dialogRef.close(formValue);
    } else {
      this.markFormGroupTouched();
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
    mark(this.conditionForm);
  }

  // Méthodes pour la validation des erreurs
  hasError(controlName: string, errorType: string): boolean {
    const control = this.conditionForm.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.conditionForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    return '';
  }

  // Gestion des actions
  get selectedActionsArray(): FormArray {
    return this.conditionForm.get('selectedActions') as FormArray;
  }

  toggleAction(actionId: number): void {
    const actionsArray = this.selectedActionsArray;
    const existingIndex = actionsArray.controls.findIndex(control => control.value === actionId);

    if (existingIndex >= 0) {
      actionsArray.removeAt(existingIndex);
    } else {
      // Ajouter à la fin pour maintenir l'ordre de sélection
      actionsArray.push(this.fb.control(actionId));
    }
  }

  isActionSelected(actionId: number): boolean {
    return this.selectedActionsArray.controls.some(control => control.value === actionId);
  }

  /** Même ordre que le FormArray (évite le bug filter() sur availableActions). */
  getSelectedActions(): ActionCard[] {
    const selectedIds = this.selectedActionsArray.controls.map(control => control.value);
    const byId = new Map(this.availableActions.map(a => [a.id, a]));
    return selectedIds.map(id => byId.get(id)).filter((a): a is ActionCard => a != null);
  }

  moveActionUp(actionId: number): void {
    const actionsArray = this.selectedActionsArray;
    const index = actionsArray.controls.findIndex(c => c.value === actionId);
    if (index > 0) {
      const ctrl = actionsArray.at(index);
      actionsArray.removeAt(index);
      actionsArray.insert(index - 1, ctrl);
    }
  }

  moveActionDown(actionId: number): void {
    const actionsArray = this.selectedActionsArray;
    const index = actionsArray.controls.findIndex(c => c.value === actionId);
    if (index >= 0 && index < actionsArray.length - 1) {
      const ctrl = actionsArray.at(index);
      actionsArray.removeAt(index);
      actionsArray.insert(index + 1, ctrl);
    }
  }

  removeAction(actionId: number): void {
    const arr = this.selectedActionsArray;
    const idx = arr.controls.findIndex(c => c.value === actionId);
    if (idx >= 0) {
      arr.removeAt(idx);
    }
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
  getActionSelectionOrder(actionId: number): number {
    const actionsArray = this.selectedActionsArray;
    const index = actionsArray.controls.findIndex(control => control.value === actionId);
    return index >= 0 ? index + 1 : 0;
  }
}

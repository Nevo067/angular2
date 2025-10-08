import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionCard } from '../../../../core/models';

@Component({
  selector: 'app-action-edit-dialog',
  templateUrl: './action-edit-dialog.component.html',
  styleUrls: ['./action-edit-dialog.component.css'],
  standalone: false
})
export class ActionEditDialogComponent implements OnInit {
  actionForm!: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ActionEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { action?: ActionCard }
  ) {
    this.isEditMode = !!data.action;
  }

  ngOnInit(): void {
    this.initializeForm();
    if (this.isEditMode) {
      this.loadActionData();
    }
  }

  private initializeForm(): void {
    this.actionForm = this.fb.group({
      id: [null],
      actionName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]]
    });
  }

  private loadActionData(): void {
    if (this.data.action) {
      this.actionForm.patchValue(this.data.action);
    }
  }

  onSave(): void {
    if (this.actionForm.valid) {
      const formValue = this.actionForm.value;
      this.dialogRef.close(formValue);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.actionForm.controls).forEach(key => {
      const control = this.actionForm.get(key);
      control?.markAsTouched();
    });
  }

  // Méthodes pour la validation des erreurs
  hasError(controlName: string, errorType: string): boolean {
    const control = this.actionForm.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.actionForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    return '';
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParameterDefinitionDTO } from '../../../../core/models';
import { ParameterDefinitionService } from '../../../../core/services';

@Component({
  selector: 'app-parameter-definition-edit-dialog',
  templateUrl: './parameter-definition-edit-dialog.component.html',
  styleUrls: ['./parameter-definition-edit-dialog.component.css'],
  standalone: false
})
export class ParameterDefinitionEditDialogComponent implements OnInit {
  definitionForm!: FormGroup;
  isEditMode: boolean;
  options: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ParameterDefinitionEditDialogComponent>,
    private parameterService: ParameterDefinitionService,
    @Inject(MAT_DIALOG_DATA) public data: { definition?: ParameterDefinitionDTO }
  ) {
    this.isEditMode = !!data.definition;
  }

  ngOnInit(): void {
    this.initializeForm();
    if (this.isEditMode && this.data.definition) {
      this.loadDefinitionData();
    }
  }

  private initializeForm(): void {
    this.definitionForm = this.fb.group({
      id: [null],
      code: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Z_][A-Z0-9_]*$/)]],
      label: ['', [Validators.required, Validators.minLength(2)]],
      valueType: ['STRING', [Validators.required]],
      description: ['']
    });
  }

  private loadDefinitionData(): void {
    if (this.data.definition) {
      this.definitionForm.patchValue(this.data.definition);
      if (this.data.definition.valueType === 'ENUM') {
        this.loadOptions();
      }
    }
  }

  private loadOptions(): void {
    if (this.data.definition?.code) {
      this.parameterService.listEnumOptions(this.data.definition.code).subscribe({
        next: (opts) => {
          this.options = opts;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des options:', error);
        }
      });
    }
  }

  onValueTypeChange(): void {
    const valueType = this.definitionForm.get('valueType')?.value;
    if (valueType === 'ENUM' && this.isEditMode) {
      this.loadOptions();
    } else {
      this.options = [];
    }
  }

  onSave(): void {
    if (this.definitionForm.valid) {
      const formValue = this.definitionForm.value;
      this.dialogRef.close(formValue);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.definitionForm.controls).forEach(key => {
      const control = this.definitionForm.get(key);
      control?.markAsTouched();
    });
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.definitionForm.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.definitionForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    if (control?.hasError('pattern')) {
      return 'Format: MAJUSCULES, débute par une lettre (ex: PLAYER_LEVEL)';
    }
    return '';
  }

  get valueType(): string {
    return this.definitionForm.get('valueType')?.value || 'STRING';
  }

  get isEnum(): boolean {
    return this.valueType === 'ENUM';
  }
}


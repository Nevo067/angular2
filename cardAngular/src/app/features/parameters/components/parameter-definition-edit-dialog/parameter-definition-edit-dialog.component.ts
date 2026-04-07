import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { EnumOptionDTO, ParameterDefinitionDTO } from '../../../../core/models';
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
  options: EnumOptionDTO[] = [];
  optionsForm!: FormGroup;
  savingOptions = false;

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
    this.initializeOptionsForm();
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

  private initializeOptionsForm(): void {
    this.optionsForm = this.fb.group({
      items: this.fb.array([])
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
          this.options = opts || [];
          this.rebuildOptionsForm();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des options:', error);
        }
      });
    }
  }

  get optionItems(): FormArray {
    return this.optionsForm.get('items') as FormArray;
  }

  private rebuildOptionsForm(): void {
    while (this.optionItems.length) {
      this.optionItems.removeAt(0);
    }
    for (const opt of this.options) {
      this.optionItems.push(
        this.fb.group({
          id: [opt.id],
          code: [opt.code ?? '', [Validators.required]],
          label: [opt.label ?? '', [Validators.required]]
        })
      );
    }
  }

  addOptionRow(): void {
    this.optionItems.push(
      this.fb.group({
        id: [null],
        code: ['', [Validators.required]],
        label: ['', [Validators.required]]
      })
    );
  }

  saveOptionRow(index: number): void {
    if (!this.data.definition?.code) return;
    const group = this.optionItems.at(index) as FormGroup;
    group.markAllAsTouched();
    if (group.invalid || this.savingOptions) return;

    const definitionCode = this.data.definition.code;
    const id = group.get('id')!.value as number | null;
    const code = String(group.get('code')!.value ?? '').trim();
    const label = String(group.get('label')!.value ?? '').trim() || code;

    if (!code) {
      group.get('code')!.setErrors({ required: true });
      return;
    }

    this.savingOptions = true;
    if (id == null) {
      const payload: Partial<EnumOptionDTO> = { code, label, parameterDefinitionCode: definitionCode };
      this.parameterService.addEnumOption(definitionCode, payload as EnumOptionDTO).subscribe({
        next: () => this.loadOptions(),
        error: (error) => {
          console.error('Erreur lors de la création de l’option:', error);
          this.savingOptions = false;
        },
        complete: () => {
          this.savingOptions = false;
        }
      });
    } else {
      this.parameterService.updateEnumOption(definitionCode, id, { code, label }).subscribe({
        next: () => this.loadOptions(),
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l’option:', error);
          this.savingOptions = false;
        },
        complete: () => {
          this.savingOptions = false;
        }
      });
    }
  }

  deleteOptionRow(index: number): void {
    if (!this.data.definition?.code) return;
    const group = this.optionItems.at(index) as FormGroup;
    const id = group.get('id')!.value as number | null;
    if (id == null) {
      this.optionItems.removeAt(index);
      return;
    }
    if (this.savingOptions) return;
    this.savingOptions = true;
    this.parameterService.deleteEnumOption(this.data.definition.code, id).subscribe({
      next: () => this.loadOptions(),
      error: (error) => {
        console.error('Erreur lors de la suppression de l’option:', error);
        this.savingOptions = false;
      },
      complete: () => {
        this.savingOptions = false;
      }
    });
  }

  dropOption(event: CdkDragDrop<FormGroup[]>): void {
    if (!this.data.definition?.code) return;
    if (event.previousIndex === event.currentIndex) return;
    if (this.savingOptions) return;

    // Ne pas réordonner côté serveur si on a des options non persistées.
    const ids: number[] = this.optionItems.controls
      .map(c => (c as FormGroup).get('id')!.value)
      .filter((v): v is number => typeof v === 'number');
    if (ids.length !== this.optionItems.length) {
      moveItemInArray(this.optionItems.controls, event.previousIndex, event.currentIndex);
      this.optionItems.updateValueAndValidity();
      return;
    }

    moveItemInArray(this.optionItems.controls, event.previousIndex, event.currentIndex);
    const orderedIds = this.optionItems.controls.map(c => (c as FormGroup).get('id')!.value as number);

    this.savingOptions = true;
    this.parameterService.reorderEnumOptions(this.data.definition.code, orderedIds).subscribe({
      next: () => this.loadOptions(),
      error: (error) => {
        console.error('Erreur lors du réordonnancement:', error);
        this.savingOptions = false;
      },
      complete: () => {
        this.savingOptions = false;
      }
    });
  }

  onValueTypeChange(): void {
    const valueType = this.definitionForm.get('valueType')?.value;
    if (valueType === 'ENUM' && this.isEditMode) {
      this.loadOptions();
    } else {
      this.options = [];
      this.rebuildOptionsForm();
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


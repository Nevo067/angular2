import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionParameterValueDTO, ConditionParameterValueDTO, EnumOptionDTO, ParameterDefinitionDTO, ParameterValueType } from '../../../core/models';
import { ParameterDefinitionService } from '../../../core/services';
import { ReactiveFormsModule } from '@angular/forms';

type OwnerType = 'action' | 'condition';

@Component({
  selector: 'app-parameter-editor',
  templateUrl: './parameter-editor.component.html',
  styleUrls: ['./parameter-editor.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ParameterEditorComponent implements OnInit {
  @Input() ownerType: OwnerType = 'action';
  @Input() ownerId!: number;
  @Input() definitions: ParameterDefinitionDTO[] = [];
  @Input() currentValues: (ActionParameterValueDTO | ConditionParameterValueDTO)[] = [];

  @Output() save = new EventEmitter<(ActionParameterValueDTO | ConditionParameterValueDTO)[]>();
  @Output() remove = new EventEmitter<number>();

  form!: FormGroup;
  optionsByCode = new Map<string, EnumOptionDTO[]>();

  constructor(private fb: FormBuilder, private paramDefSrv: ParameterDefinitionService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      items: this.fb.array([])
    });
    this.initItems();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private initItems(): void {
    const mapExisting = new Map(this.currentValues.map(v => [v.parameterDefinitionCode, v]));
    for (const def of this.definitions) {
      const existing = mapExisting.get(def.code) as any;
      const group = this.fb.group({
        enabled: [!!existing],
        parameterDefinitionCode: [def.code, Validators.required],
        valueString: [existing?.valueString || null],
        valueNumber: [existing?.valueNumber || null],
        enumOptionCode: [existing?.enumOptionCode || null]
      });
      this.applyValidators(group, def.valueType);
      this.items.push(group);
      if (def.valueType === 'ENUM') {
        this.loadOptions(def.code);
      }
    }
  }

  private applyValidators(group: FormGroup, type: ParameterValueType): void {
    group.get('valueString')!.clearValidators();
    group.get('valueNumber')!.clearValidators();
    group.get('enumOptionCode')!.clearValidators();

    const enabled = group.get('enabled')!.value;
    if (!enabled) {
      group.get('valueString')!.updateValueAndValidity();
      group.get('valueNumber')!.updateValueAndValidity();
      group.get('enumOptionCode')!.updateValueAndValidity();
      return;
    }

    if (type === 'STRING') {
      group.get('valueString')!.setValidators([Validators.required]);
    } else if (type === 'NUMBER') {
      group.get('valueNumber')!.setValidators([Validators.required]);
    } else if (type === 'ENUM') {
      group.get('enumOptionCode')!.setValidators([Validators.required]);
    }
    group.get('valueString')!.updateValueAndValidity();
    group.get('valueNumber')!.updateValueAndValidity();
    group.get('enumOptionCode')!.updateValueAndValidity();
  }

  onToggle(i: number, def: ParameterDefinitionDTO): void {
    const group = this.items.at(i) as FormGroup;
    const enabled = group.get('enabled')!.value;
    if (!enabled) {
      group.patchValue({ valueString: null, valueNumber: null, enumOptionCode: null });
    }
    this.applyValidators(group, def.valueType);
  }

  loadOptions(defCode: string): void {
    if (this.optionsByCode.has(defCode)) return;
    this.paramDefSrv.listEnumOptions(defCode).subscribe(opts => this.optionsByCode.set(defCode, opts));
  }

  submit(): void {
    const payload = this.items.controls
      .map(g => g.value)
      .filter((v: any) => v.enabled)
      .map((v: any) => ({
        parameterDefinitionCode: v.parameterDefinitionCode,
        valueString: v.valueString ?? null,
        valueNumber: v.valueNumber ?? null,
        enumOptionCode: v.enumOptionCode ?? null
      }));
    this.save.emit(payload);
  }
}



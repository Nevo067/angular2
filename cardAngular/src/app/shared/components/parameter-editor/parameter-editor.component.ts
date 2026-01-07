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
    
    // Charger les options pour tous les paramètres (pas seulement ENUM)
    for (const def of this.definitions) {
      this.loadOptions(def.code);
    }
    
    for (const def of this.definitions) {
      const existing = mapExisting.get(def.code) as any;
      
      // Pour les STRING avec options : mapper enumOptionCode vers valueString si présent
      let initialValueString = existing?.valueString || null;
      let initialEnumOptionCode = existing?.enumOptionCode || null;
      
      if (def.valueType === 'STRING' && existing?.enumOptionCode && !existing?.valueString) {
        // Si on a enumOptionCode mais pas valueString, utiliser enumOptionCode comme valueString
        initialValueString = existing.enumOptionCode;
      } else if (def.valueType === 'STRING' && existing?.valueString && !existing?.enumOptionCode) {
        // Si on a valueString mais pas enumOptionCode, essayer de matcher avec les options
        initialEnumOptionCode = existing.valueString;
      }
      
      const group = this.fb.group({
        enabled: [!!existing],
        parameterDefinitionCode: [def.code, Validators.required],
        valueString: [initialValueString],
        valueNumber: [existing?.valueNumber || null],
        enumOptionCode: [initialEnumOptionCode]
      });
      this.applyValidators(group, def.valueType, def.code);
      this.items.push(group);
    }
  }

  private applyValidators(group: FormGroup, type: ParameterValueType, defCode?: string): void {
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

    // Pour STRING avec options, on valide valueString (qui contient le code de l'option)
    const hasOptions = defCode ? this.hasOptions(defCode) : false;
    
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
    this.applyValidators(group, def.valueType, def.code);
  }

  loadOptions(defCode: string): void {
    if (this.optionsByCode.has(defCode)) return;
    this.paramDefSrv.listEnumOptions(defCode).subscribe({
      next: (opts) => {
        if (opts && opts.length > 0) {
          this.optionsByCode.set(defCode, opts);
        }
      },
      error: () => {
        // Si erreur, on assume qu'il n'y a pas d'options
        this.optionsByCode.set(defCode, []);
      }
    });
  }

  hasOptions(defCode: string): boolean {
    const options = this.optionsByCode.get(defCode);
    return options !== undefined && options.length > 0;
  }

  submit(): void {
    const payload = this.items.controls
      .map((g, index) => {
        const def = this.definitions[index];
        const v = g.value;
        if (!v.enabled) return null;
        
        const hasOpts = this.hasOptions(def.code);
        
        // Pour les STRING avec options : sauvegarder dans valueString ET enumOptionCode
        if (def.valueType === 'STRING' && hasOpts) {
          const selectedOptionCode = v.valueString || v.enumOptionCode;
          return {
            parameterDefinitionCode: v.parameterDefinitionCode,
            valueString: selectedOptionCode ?? null,
            valueNumber: null,
            enumOptionCode: selectedOptionCode ?? null
          };
        }
        
        // Pour les ENUM : utiliser enumOptionCode
        if (def.valueType === 'ENUM') {
          return {
            parameterDefinitionCode: v.parameterDefinitionCode,
            valueString: null,
            valueNumber: null,
            enumOptionCode: v.enumOptionCode ?? null
          };
        }
        
        // Pour les autres types : comportement normal
        return {
          parameterDefinitionCode: v.parameterDefinitionCode,
          valueString: v.valueString ?? null,
          valueNumber: v.valueNumber ?? null,
          enumOptionCode: v.enumOptionCode ?? null
        };
      })
      .filter((v: any) => v !== null) as (ActionParameterValueDTO | ConditionParameterValueDTO)[];
    this.save.emit(payload);
  }
}



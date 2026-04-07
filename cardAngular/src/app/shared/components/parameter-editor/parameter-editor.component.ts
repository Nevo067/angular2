import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionParameterValueDTO, ConditionParameterValueDTO, EffectParameterValueDTO, EnumOptionDTO, ParameterDefinitionDTO, ParameterValueType } from '../../../core/models';
import { ParameterDefinitionService } from '../../../core/services';
import { ReactiveFormsModule } from '@angular/forms';

type OwnerType = 'action' | 'condition' | 'effect';

@Component({
  selector: 'app-parameter-editor',
  templateUrl: './parameter-editor.component.html',
  styleUrls: ['./parameter-editor.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ParameterEditorComponent implements OnInit, OnChanges {
  @Input() ownerType: OwnerType = 'action';
  @Input() ownerId!: number;
  @Input() effectId?: number; // Requis si ownerType === 'effect'
  @Input() actionId?: number; // Requis si ownerType === 'effect'
  @Input() definitions: ParameterDefinitionDTO[] = [];
  @Input() currentValues: (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[] = [];

  @Output() save = new EventEmitter<(ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[]>();
  @Output() remove = new EventEmitter<number>();

  form!: FormGroup;
  optionsByCode = new Map<string, EnumOptionDTO[]>();
  private lastDefsSignature = '';
  private lastValuesSignature = '';

  constructor(private fb: FormBuilder, private paramDefSrv: ParameterDefinitionService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      items: this.fb.array([])
    });
    this.initItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.form || (!changes['currentValues'] && !changes['definitions'])) {
      return;
    }

    if (!this.definitions || this.definitions.length === 0) {
      return;
    }

    const defsSignature = this.getDefinitionsSignature(this.definitions);
    const valuesSignature = this.getValuesSignature(this.currentValues);
    const defsChangedMeaningfully = defsSignature !== this.lastDefsSignature;
    const valuesChangedMeaningfully = valuesSignature !== this.lastValuesSignature;

    if (!defsChangedMeaningfully && !valuesChangedMeaningfully) {
      return;
    }

    // Si les définitions changent réellement, on réinitialise aussi le cache d'options.
    if (defsChangedMeaningfully) {
      this.optionsByCode.clear();
    }

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
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

    this.lastDefsSignature = this.getDefinitionsSignature(this.definitions);
    this.lastValuesSignature = this.getValuesSignature(this.currentValues);
  }

  private getDefinitionsSignature(defs: ParameterDefinitionDTO[]): string {
    // Signature stable pour éviter les rebuilds causés par de nouvelles références de tableau.
    return defs.map(d => `${d.code}|${d.valueType}|${d.label ?? ''}`).join('||');
  }

  private getValuesSignature(
    values: (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[]
  ): string {
    // On inclut enabled implicite via présence/absence + les valeurs stockées.
    return values
      .map(v => {
        const anyV: any = v as any;
        return [
          v.parameterDefinitionCode ?? '',
          anyV.valueString ?? '',
          anyV.valueNumber ?? '',
          anyV.enumOptionCode ?? ''
        ].join('|');
      })
      .sort()
      .join('||');
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
    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.items.controls.forEach(control => {
      control.markAllAsTouched();
    });

    // Vérifier si le formulaire est valide
    if (this.form.valid) {
      const payload = this.getCurrentValues();
      if (payload.length > 0) {
        console.log('💾 Sauvegarde des paramètres:', payload);
        this.save.emit(payload);
      } else {
        console.log('ℹ️ Aucun paramètre activé à sauvegarder');
        // Émettre quand même un tableau vide pour indiquer qu'il n'y a rien à sauvegarder
        this.save.emit([]);
      }
    } else {
      console.error('❌ Formulaire invalide, impossible de sauvegarder');
      // Trouver les erreurs et les afficher
      this.items.controls.forEach((control, index) => {
        if (control.invalid) {
          const errors = control.errors;
          console.error(`Erreur pour le paramètre ${index}:`, errors);
        }
      });
    }
  }

  // Méthode publique pour récupérer les valeurs actuelles du formulaire sans émettre l'événement
  getCurrentValues(): (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[] {
    return this.items.controls
      .map((g, index) => {
        const def = this.definitions[index];
        const v = g.value;
        if (!v.enabled) return null;
        
        const hasOpts = this.hasOptions(def.code);
        
        // Base payload commun
        const basePayload: any = {
          parameterDefinitionCode: v.parameterDefinitionCode,
          valueString: null,
          valueNumber: null,
          enumOptionCode: null
        };
        
        // Pour les paramètres d'effets, ajouter effectId et actionId
        if (this.ownerType === 'effect') {
          if (this.effectId === undefined || this.actionId === undefined) {
            console.error('effectId and actionId are required for effect parameters');
            return null;
          }
          basePayload.effectId = this.effectId;
          basePayload.actionId = this.actionId;
        }
        
        // Pour les STRING avec options : sauvegarder dans valueString ET enumOptionCode
        if (def.valueType === 'STRING' && hasOpts) {
          const selectedOptionCode = v.valueString || v.enumOptionCode;
          basePayload.valueString = selectedOptionCode ?? null;
          basePayload.enumOptionCode = selectedOptionCode ?? null;
          return basePayload;
        }
        
        // Pour les ENUM : utiliser enumOptionCode
        if (def.valueType === 'ENUM') {
          basePayload.enumOptionCode = v.enumOptionCode ?? null;
          return basePayload;
        }
        
        // Pour les autres types : comportement normal
        basePayload.valueString = v.valueString ?? null;
        basePayload.valueNumber = v.valueNumber ?? null;
        return basePayload;
      })
      .filter((v: any) => v !== null) as (ActionParameterValueDTO | ConditionParameterValueDTO | EffectParameterValueDTO)[];
  }
}



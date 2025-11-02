import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActionParameterService, ConditionParameterService, ParameterDefinitionService } from '../../../core/services';
import { ActionParameterValueDTO, ConditionParameterValueDTO, ParameterDefinitionDTO } from '../../../core/models';
import { forkJoin } from 'rxjs';

type OwnerType = 'action' | 'condition';

interface ParameterDisplay {
  code: string;
  label: string;
  valueType: string;
  displayValue: string;
}

@Component({
  selector: 'app-parameter-display',
  templateUrl: './parameter-display.component.html',
  styleUrls: ['./parameter-display.component.css'],
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule]
})
export class ParameterDisplayComponent implements OnInit {
  @Input() ownerId!: number;
  @Input() ownerType!: OwnerType;

  parameters: ParameterDisplay[] = [];
  loading = true;
  error = false;

  constructor(
    private actionParameterService: ActionParameterService,
    private conditionParameterService: ConditionParameterService,
    private definitionService: ParameterDefinitionService
  ) {}

  ngOnInit(): void {
    this.loadParameters();
  }

  private loadParameters(): void {
    this.loading = true;
    this.error = false;

    const valuesObservable = this.ownerType === 'action'
      ? this.actionParameterService.list(this.ownerId)
      : this.conditionParameterService.list(this.ownerId);

    forkJoin({
      values: valuesObservable,
      definitions: this.definitionService.listDefinitions()
    }).subscribe({
      next: ({ values, definitions }) => {
        this.parameters = this.mapParametersToDisplay(values, definitions);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des paramètres:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  private mapParametersToDisplay(
    values: (ActionParameterValueDTO | ConditionParameterValueDTO)[],
    definitions: ParameterDefinitionDTO[]
  ): ParameterDisplay[] {
    const definitionMap = new Map(definitions.map(d => [d.code, d]));

    return values.map(value => {
      const definition = definitionMap.get(value.parameterDefinitionCode);
      if (!definition) {
        return {
          code: value.parameterDefinitionCode,
          label: value.parameterDefinitionCode,
          valueType: 'UNKNOWN',
          displayValue: 'N/A'
        };
      }

      let displayValue = 'N/A';
      if (definition.valueType === 'STRING' && value.valueString) {
        displayValue = value.valueString;
      } else if (definition.valueType === 'NUMBER' && value.valueNumber !== null && value.valueNumber !== undefined) {
        displayValue = value.valueNumber.toString();
      } else if (definition.valueType === 'ENUM' && value.enumOptionCode) {
        displayValue = value.enumOptionCode;
      }

      return {
        code: definition.code,
        label: definition.label,
        valueType: definition.valueType,
        displayValue
      };
    });
  }

  getTypeColor(valueType: string): string {
    switch (valueType) {
      case 'STRING':
        return 'primary';
      case 'NUMBER':
        return 'accent';
      case 'ENUM':
        return 'warn';
      default:
        return 'basic';
    }
  }

  getTypeIcon(valueType: string): string {
    switch (valueType) {
      case 'STRING':
        return 'text_fields';
      case 'NUMBER':
        return 'pin';
      case 'ENUM':
        return 'list';
      default:
        return 'help';
    }
  }
}

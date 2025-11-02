import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ParameterDefinitionService } from '../../../../core/services';
import { ParameterDefinitionDTO } from '../../../../core/models';
import { ParameterDefinitionEditDialogComponent } from '../parameter-definition-edit-dialog/parameter-definition-edit-dialog.component';

@Component({
  selector: 'app-parameter-definition-list',
  templateUrl: './parameter-definition-list.component.html',
  styleUrls: ['./parameter-definition-list.component.css'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule]
})
export class ParameterDefinitionListComponent implements OnInit {
  definitions: ParameterDefinitionDTO[] = [];
  loading = false;

  constructor(
    private parameterService: ParameterDefinitionService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDefinitions();
  }

  loadDefinitions(): void {
    this.loading = true;
    this.parameterService.listDefinitions().subscribe({
      next: (defs) => {
        this.definitions = defs;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des définitions:', error);
        this.loading = false;
      }
    });
  }

  addDefinition(): void {
    this.openDefinitionDialog();
  }

  editDefinition(def: ParameterDefinitionDTO): void {
    this.openDefinitionDialog(def);
  }

  deleteDefinition(def: ParameterDefinitionDTO): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la définition "${def.label}" ?`)) {
      this.parameterService.deleteDefinition(def.code).subscribe({
        next: () => {
          console.log('Définition supprimée avec succès');
          this.loadDefinitions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  private openDefinitionDialog(def?: ParameterDefinitionDTO): void {
    const dialogRef = this.dialog.open(ParameterDefinitionEditDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { definition: def },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveDefinition(result);
      }
    });
  }

  private saveDefinition(data: any): void {
    if (data.id) {
      // Modification
      this.parameterService.updateDefinition(data.code, data).subscribe({
        next: () => {
          console.log('Définition modifiée avec succès');
          this.loadDefinitions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la modification:', error);
          alert('Erreur lors de la modification');
        }
      });
    } else {
      // Création
      this.parameterService.createDefinition(data).subscribe({
        next: () => {
          console.log('Définition créée avec succès');
          this.loadDefinitions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la création:', error);
          alert('Erreur lors de la création: ' + error.message);
        }
      });
    }
  }

  getValueTypeClass(valueType: string): string {
    return `type-badge-${valueType.toLowerCase()}`;
  }
}


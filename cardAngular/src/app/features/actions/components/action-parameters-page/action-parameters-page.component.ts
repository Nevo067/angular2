import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActionParameterService, ParameterDefinitionService } from '../../../../core/services';
import { ActionParameterValueDTO, ParameterDefinitionDTO } from '../../../../core/models';
import { RouterModule } from '@angular/router';
import { ParameterEditorComponent } from '../../../../shared/components/parameter-editor/parameter-editor.component';
import { ParameterDefinitionEditDialogComponent } from '../../../parameters/components/parameter-definition-edit-dialog/parameter-definition-edit-dialog.component';

@Component({
  selector: 'app-action-parameters-page',
  templateUrl: './action-parameters-page.component.html',
  styleUrls: ['./action-parameters-page.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ParameterEditorComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule]
})
export class ActionParametersPageComponent implements OnInit {
  actionId!: number;
  definitions: ParameterDefinitionDTO[] = [];
  values: ActionParameterValueDTO[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private defs: ParameterDefinitionService,
    private svc: ActionParameterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.actionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.defs.listDefinitions().subscribe(defs => {
      this.definitions = defs;
      this.svc.list(this.actionId).subscribe(vals => {
        this.values = vals;
        this.loading = false;
      });
    });
  }

  onSave(payload: ActionParameterValueDTO[]): void {
    // envoyer chaque valeur (upsert)
    const tasks = payload.map(p => this.svc.upsert(this.actionId, p));
    let done = 0;
    let errors = 0;
    
    tasks.forEach(obs => obs.subscribe({
      next: () => {
        done++;
        if (done + errors === tasks.length) {
          this.load();
          if (errors === 0) {
            this.snackBar.open('✓ Paramètres enregistrés avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open(`⚠ ${done} paramètre(s) enregistré(s), ${errors} erreur(s)`, 'Fermer', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            });
          }
        }
      },
      error: (error) => {
        errors++;
        console.error('Erreur lors de l\'enregistrement:', error);
        if (done + errors === tasks.length) {
          this.load();
          this.snackBar.open('✕ Erreur lors de l\'enregistrement des paramètres', 'Fermer', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      }
    }));
  }

  openNewDefinitionDialog(): void {
    const dialogRef = this.dialog.open(ParameterDefinitionEditDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { definition: undefined },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveNewDefinition(result);
      }
    });
  }

  private saveNewDefinition(data: any): void {
    this.defs.createDefinition(data).subscribe({
      next: () => {
        console.log('Définition créée avec succès');
        this.load(); // Recharger les définitions et valeurs
      },
      error: (error: any) => {
        console.error('Erreur lors de la création:', error);
        alert('Erreur lors de la création de la définition: ' + (error.message || 'Erreur inconnue'));
      }
    });
  }
}



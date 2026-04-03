import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ActionCardService } from '../../../../core/services';
import { ActionCard } from '../../../../core/models';
import { DataTableComponent } from '../../../../shared/components';
import { TableConfig, TableAction } from '../../../../shared/models';
import { downloadJsonFile } from '../../../../shared/utils/download-json';
import { ActionEditDialogComponent } from '../action-edit-dialog/action-edit-dialog.component';

@Component({
  selector: 'app-action-list',
  templateUrl: './action-list.component.html',
  styleUrls: ['./action-list.component.css'],
  standalone: false
})
export class ActionListComponent implements OnInit {
  actions: ActionCard[] = [];
  loading = false;
  exporting = false;

  tableConfig: TableConfig<ActionCard> = {
    columns: [
      {
        key: 'id',
        label: 'ID',
        type: 'number',
        sortable: true,
        width: '80px'
      },
      {
        key: 'actionName',
        label: 'Nom',
        type: 'text',
        sortable: true,
        filterable: true
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        sortable: true
      },
    ],
    actions: [
      {
        key: 'parameters',
        label: 'Paramètres',
        icon: 'tune',
        color: 'accent',
        tooltip: 'Configurer les paramètres'
      },
      {
        key: 'edit',
        label: 'Modifier',
        icon: 'edit_note',
        color: 'primary',
        tooltip: 'Modifier l\'action'
      },
      {
        key: 'delete',
        label: 'Supprimer',
        icon: 'delete_forever',
        color: 'warn',
        tooltip: 'Supprimer l\'action'
      }
    ],
    expandable: {
      enabled: true,
      expandOnClick: false
    },
    pagination: {
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showFirstLastButtons: true
    },
    selection: {
      enabled: true,
      multiple: true
    },
    sorting: {
      enabled: true,
      defaultSort: {
        column: 'name',
        direction: 'asc'
      }
    },
    filtering: {
      enabled: true,
      globalFilter: true
    },
    emptyMessage: 'Aucune action trouvée'
  };

  constructor(
    private actionCardService: ActionCardService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadActions();
  }

  exportActionsToJson(): void {
    this.exporting = true;
    this.snackBar.open('Export en cours...', 'Fermer', { duration: 2000 });

    this.actionCardService
      .getAllActionsWithParameters()
      .pipe(finalize(() => (this.exporting = false)))
      .subscribe({
        next: (list) => {
          const payload = {
            exportVersion: '1.0',
            exportType: 'actions' as const,
            exportDate: new Date().toISOString(),
            items: list.map((a) => this.mapActionForExport(a))
          };
          downloadJsonFile(payload, 'actions_export');
          this.snackBar.open(`Export réussi ! ${list.length} action(s)`, 'Fermer', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de l\'export des actions', 'Fermer', { duration: 3000 });
        }
      });
  }

  private mapActionForExport(a: ActionCard): Record<string, unknown> {
    const row: Record<string, unknown> = {
      id: a.id,
      actionName: a.actionName ?? '',
      description: a.description ?? ''
    };
    if (a.cardCondition) {
      const c = a.cardCondition;
      row['cardCondition'] = {
        id: c.id,
        nameCondition: c.nameCondition ?? '',
        description: c.description ?? ''
      };
    }
    const params = a.parameters || [];
    if (params.length > 0) {
      row['parameters'] = params.map((p) => ({
        parameterDefinitionCode: p.parameterDefinitionCode,
        valueString: p.valueString ?? null,
        valueNumber: p.valueNumber ?? null,
        enumOptionCode: p.enumOptionCode ?? null
      }));
    }
    return row;
  }

  loadActions(): void {
    console.log('🔄 Chargement des actions...');
    this.loading = true;

    this.actionCardService.getAllActions().subscribe({
      next: (actions) => {
        console.log('✅ Actions chargées:', actions);
        this.loading = false;
        this.actions = actions;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des actions:', error);
        this.loading = false;
      }
    });
  }

  onActionClick(event: { action: string; row: ActionCard; index: number }): void {
    const { action, row } = event;

    switch (action) {
      case 'parameters':
        this.navigateToParameters(row);
        break;
      case 'edit':
        this.editAction(row);
        break;
      case 'delete':
        this.deleteAction(row);
        break;
    }
  }

  navigateToParameters(action: ActionCard): void {
    if (action.id) {
      this.router.navigate(['/actions', action.id, 'parameters']);
    }
  }

  onRowClick(action: ActionCard): void {
    console.log('Action sélectionnée:', action);
  }

  onSelectionChange(selectedActions: ActionCard[]): void {
    console.log('Actions sélectionnées:', selectedActions);
  }

  onPageChange(event: any): void {
    console.log('Changement de page:', event);
  }

  onSortChange(event: any): void {
    console.log('Changement de tri:', event);
  }

  private editAction(action: ActionCard): void {
    console.log('Modifier l\'action:', action);
    this.openActionDialog(action);
  }

  private deleteAction(action: ActionCard): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'action "${action.actionName}" ?`)) {
      this.actionCardService.deleteAction(action.id).subscribe({
        next: () => {
          console.log('Action supprimée avec succès');
          this.loadActions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  addNewAction(): void {
    console.log('Ajouter une nouvelle action');
    this.openActionDialog();
  }

  private openActionDialog(action?: ActionCard): void {
    const dialogRef = this.dialog.open(ActionEditDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { action: action },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Données du dialog:', result);
        this.saveAction(result);
      }
    });
  }

  private saveAction(actionData: any): void {
    if (actionData.id) {
      // Modification d'une action existante
      this.actionCardService.updateAction(actionData).subscribe({
        next: (updatedAction) => {
          console.log('Action modifiée avec succès:', updatedAction);
          this.loadActions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la modification:', error);
        }
      });
    } else {
      // Création d'une nouvelle action
      this.actionCardService.createAction(actionData).subscribe({
        next: (newAction) => {
          console.log('Action créée avec succès:', newAction);
          this.loadActions();
          if (actionData.configureParametersAfterSave && newAction?.id) {
            // rediriger vers la page des paramètres de l'action
            window.location.href = `/actions/${newAction.id}/parameters`;
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de la création:', error);
        }
      });
    }
  }
}

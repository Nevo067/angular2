import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConditionCardService } from '../../../../core/services';
import { ConditionCard } from '../../../../core/models';
import { DataTableComponent } from '../../../../shared/components';
import { TableConfig, TableAction } from '../../../../shared/models';
import { ConditionEditDialogComponent } from '../condition-edit-dialog/condition-edit-dialog.component';
import { ConditionRelationsDialogComponent } from '../condition-relations-dialog/condition-relations-dialog.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-condition-list',
  templateUrl: './condition-list.component.html',
  styleUrls: ['./condition-list.component.css'],
  standalone: false
})
export class ConditionListComponent implements OnInit {
  conditions: ConditionCard[] = [];
  loading = false;

  tableConfig: TableConfig<ConditionCard> = {
    columns: [
      {
        key: 'id',
        label: 'ID',
        type: 'number',
        sortable: true,
        width: '80px'
      },
      {
        key: 'nameCondition',
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
      {
        key: 'linkedActions',
        label: 'Actions associées',
        type: 'chip',
        formatter: (value: any, row: any) => `${row.actions?.length || 0} action(s)`,
        chipConfig: {
          color: 'primary',
          textColor: 'white'
        }
      },
    ],
    actions: [
      {
        key: 'manageRelations',
        label: 'Gérer relations',
        icon: 'link',
        color: 'primary',
        tooltip: 'Gérer les effets et actions de la condition'
      },
      {
        key: 'edit',
        label: 'Modifier',
        icon: 'edit_note',
        color: 'primary',
        tooltip: 'Modifier la condition'
      },
      {
        key: 'delete',
        label: 'Supprimer',
        icon: 'delete_forever',
        color: 'warn',
        tooltip: 'Supprimer la condition'
      }
    ],
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
    emptyMessage: 'Aucune condition trouvée'
  };

  constructor(
    private conditionCardService: ConditionCardService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadConditions();
  }

  loadConditions(): void {
    console.log('🔄 Chargement des conditions...');
    this.loading = true;

    // Essayer d'abord l'endpoint complet
    this.conditionCardService.getAllConditionsComplete().subscribe({
      next: (conditions) => {
        console.log('✅ Conditions complètes chargées:', conditions);
        console.log('🔍 Détail de la première condition:', conditions[0]);
        console.log('🔍 Propriétés de la première condition:', Object.keys(conditions[0] || {}));

        // Vérifier si les actions sont présentes
        conditions.forEach((condition, index) => {
          console.log(`  Condition ${index + 1} (ID: ${condition.id}):`, {
            name: condition.nameCondition,
            hasActionsProperty: 'actions' in condition,
            actionsLength: condition.actions?.length || 0,
            actionsData: condition.actions
          });
        });

        // Vérifier que les actions sont bien chargées
        const totalActions = conditions.reduce((sum, condition) => sum + (condition.actions?.length || 0), 0);
        console.log(`📊 Total des actions chargées: ${totalActions}`);

        // Log détaillé pour chaque condition
        conditions.forEach((condition, index) => {
          console.log(`🔍 Condition ${index + 1} (ID: ${condition.id}): ${condition.nameCondition} - Actions: ${condition.actions?.length || 0}`);
          if (condition.actions && condition.actions.length > 0) {
            console.log(`  📋 Actions détaillées:`, condition.actions.map(a => `ID: ${a.id}`));
          }
        });

        if (totalActions > 0) {
          console.log('✅ Les relations conditions-actions fonctionnent correctement !');
        } else {
          console.log('ℹ️ Aucune action associée aux conditions pour le moment');
        }

        this.conditions = conditions;
        this.loading = false;
      },
      error: (error) => {
        console.warn('⚠️ Endpoint complet non disponible, fallback vers endpoint simple:', error);

        // Fallback vers l'endpoint simple + chargement des relations
        this.conditionCardService.getAllConditions().subscribe({
          next: (conditions) => {
            console.log('✅ Conditions de base chargées:', conditions);
            this.loadConditionsWithCompleteRelations(conditions);
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement des conditions:', error);
            this.loading = false;
          }
        });
      }
    });
  }

  private loadConditionsWithCompleteRelations(conditions: ConditionCard[]): void {
    console.log('🔄 Chargement des relations pour chaque condition...');

    // Charger les actions pour chaque condition en parallèle
    const conditionObservables = conditions.map(condition => {
      console.log(`🔍 Chargement des actions pour la condition ${condition.id} (${condition.nameCondition})`);
      return this.conditionCardService.getConditionActions(condition.id).pipe(
        catchError(error => {
          console.warn(`⚠️ Impossible de charger les actions pour la condition ${condition.id}:`, error);
          return of([]);
        }),
        map(actions => {
          console.log(`✅ Actions chargées pour la condition ${condition.id}:`, actions);
          return {
            ...condition,
            actions: actions
          };
        })
      );
    });

    // Attendre que toutes les relations soient chargées
    forkJoin(conditionObservables).subscribe({
      next: (completeConditions) => {
        console.log('✅ Conditions chargées avec relations:', completeConditions);
        console.log('🔍 Détail des relations pour chaque condition:');
        completeConditions.forEach((condition, index) => {
          console.log(`  Condition ${index + 1} (ID: ${condition.id}):`, {
            name: condition.nameCondition,
            actions: condition.actions?.length || 0
          });
        });
        this.conditions = completeConditions;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des relations:', error);
        this.loading = false;
      }
    });
  }

  onRowClick(condition: ConditionCard): void {
    console.log('Condition sélectionnée:', condition);
  }

  onSelectionChange(selectedConditions: ConditionCard[]): void {
    console.log('Conditions sélectionnées:', selectedConditions);
  }

  onPageChange(event: any): void {
    console.log('Changement de page:', event);
  }

  onSortChange(event: any): void {
    console.log('Changement de tri:', event);
  }

  onActionClick(event: { action: string; row: ConditionCard; index: number }): void {
    const { action, row } = event;

    switch (action) {
      case 'manageRelations':
        this.manageConditionRelations(row);
        break;
      case 'edit':
        this.editCondition(row);
        break;
      case 'delete':
        this.deleteCondition(row);
        break;
    }
  }

  private manageConditionRelations(condition: ConditionCard): void {
    console.log('Gérer les relations de la condition:', condition);

    const dialogRef = this.dialog.open(ConditionRelationsDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { condition: condition },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Relations de la condition mises à jour, rechargement de la liste...');
        // Attendre un peu pour que le serveur traite la mise à jour
        setTimeout(() => {
          console.log('🔄 Rechargement des conditions après mise à jour des relations...');
          this.loadConditions();
        }, 1000);
      }
    });
  }

  private editCondition(condition: ConditionCard): void {
    console.log('Modifier la condition:', condition);
    this.openConditionDialog(condition);
  }

  private deleteCondition(condition: ConditionCard): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la condition "${condition.nameCondition}" ?`)) {
      this.conditionCardService.deleteCondition(condition.id).subscribe({
        next: () => {
          console.log('Condition supprimée avec succès');
          this.loadConditions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  addNewCondition(): void {
    console.log('Ajouter une nouvelle condition');
    this.openConditionDialog();
  }

  private openConditionDialog(condition?: ConditionCard): void {
    const dialogRef = this.dialog.open(ConditionEditDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { condition: condition },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Données du dialog:', result);
        this.saveCondition(result);
      }
    });
  }

  private saveCondition(conditionData: any): void {
    // Préparer les données avec les relations
    const conditionRequest = {
      id: conditionData.id,
      nameCondition: conditionData.nameCondition,
      description: conditionData.description,
      actionIds: conditionData.selectedActions || []
    };

    if (conditionData.id) {
      // Modification d'une condition existante
      this.conditionCardService.updateCondition(conditionRequest).subscribe({
        next: (updatedCondition) => {
          console.log('Condition modifiée avec succès:', updatedCondition);
          this.loadConditions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la modification:', error);
        }
      });
    } else {
      // Création d'une nouvelle condition
      this.conditionCardService.createCondition(conditionRequest).subscribe({
        next: (newCondition) => {
          console.log('Condition créée avec succès:', newCondition);
          this.loadConditions();
        },
        error: (error: any) => {
          console.error('Erreur lors de la création:', error);
        }
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EffectService, ActionCardService, ConditionCardService } from '../../../../core/services';
import { Effect } from '../../../../core/models';
import { DataTableComponent } from '../../../../shared/components';
import { TableConfig, TableAction } from '../../../../shared/models';
import { EffectEditDialogComponent } from '../effect-edit-dialog/effect-edit-dialog.component';
import { EffectDetailsDialogComponent } from '../effect-details-dialog/effect-details-dialog.component';
import { EffectRelationsDialogComponent } from '../effect-relations-dialog/effect-relations-dialog.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-effect-list',
  templateUrl: './effect-list.component.html',
  styleUrls: ['./effect-list.component.css'],
  standalone: false
})
export class EffectListComponent implements OnInit {
  effects: Effect[] = [];
  loading = false;

  tableConfig: TableConfig<Effect> = {
    columns: [
      {
        key: 'id',
        label: 'ID',
        type: 'number',
        sortable: true,
        width: '80px'
      },
      {
        key: 'effectName',
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
        key: 'conditionCards',
        label: 'Conditions',
        type: 'chip',
        formatter: (value: any[]) => {
          if (!value || value.length === 0) return 'Aucune condition';
          return `${value.length} condition(s)`;
        },
        chipConfig: {
          color: 'accent',
          textColor: 'white'
        }
      },
      {
        key: 'linkedActions',
        label: 'Actions liées',
        type: 'chip',
        formatter: (value: any[], row: Effect) => {
          const actions = row.actions;
          if (!actions || actions.length === 0) return 'Aucune action';
          return `${actions.length} action(s)`;
        },
        chipConfig: {
          color: 'primary',
          textColor: 'white'
        }
      }
    ],
    actions: [
      {
        key: 'view',
        label: 'Voir détails',
        icon: 'visibility',
        color: 'primary',
        tooltip: 'Voir les détails de l\'effet'
      },
      {
        key: 'viewConditions',
        label: 'Voir conditions',
        icon: 'rule',
        color: 'accent',
        tooltip: 'Voir les conditions de l\'effet'
      },
      {
        key: 'viewActions',
        label: 'Voir actions',
        icon: 'play_arrow',
        color: 'accent',
        tooltip: 'Voir les actions de l\'effet'
      },
      {
        key: 'manageRelations',
        label: 'Gérer relations',
        icon: 'link',
        color: 'primary',
        tooltip: 'Gérer les conditions et actions de l\'effet'
      },
      {
        key: 'reloadComplete',
        label: 'Recharger complet',
        icon: 'refresh',
        color: 'accent',
        tooltip: 'Recharger l\'effet avec toutes ses relations'
      },
      {
        key: 'edit',
        label: 'Modifier',
        icon: 'edit_note',
        color: 'primary',
        tooltip: 'Modifier l\'effet'
      },
      {
        key: 'delete',
        label: 'Supprimer',
        icon: 'delete_forever',
        color: 'warn',
        tooltip: 'Supprimer l\'effet'
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
        column: 'effectName',
        direction: 'asc'
      }
    },
    filtering: {
      enabled: true,
      globalFilter: true
    },
    emptyMessage: 'Aucun effet trouvé'
  };

  constructor(
    private effectService: EffectService,
    private actionCardService: ActionCardService,
    private conditionCardService: ConditionCardService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadEffects();
  }

  loadEffects(): void {
    console.log('🔄 Chargement des effets...');
    this.loading = true;

    // Charger d'abord la liste des effets
    this.effectService.getAllEffects().subscribe({
      next: (effects) => {
        console.log('✅ Effets de base chargés:', effects);

        // Charger les relations complètes pour chaque effet
        this.loadEffectsWithCompleteRelations(effects);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des effets:', error);
        this.loading = false;
      }
    });
  }

  private loadEffectsWithCompleteRelations(effects: Effect[]): void {
    console.log('🔄 Chargement des relations pour chaque effet...');

    // Charger les conditions et actions pour chaque effet en parallèle
    const effectObservables = effects.map(effect =>
      forkJoin({
        conditions: this.effectService.getEffectConditions(effect.id).pipe(
          catchError(error => {
            console.warn(`⚠️ Impossible de charger les conditions pour l'effet ${effect.id}`);
            return of([]);
          })
        ),
        actions: this.effectService.getEffectActions(effect.id).pipe(
          catchError(error => {
            console.warn(`⚠️ Impossible de charger les actions pour l'effet ${effect.id}`);
            return of([]);
          })
        )
      }).pipe(
        map(relations => ({
          ...effect,
          conditionCards: relations.conditions,
          actions: relations.actions
        }))
      )
    );

    // Attendre que toutes les relations soient chargées
    forkJoin(effectObservables).subscribe({
      next: (completeEffects) => {
        console.log('✅ Effets chargés avec relations:', completeEffects);
        console.log('🔍 Détail des relations pour chaque effet:');
        completeEffects.forEach((effect, index) => {
          console.log(`  Effet ${index + 1} (ID: ${effect.id}):`, {
            name: effect.effectName,
            conditionCards: effect.conditionCards?.length || 0,
            actions: effect.actions?.length || 0
          });
        });
        this.effects = completeEffects;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des relations:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Charge les conditions d'un effet spécifique
   * Utilise l'endpoint GET /Effect/{id}/conditions
   */
  loadEffectConditions(effectId: number): void {
    this.effectService.getEffectConditions(effectId).subscribe({
      next: (conditions) => {
        console.log(`✅ Conditions chargées pour l'effet ${effectId}:`, conditions);
        // Mettre à jour l'effet dans la liste
        const effect = this.effects.find(e => e.id === effectId);
        if (effect) {
          effect.conditionCards = conditions;
        }
      },
      error: (error) => {
        console.error(`❌ Erreur lors du chargement des conditions pour l'effet ${effectId}:`, error);
        // En cas d'erreur, essayer de recharger l'effet complet
        this.loadEffectById(effectId);
      }
    });
  }

  /**
   * Charge les actions d'un effet spécifique
   * Utilise l'endpoint GET /Effect/{id}/actions
   */
  loadEffectActions(effectId: number): void {
    this.effectService.getEffectActions(effectId).subscribe({
      next: (actions) => {
        console.log(`✅ Actions chargées pour l'effet ${effectId}:`, actions);
        // Mettre à jour l'effet dans la liste
        const effect = this.effects.find(e => e.id === effectId);
        if (effect) {
          effect.actions = actions;
        }
      },
      error: (error) => {
        console.error(`❌ Erreur lors du chargement des actions pour l'effet ${effectId}:`, error);
        // En cas d'erreur, essayer de recharger l'effet complet
        this.loadEffectById(effectId);
      }
    });
  }

  /**
   * Charge l'effet complet avec toutes ses relations
   * Utilise l'endpoint GET /Effect/{id}/complete
   */
  loadEffectComplete(effectId: number): void {
    this.effectService.getEffectComplete(effectId).subscribe({
      next: (effect) => {
        console.log(`✅ Effet complet chargé (ID: ${effectId}):`, effect);
        // Mettre à jour l'effet dans la liste
        const index = this.effects.findIndex(e => e.id === effectId);
        if (index !== -1) {
          this.effects[index] = effect;
        }
      },
      error: (error) => {
        console.error(`❌ Erreur lors du chargement de l'effet complet ${effectId}:`, error);
        // En cas d'erreur, essayer de recharger l'effet standard
        this.loadEffectById(effectId);
      }
    });
  }

  /**
   * Recharge un effet spécifique par son ID
   */
  private loadEffectById(effectId: number): void {
    this.effectService.getEffectById(effectId).subscribe({
      next: (effect) => {
        console.log(`✅ Effet rechargé (ID: ${effectId}):`, effect);
        // Mettre à jour l'effet dans la liste
        const index = this.effects.findIndex(e => e.id === effectId);
        if (index !== -1) {
          this.effects[index] = effect;
        }
      },
      error: (error) => {
        console.error(`❌ Erreur lors du rechargement de l'effet ${effectId}:`, error);
      }
    });
  }

  /**
   * Teste l'endpoint complet pour un effet spécifique
   */
  private testEffectById(effectId: number): void {
    console.log(`🧪 Test de l'endpoint complet pour l'effet ${effectId}...`);
    this.loadEffectComplete(effectId);
  }

  onActionClick(event: { action: string; row: Effect; index: number }): void {
    const { action, row } = event;

    switch (action) {
      case 'view':
        this.viewEffectDetails(row);
        break;
      case 'viewConditions':
        this.viewEffectConditions(row);
        break;
      case 'viewActions':
        this.viewEffectActions(row);
        break;
      case 'manageRelations':
        this.manageEffectRelations(row);
        break;
      case 'reloadComplete':
        this.reloadEffectComplete(row);
        break;
      case 'edit':
        this.editEffect(row);
        break;
      case 'delete':
        this.deleteEffect(row);
        break;
    }
  }

  onRowClick(effect: Effect): void {
    console.log('Effet sélectionné:', effect);
  }

  onSelectionChange(selectedEffects: Effect[]): void {
    console.log('Effets sélectionnés:', selectedEffects);
  }

  onPageChange(event: any): void {
    console.log('Changement de page:', event);
  }

  onSortChange(event: any): void {
    console.log('Changement de tri:', event);
  }

  private viewEffectDetails(effect: Effect): void {
    console.log('Voir détails de l\'effet:', effect);
    this.openEffectDetailsDialog(effect);
  }

  private viewEffectConditions(effect: Effect): void {
    console.log('Voir conditions de l\'effet:', effect);

    // Si l'effet n'a pas de conditions chargées, essayer de les charger
    if (!effect.conditionCards || effect.conditionCards.length === 0) {
      console.log('🔄 Chargement des conditions...');
      this.loadEffectConditions(effect.id);
    }

    // Afficher un message temporaire ou ouvrir un dialog
    const conditionsText = effect.conditionCards?.map(c => c.nameCondition || 'Condition sans nom').join('\n') || 'Aucune condition';
    alert(`Conditions de l'effet "${effect.effectName}":\n${conditionsText}`);
  }

  private viewEffectActions(effect: Effect): void {
    console.log('Voir actions de l\'effet:', effect);

    // Si l'effet n'a pas d'actions chargées, essayer de les charger
    if (!effect.actions || effect.actions.length === 0) {
      console.log('🔄 Chargement des actions...');
      this.loadEffectActions(effect.id);
    }

    // Afficher un message temporaire ou ouvrir un dialog
    const actionsText = effect.actions?.map(a => a.actionName || 'Action sans nom').join('\n') || 'Aucune action';
    alert(`Actions de l'effet "${effect.effectName}":\n${actionsText}`);
  }

  private manageEffectRelations(effect: Effect): void {
    console.log('Gérer les relations de l\'effet:', effect);

    const dialogRef = this.dialog.open(EffectRelationsDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { effect: effect },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Relations mises à jour, rechargement de la liste...');
        this.loadEffects();
      }
    });
  }

  private reloadEffectComplete(effect: Effect): void {
    console.log('Rechargement complet de l\'effet:', effect);

    this.loadEffectComplete(effect.id);

    // Afficher un message de confirmation
    alert(`Rechargement complet de l'effet "${effect.effectName}" en cours...\nVérifiez la console pour voir les résultats.`);
  }

  private editEffect(effect: Effect): void {
    console.log('Modifier l\'effet:', effect);
    this.openEffectDialog(effect);
  }

  private deleteEffect(effect: Effect): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'effet "${effect.effectName}" ?`)) {
      this.effectService.deleteEffect(effect.id).subscribe({
        next: () => {
          console.log('Effet supprimé avec succès');
          this.loadEffects();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  addNewEffect(): void {
    console.log('Ajouter un nouvel effet');
    this.openEffectDialog();
  }

  private openEffectDetailsDialog(effect: Effect): void {
    const dialogRef = this.dialog.open(EffectDetailsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { effect: effect },
      disableClose: false
    });
  }

  private openEffectDialog(effect?: Effect): void {
    const dialogRef = this.dialog.open(EffectEditDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { effect: effect },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Données du dialog:', result);
        this.saveEffect(result);
      }
    });
  }

  private saveEffect(effectData: any): void {
    console.log('💾 Données reçues du dialog:', effectData);

    // Préparer les données avec les relations
    const effectRequest = {
      id: effectData.id,
      effectName: effectData.effectName,
      description: effectData.description,
      conditionCardIds: effectData.selectedConditions || [],
      actionIds: effectData.selectedActions || []
    };

    console.log('📤 Requête envoyée au serveur:', effectRequest);

    if (effectData.id) {
      // Modification d'un effet existant
      this.effectService.updateEffect(effectRequest).subscribe({
        next: (updatedEffect) => {
          console.log('✅ Effet modifié avec succès:', updatedEffect);
          console.log('🔍 Type de réponse:', typeof updatedEffect);
          console.log('🔍 Contenu de la réponse:', JSON.stringify(updatedEffect));
          this.loadEffects();
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la modification:', error);
        }
      });
    } else {
      // Création d'un nouvel effet
      this.effectService.createEffect(effectRequest).subscribe({
        next: (newEffect) => {
          console.log('✅ Effet créé avec succès:', newEffect);
          console.log('🔍 Relations dans la réponse de création:', {
            conditionCards: newEffect.conditionCards?.length || 0,
            actions: newEffect.actions?.length || 0
          });

          // Attendre un peu avant de recharger pour laisser le temps au serveur de traiter les relations
          setTimeout(() => {
            console.log('🔄 Rechargement des effets après création...');
            // Tester d'abord l'endpoint standard pour l'effet créé
            this.testEffectById(newEffect.id);
          this.loadEffects();
          }, 1000);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création:', error);
        }
      });
    }
  }
}

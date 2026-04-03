import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { EffectService, ConditionCardService, ActionCardService } from '../../../../core/services';
import { Effect, ConditionCard, ActionCard, getEffectConditionsForDisplay } from '../../../../core/models';

export interface EffectRelationsDialogData {
  effect: Effect;
}

@Component({
  selector: 'app-effect-relations-dialog',
  templateUrl: './effect-relations-dialog.component.html',
  styleUrls: ['./effect-relations-dialog.component.css'],
  standalone: false
})
export class EffectRelationsDialogComponent implements OnInit {
  effect: Effect;
  allConditions: ConditionCard[] = [];
  allActions: ActionCard[] = [];
  selectedConditionIds: number[] = [];
  selectedActionIds: number[] = [];
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<EffectRelationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EffectRelationsDialogData,
    private effectService: EffectService,
    private conditionCardService: ConditionCardService,
    private actionCardService: ActionCardService,
    private snackBar: MatSnackBar
  ) {
    this.effect = { ...data.effect };
  }

  ngOnInit(): void {
    this.loadAllConditions();
    this.loadAllActions();
    this.initializeSelectedItems();
  }

  private loadAllConditions(): void {
    this.conditionCardService.getAllConditions().subscribe({
      next: (conditions) => {
        this.allConditions = conditions;
        console.log('✅ Toutes les conditions chargées:', conditions);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des conditions:', error);
        this.snackBar.open('Erreur lors du chargement des conditions', 'Fermer', { duration: 3000 });
      }
    });
  }

  private loadAllActions(): void {
    this.actionCardService.getAllActions().subscribe({
      next: (actions) => {
        this.allActions = actions;
        console.log('✅ Toutes les actions chargées:', actions);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des actions:', error);
        this.snackBar.open('Erreur lors du chargement des actions', 'Fermer', { duration: 3000 });
      }
    });
  }

  private initializeSelectedItems(): void {
    // Initialiser les sélections avec les relations actuelles de l'effet
    this.selectedConditionIds = getEffectConditionsForDisplay(this.effect).map(c => c.id);
    this.selectedActionIds = this.effect.actions?.map(a => a.id) || [];
  }

  onConditionToggle(conditionId: number): void {
    const index = this.selectedConditionIds.indexOf(conditionId);
    if (index > -1) {
      this.selectedConditionIds.splice(index, 1);
    } else {
      this.selectedConditionIds.push(conditionId);
    }
  }

  onActionToggle(actionId: number): void {
    const index = this.selectedActionIds.indexOf(actionId);
    if (index > -1) {
      this.selectedActionIds.splice(index, 1);
    } else {
      this.selectedActionIds.push(actionId);
    }
  }

  isConditionSelected(conditionId: number): boolean {
    return this.selectedConditionIds.includes(conditionId);
  }

  isActionSelected(actionId: number): boolean {
    return this.selectedActionIds.includes(actionId);
  }

  onSave(): void {
    this.loading = true;

    console.log('💾 Sauvegarde des relations:', {
      effectId: this.effect.id,
      conditions: this.selectedConditionIds,
      actions: this.selectedActionIds
    });

    // Sauvegarder les conditions et actions en parallèle
    const conditionsObservable = this.effectService.replaceEffectConditions(this.effect.id, this.selectedConditionIds);
    const actionsObservable = this.effectService.replaceEffectActions(this.effect.id, this.selectedActionIds);

    // Utiliser forkJoin pour une meilleure gestion des Observables
    forkJoin([conditionsObservable, actionsObservable]).subscribe({
      next: (responses) => {
        console.log('✅ Relations sauvegardées avec succès:', responses);
        console.log('🔍 Réponse conditions:', responses[0]);
        console.log('🔍 Réponse actions:', responses[1]);

        // Vérifier si les réponses indiquent un succès
        const conditionsSuccess = responses[0] !== undefined;
        const actionsSuccess = responses[1] !== undefined;

        if (conditionsSuccess && actionsSuccess) {
          this.snackBar.open('Relations sauvegardées avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          console.warn('⚠️ Sauvegarde partielle ou incomplète');
          this.snackBar.open('Sauvegarde partielle - vérifiez les relations', 'Fermer', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors de la sauvegarde des relations:', error);
        console.error('🔍 Détails de l\'erreur:', {
          message: error.message,
          status: error.status,
          error: error.error
        });
        this.snackBar.open('Erreur lors de la sauvegarde des relations', 'Fermer', { duration: 3000 });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onAddCondition(conditionId: number): void {
    this.loading = true;
    this.effectService.addConditionToEffect(this.effect.id, conditionId).subscribe({
      next: () => {
        console.log(`✅ Condition ${conditionId} ajoutée à l'effet ${this.effect.id}`);
        this.selectedConditionIds.push(conditionId);
        this.snackBar.open('Condition ajoutée avec succès', 'Fermer', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'ajout de la condition:', error);
        this.snackBar.open('Erreur lors de l\'ajout de la condition', 'Fermer', { duration: 3000 });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onRemoveCondition(conditionId: number): void {
    this.loading = true;
    this.effectService.removeConditionFromEffect(this.effect.id, conditionId).subscribe({
      next: () => {
        console.log(`✅ Condition ${conditionId} supprimée de l'effet ${this.effect.id}`);
        const index = this.selectedConditionIds.indexOf(conditionId);
        if (index > -1) {
          this.selectedConditionIds.splice(index, 1);
        }
        this.snackBar.open('Condition supprimée avec succès', 'Fermer', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ Erreur lors de la suppression de la condition:', error);
        this.snackBar.open('Erreur lors de la suppression de la condition', 'Fermer', { duration: 3000 });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onAddAction(actionId: number): void {
    this.loading = true;
    this.effectService.addActionToEffect(this.effect.id, actionId).subscribe({
      next: () => {
        console.log(`✅ Action ${actionId} ajoutée à l'effet ${this.effect.id}`);
        this.selectedActionIds.push(actionId);
        this.snackBar.open('Action ajoutée avec succès', 'Fermer', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'ajout de l\'action:', error);
        this.snackBar.open('Erreur lors de l\'ajout de l\'action', 'Fermer', { duration: 3000 });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onRemoveAction(actionId: number): void {
    this.loading = true;
    this.effectService.removeActionFromEffect(this.effect.id, actionId).subscribe({
      next: () => {
        console.log(`✅ Action ${actionId} supprimée de l'effet ${this.effect.id}`);
        const index = this.selectedActionIds.indexOf(actionId);
        if (index > -1) {
          this.selectedActionIds.splice(index, 1);
        }
        this.snackBar.open('Action supprimée avec succès', 'Fermer', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ Erreur lors de la suppression de l\'action:', error);
        this.snackBar.open('Erreur lors de la suppression de l\'action', 'Fermer', { duration: 3000 });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

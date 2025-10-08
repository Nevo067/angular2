import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConditionCard, Effect, ActionCard } from '../../../../core/models';
import { EffectService, ActionCardService, ConditionCardService } from '../../../../core/services';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-condition-relations-dialog',
  templateUrl: './condition-relations-dialog.component.html',
  styleUrls: ['./condition-relations-dialog.component.css'],
  standalone: false
})
export class ConditionRelationsDialogComponent implements OnInit {
  condition: ConditionCard;
  allEffects: Effect[] = [];
  allActions: ActionCard[] = [];
  selectedEffectIds: number[] = [];
  selectedActionIds: number[] = [];
  loading = false;

  constructor(
    private dialogRef: MatDialogRef<ConditionRelationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { condition: ConditionCard },
    private effectService: EffectService,
    private actionCardService: ActionCardService,
    private conditionCardService: ConditionCardService,
    private snackBar: MatSnackBar
  ) {
    this.condition = data.condition;
  }

  ngOnInit(): void {
    this.loadAllEffects();
    this.loadAllActions();
    this.initializeSelectedItems();
  }

  private loadAllEffects(): void {
    this.effectService.getAllEffects().subscribe({
      next: (effects) => {
        console.log('✅ Tous les effets chargés:', effects);
        this.allEffects = effects;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des effets:', error);
      }
    });
  }

  private loadAllActions(): void {
    this.actionCardService.getAllActions().subscribe({
      next: (actions) => {
        console.log('✅ Toutes les actions chargées:', actions);
        this.allActions = actions;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des actions:', error);
      }
    });
  }

  private initializeSelectedItems(): void {
    // Initialiser les sélections basées sur les relations existantes
    this.selectedEffectIds = this.condition.effects?.map((effect: Effect) => effect.id) || [];
    this.selectedActionIds = this.condition.actions?.map((action: ActionCard) => action.id) || [];
  }

  onEffectToggle(effectId: number): void {
    const index = this.selectedEffectIds.indexOf(effectId);
    if (index > -1) {
      this.selectedEffectIds.splice(index, 1);
    } else {
      this.selectedEffectIds.push(effectId);
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

  isEffectSelected(effectId: number): boolean {
    return this.selectedEffectIds.includes(effectId);
  }

  isActionSelected(actionId: number): boolean {
    return this.selectedActionIds.includes(actionId);
  }

  onSave(): void {
    this.loading = true;

    console.log('💾 Sauvegarde des relations de la condition:', {
      conditionId: this.condition.id,
      effects: this.selectedEffectIds,
      actions: this.selectedActionIds
    });

    // Sauvegarder les actions de la condition avec le nouvel endpoint
    this.conditionCardService.replaceConditionActions(this.condition.id, this.selectedActionIds).subscribe({
      next: (response) => {
        console.log('✅ Actions de la condition sauvegardées avec succès:', response);
        this.snackBar.open('Relations de la condition sauvegardées avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de la sauvegarde des relations de la condition:', error);
        console.error('🔍 Détails de l\'erreur:', {
          message: error.message,
          status: error.status,
          error: error.error
        });
        this.snackBar.open('Erreur lors de la sauvegarde des relations', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

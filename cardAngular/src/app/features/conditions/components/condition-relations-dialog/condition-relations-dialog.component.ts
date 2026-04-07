import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConditionCard, Effect, ActionCard, getEffectConditionsForDisplay } from '../../../../core/models';
import { EffectService, ActionCardService, ConditionCardService } from '../../../../core/services';
import { forkJoin, of, lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  /** False jusqu’au chargement des listes (évite une sauvegarde avec sélection effets vide). */
  listsReady = false;

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
    forkJoin({
      effects: this.effectService.getAllEffects().pipe(catchError(() => of([] as Effect[]))),
      actions: this.actionCardService.getAllActions().pipe(catchError(() => of([] as ActionCard[])))
    }).subscribe({
      next: ({ effects, actions }) => {
        this.allEffects = effects;
        this.allActions = actions;
        this.initializeSelections();
        this.listsReady = true;
      },
      error: (error: unknown) => {
        console.error('❌ Erreur lors du chargement des listes (effets / actions):', error);
        this.snackBar.open('Impossible de charger effets ou actions', 'Fermer', { duration: 4000 });
      }
    });
  }

  /** Actions depuis la condition ; effets en dérivant de la liste (souvent absent sur `condition.effects`). */
  private initializeSelections(): void {
    const cid = this.condition.id;
    this.selectedActionIds = this.condition.actions?.map((a: ActionCard) => a.id) || [];
    this.selectedEffectIds = this.allEffects
      .filter(e => getEffectConditionsForDisplay(e).some(c => c.id === cid))
      .map(e => e.id);
  }

  private effectCurrentlyHasCondition(effect: Effect, conditionId: number): boolean {
    return getEffectConditionsForDisplay(effect).some(c => c.id === conditionId);
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
    if (!this.listsReady) {
      return;
    }
    this.loading = true;
    const conditionId = this.condition.id;
    const desiredEffects = new Set(this.selectedEffectIds);

    const currentlyLinkedEffectIds = new Set(
      this.allEffects.filter(e => this.effectCurrentlyHasCondition(e, conditionId)).map(e => e.id)
    );

    const toAdd = [...desiredEffects].filter(id => !currentlyLinkedEffectIds.has(id));
    const toRemove = [...currentlyLinkedEffectIds].filter(id => !desiredEffects.has(id));

    void this.persistRelations(conditionId, toAdd, toRemove).catch((error: unknown) => {
      console.error('❌ Erreur lors de la sauvegarde des relations:', error);
      this.snackBar.open('Erreur lors de la sauvegarde des relations', 'Fermer', { duration: 4000 });
      this.loading = false;
    });
  }

  private async persistRelations(
    conditionId: number,
    toAdd: number[],
    toRemove: number[]
  ): Promise<void> {
    try {
      for (const effectId of toAdd) {
        await lastValueFrom(this.effectService.addConditionToEffect(effectId, conditionId));
      }
      for (const effectId of toRemove) {
        await lastValueFrom(this.effectService.removeConditionFromEffect(effectId, conditionId));
      }
      await lastValueFrom(
        this.conditionCardService.replaceConditionActions(conditionId, this.selectedActionIds)
      );
      this.snackBar.open('Relations (effets + actions) enregistrées', 'Fermer', { duration: 3000 });
      this.dialogRef.close(true);
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

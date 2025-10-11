import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CardService, EffectService } from '../../../../core/services';
import { Card, Effect } from '../../../../core/models';

export interface CardRelationsDialogData {
  card: Card;
}

@Component({
  selector: 'app-card-relations-dialog',
  templateUrl: './card-relations-dialog.component.html',
  styleUrls: ['./card-relations-dialog.component.css'],
  standalone: false
})
export class CardRelationsDialogComponent implements OnInit {
  card: Card;
  allEffects: Effect[] = [];
  selectedEffectIds: number[] = [];
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<CardRelationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CardRelationsDialogData,
    private cardService: CardService,
    private effectService: EffectService,
    private snackBar: MatSnackBar
  ) {
    this.card = { ...data.card };
  }

  ngOnInit(): void {
    this.loadAllEffects();
    this.initializeSelectedEffects();
  }

  private loadAllEffects(): void {
    this.loading = true;
    this.effectService.getAllEffects().subscribe({
      next: (effects) => {
        this.allEffects = effects;
        console.log('✅ Tous les effets chargés:', effects);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des effets:', error);
        this.snackBar.open('Erreur lors du chargement des effets', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private initializeSelectedEffects(): void {
    // Initialiser les sélections avec les effets actuels de la carte
    this.selectedEffectIds = this.card.effects?.map(e => e.id) || [];
    console.log('📋 Effets actuellement associés à la carte:', this.selectedEffectIds);
  }

  onEffectToggle(effectId: number): void {
    const index = this.selectedEffectIds.indexOf(effectId);
    if (index > -1) {
      this.selectedEffectIds.splice(index, 1);
      console.log(`❌ Effet ${effectId} retiré. Liste actuelle:`, this.selectedEffectIds);
    } else {
      this.selectedEffectIds.push(effectId);
      console.log(`✅ Effet ${effectId} ajouté. Liste actuelle:`, this.selectedEffectIds);
    }
  }

  isEffectSelected(effectId: number): boolean {
    return this.selectedEffectIds.includes(effectId);
  }

  getEffectConditionsCount(effect: Effect): number {
    return effect.conditionCards?.length || 0;
  }

  getEffectActionsCount(effect: Effect): number {
    return effect.actions?.length || 0;
  }

  onSave(): void {
    this.loading = true;

    console.log('💾 Sauvegarde des relations carte-effets:', {
      cardId: this.card.id,
      effects: this.selectedEffectIds
    });

    this.cardService.replaceCardEffects(this.card.id, this.selectedEffectIds).subscribe({
      next: (updatedCard) => {
        console.log('✅ Relations sauvegardées avec succès:', updatedCard);
        this.snackBar.open(
          `${this.selectedEffectIds.length} effet(s) associé(s) à la carte`,
          'Fermer',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la sauvegarde des relations:', error);
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

  onAddEffect(effectId: number): void {
    this.loading = true;
    this.cardService.addEffectToCard(this.card.id, effectId).subscribe({
      next: () => {
        console.log(`✅ Effet ${effectId} ajouté à la carte ${this.card.id}`);
        this.selectedEffectIds.push(effectId);
        this.snackBar.open('Effet ajouté avec succès', 'Fermer', { duration: 2000 });
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'ajout de l\'effet:', error);
        this.snackBar.open('Erreur lors de l\'ajout de l\'effet', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onRemoveEffect(effectId: number): void {
    this.loading = true;
    this.cardService.removeEffectFromCard(this.card.id, effectId).subscribe({
      next: () => {
        console.log(`✅ Effet ${effectId} supprimé de la carte ${this.card.id}`);
        const index = this.selectedEffectIds.indexOf(effectId);
        if (index > -1) {
          this.selectedEffectIds.splice(index, 1);
        }
        this.snackBar.open('Effet supprimé avec succès', 'Fermer', { duration: 2000 });
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de la suppression de l\'effet:', error);
        this.snackBar.open('Erreur lors de la suppression de l\'effet', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}


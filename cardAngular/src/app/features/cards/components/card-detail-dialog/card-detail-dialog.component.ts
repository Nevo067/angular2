import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Card, ActionCard, ConditionCard } from '../../../../core/models';
import { CardType, MonsterType, ElementType } from '../../../../core/enums';
import { ActionCardService, ConditionCardService } from '../../../../core/services';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-card-detail-dialog',
  templateUrl: './card-detail-dialog.component.html',
  styleUrls: ['./card-detail-dialog.component.css'],
  standalone: false
})
export class CardDetailDialogComponent implements OnInit {
  card: Card;
  actions: ActionCard[] = [];
  conditions: ConditionCard[] = [];
  loading = false;

  // Labels pour les enums
  monsterTypeLabels: Record<MonsterType, string> = {
    [MonsterType.BEAST]: 'Bête',
    [MonsterType.DRAGON]: 'Dragon',
    [MonsterType.UNDEAD]: 'Mort-vivant',
    [MonsterType.WARRIOR]: 'Guerrier',
    [MonsterType.SPELLCASTER]: 'Mage'
  };

  elementTypeLabels: Record<ElementType, string> = {
    [ElementType.FIRE]: 'Feu',
    [ElementType.WATER]: 'Eau',
    [ElementType.EARTH]: 'Terre',
    [ElementType.AIR]: 'Air',
    [ElementType.LIGHT]: 'Lumière',
    [ElementType.DARK]: 'Ténèbres',
    [ElementType.LIGHTNING]: 'Foudre',
    [ElementType.ICE]: 'Glace'
  };

  cardTypeLabels: Record<CardType, string> = {
    [CardType.MONSTRE]: 'Monstre',
    [CardType.MAGIC]: 'Magic'
  };

  constructor(
    public dialogRef: MatDialogRef<CardDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { card: Card },
    private actionCardService: ActionCardService,
    private conditionCardService: ConditionCardService
  ) {
    this.card = data.card;
  }

  ngOnInit(): void {
    this.loadCardDetails();
  }

  private loadCardDetails(): void {
    if (!this.card?.id) {
      return;
    }

    this.loading = true;

    // Charger les actions et conditions associées à la carte
    forkJoin({
      actions: this.actionCardService.getActionsByCardId(this.card.id),
      conditions: this.conditionCardService.getConditionsByCardId(this.card.id)
    }).subscribe({
      next: (result) => {
        this.actions = result.actions || [];
        this.conditions = result.conditions || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails:', error);
        this.loading = false;
        // En cas d'erreur, on continue quand même avec les données de base
      }
    });
  }

  getMonsterTypeLabel(type: MonsterType): string {
    return this.monsterTypeLabels[type] || type;
  }

  getElementTypeLabel(type: ElementType): string {
    return this.elementTypeLabels[type] || type;
  }

  getCardTypeLabel(type: CardType): string {
    return this.cardTypeLabels[type] || type;
  }

  get isMonsterCard(): boolean {
    return this.card?.cardType === CardType.MONSTRE;
  }

  get tagsAsString(): string {
    if (!this.card?.tags) {
      return 'Aucun tag';
    }
    if (Array.isArray(this.card.tags)) {
      return this.card.tags.length > 0 ? this.card.tags.join(', ') : 'Aucun tag';
    }
    return String(this.card.tags) || 'Aucun tag';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}


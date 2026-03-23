import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardService, ActionCardService, ConditionCardService, ConditionParameterService, EffectParameterService } from '../../../../core/services';
import { Card, Effect, ActionCard, ParameterDefinitionDTO } from '../../../../core/models';
import { MonsterType, ElementType, CardType, CardTypeLabels } from '../../../../core/enums';
import { DataTableComponent } from '../../../../shared/components';
import { TableConfig, TableAction } from '../../../../shared/models';
import { CardEditDialogComponent } from '../card-edit-dialog/card-edit-dialog.component';
import { CardRelationsDialogComponent } from '../card-relations-dialog/card-relations-dialog.component';
import { CardDetailDialogComponent } from '../card-detail-dialog/card-detail-dialog.component';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.css'],
  standalone: false
})
export class CardListComponent implements OnInit {
  cards$: Observable<Card[]> = new Observable();
  cards: Card[] = [];
  loading = false;
  exporting = false;

  tableConfig: TableConfig<Card> = {
    columns: [
      {
        key: 'imageUrl',
        label: 'Image',
        type: 'image',
        sortable: false,
        width: '180px'
      },
      {
        key: 'id',
        label: 'ID',
        type: 'number',
        sortable: true,
        width: '80px'
      },
      {
        key: 'name',
        label: 'Nom',
        type: 'text',
        sortable: true,
        filterable: true
      },
      {
        key: 'cardType',
        label: 'Type de carte',
        type: 'chip',
        sortable: true,
        chipConfig: {
          color: 'primary',
          textColor: 'white'
        },
        formatter: (value: CardType) => CardTypeLabels[value as CardType] || value
      },
      {
        key: 'monsterType',
        label: 'Type de Monstre',
        type: 'chip',
        sortable: true,
        chipConfig: {
          color: 'primary',
          textColor: 'white'
        },
        formatter: (value: MonsterType) => {
          const labels: Record<MonsterType, string> = {
            [MonsterType.BEAST]: 'Bête',
            [MonsterType.DRAGON]: 'Dragon',
            [MonsterType.UNDEAD]: 'Mort-vivant',
            [MonsterType.WARRIOR]: 'Guerrier',
            [MonsterType.SPELLCASTER]: 'Mage'
          };
          return labels[value] || value;
        }
      },
      {
        key: 'elementType',
        label: 'Type d\'Élément',
        type: 'chip',
        sortable: true,
        chipConfig: {
          color: 'accent',
          textColor: 'white'
        },
        formatter: (value: ElementType) => {
          const labels: Record<ElementType, string> = {
            [ElementType.FIRE]: 'Feu',
            [ElementType.WATER]: 'Eau',
            [ElementType.EARTH]: 'Terre',
            [ElementType.AIR]: 'Air',
            [ElementType.LIGHT]: 'Lumière',
            [ElementType.DARK]: 'Ténèbres',
            [ElementType.LIGHTNING]: 'Foudre',
            [ElementType.ICE]: 'Glace'
          };
          return labels[value] || value;
        }
      },
      {
        key: 'attackPoints',
        label: 'Points d\'Attaque',
        type: 'number',
        sortable: true,
        align: 'center'
      },
      {
        key: 'defensePoints',
        label: 'Points de Défense',
        type: 'number',
        sortable: true,
        align: 'center'
      },
      {
        key: 'hitPoints',
        label: 'PV',
        type: 'number',
        sortable: true,
        align: 'center',
        formatter: (value: number | null | undefined) => value == null ? '-' : String(value)
      },
      {
        key: 'level',
        label: 'Level',
        type: 'text',
        sortable: true,
        align: 'center',
        formatter: (value: number | null | undefined, row: Card) => row.cardType === CardType.MONSTRE && value != null ? String(value) : '-'
      },
      {
        key: 'manaValue',
        label: 'Mana',
        type: 'text',
        sortable: true,
        align: 'center',
        formatter: (value: number | null | undefined, row: Card) => {
          if (value == null) {
            return '-';
          }
          if (row.cardType === CardType.MONSTRE) {
            return `Coût ${value}`;
          }
          if (row.cardType === CardType.MAGIC) {
            return `Coût ${value}`;
          }
          if (row.cardType === CardType.MANA) {
            return `Valeur ${value}`;
          }
          return '-';
        }
      }
    ],
    actions: [
      {
        key: 'relations',
        label: 'Gérer les effets',
        icon: 'link',
        color: 'accent',
        tooltip: 'Gérer les relations avec les effets'
      },
      {
        key: 'edit',
        label: 'Modifier',
        icon: 'edit_note',
        color: 'primary',
        tooltip: 'Modifier la carte'
      },
      {
        key: 'delete',
        label: 'Supprimer',
        icon: 'delete_forever',
        color: 'warn',
        tooltip: 'Supprimer la carte'
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
    emptyMessage: 'Aucune carte trouvée'
  };

  constructor(
    private cardService: CardService,
    private actionCardService: ActionCardService,
    private conditionCardService: ConditionCardService,
    private conditionParameterService: ConditionParameterService,
    private effectParameterService: EffectParameterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCards();
  }

  loadCards(): void {
    console.log('🔄 Chargement des cartes...');
    this.loading = true;
    // Ajouter un timestamp pour éviter le cache
    const timestamp = new Date().getTime();
    this.cards$ = this.cardService.getAllCards({ _t: timestamp } as any);

    // Gérer l'état de chargement
    this.cards$.subscribe({
      next: (cards) => {
        console.log('✅ Cartes chargées:', cards);
        console.log('🔍 Détail des URLs d\'images:');
        cards.forEach((card, index) => {
          console.log(`  Carte ${index + 1} (ID: ${card.id}):`, {
            name: card.name,
            imageUrl: card.imageUrl,
            imageUrlType: typeof card.imageUrl,
            imageUrlLength: card.imageUrl?.length
          });
        });
        this.loading = false;
        // Mettre à jour les données du tableau
        this.updateTableData(cards);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des cartes:', error);
        this.loading = false;
      }
    });
  }

  private updateTableData(cards: Card[]): void {
    console.log('📊 Mise à jour des données du tableau:', cards);
    this.cards = cards;
  }

  onActionClick(event: { action: string; row: Card; index: number }): void {
    const { action, row } = event;

    switch (action) {
      case 'relations':
        this.openCardRelationsDialog(row);
        break;
      case 'edit':
        this.editCard(row);
        break;
      case 'delete':
        this.deleteCard(row);
        break;
    }
  }

  onRowClick(card: Card): void {
    console.log('Carte sélectionnée:', card);
    // Ouvrir le dialogue de détail de la carte
    this.openCardDetailDialog(card);
  }

  private openCardDetailDialog(card: Card): void {
    this.dialog.open(CardDetailDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { card: card },
      disableClose: false
    });
  }

  exportCardsToJson(): void {
    this.exporting = true;
    this.snackBar.open('Export en cours...', 'Fermer', { duration: 2000 });

    // Récupérer toutes les cartes et toutes les actions avec paramètres en parallèle
    forkJoin({
      cards: this.cardService.getAllCards(),
      actionsWithParameters: this.actionCardService.getAllActionsWithParameters()
    }).subscribe({
      next: ({ cards, actionsWithParameters }) => {
        // Créer une Map actionId -> ActionCard avec paramètres
        const actionsMap = new Map<number, ActionCard>();
        actionsWithParameters.forEach(action => {
          if (action.id) {
            actionsMap.set(action.id, action);
          }
        });

        // Récupérer les paramètres des conditions et des effets en parallèle
        Promise.all([
          this.loadConditionParameters(cards),
          this.loadEffectParameters(cards)
        ]).then(([conditionParamsMap, effectParamsMap]) => {
          // Transformer les cartes au format d'export avec les paramètres
          const exportData = {
            exportVersion: '1.2',
            exportDate: new Date().toISOString(),
            cards: cards.map(card => this.transformCardForExport(card, actionsMap, conditionParamsMap, effectParamsMap))
          };

          // Créer le fichier JSON et le télécharger
          this.downloadJsonFile(exportData, 'cartes_export');
          this.exporting = false;
          this.snackBar.open(`Export réussi ! ${cards.length} carte(s) exportée(s)`, 'Fermer', { duration: 3000 });
        }).catch(error => {
          console.error('Erreur lors du chargement des paramètres:', error);
          this.exporting = false;
          this.snackBar.open('Erreur lors de l\'export des cartes', 'Fermer', { duration: 3000 });
        });
      },
      error: (error) => {
        console.error('Erreur lors de l\'export:', error);
        this.exporting = false;
        this.snackBar.open('Erreur lors de l\'export des cartes', 'Fermer', { duration: 3000 });
      }
    });
  }

  private async loadConditionParameters(cards: Card[]): Promise<Map<number, any[]>> {
    const conditionParamsMap = new Map<number, any[]>();
    
    // Collecter tous les IDs de conditions uniques
    const conditionIds = new Set<number>();
    cards.forEach(card => {
      card.effects?.forEach(effect => {
        effect.conditionCards?.forEach(condition => {
          if (condition.id) {
            conditionIds.add(condition.id);
          }
        });
      });
    });

    // Charger les paramètres pour chaque condition
    const loadPromises = Array.from(conditionIds).map(conditionId => 
      this.conditionParameterService.list(conditionId).toPromise().then(
        params => {
          if (params) {
            conditionParamsMap.set(conditionId, params);
          }
          return null;
        }
      ).catch(() => null)
    );

    await Promise.all(loadPromises);
    return conditionParamsMap;
  }

  private async loadEffectParameters(cards: Card[]): Promise<Map<string, any[]>> {
    const effectParamsMap = new Map<string, any[]>();
    
    // Collecter toutes les combinaisons effectId-actionId uniques
    const effectActionPairs = new Set<string>();
    cards.forEach(card => {
      card.effects?.forEach(effect => {
        if (effect.id) {
          effect.actions?.forEach(action => {
            if (action.id) {
              const key = `${effect.id}-${action.id}`;
              effectActionPairs.add(key);
            }
          });
        }
      });
    });

    // Charger les paramètres pour chaque combinaison effet/action
    const loadPromises = Array.from(effectActionPairs).map(key => {
      const [effectIdStr, actionIdStr] = key.split('-');
      const effectId = Number(effectIdStr);
      const actionId = Number(actionIdStr);
      
      return this.effectParameterService.list(effectId, actionId).toPromise().then(
        params => {
          if (params && params.length > 0) {
            effectParamsMap.set(key, params);
          }
          return null;
        }
      ).catch(() => null);
    });

    await Promise.all(loadPromises);
    return effectParamsMap;
  }

  private transformCardForExport(card: Card, actionsMap: Map<number, ActionCard>, conditionParamsMap: Map<number, any[]>, effectParamsMap: Map<string, any[]>): any {
    return {
      id: card.id,
      name: card.name,
      cardType: card.cardType ?? null,
      monsterType: card.monsterType || '',
      elementType: card.elementType || '',
      tags: card.tags || [],
      attackPoints: card.attackPoints ?? 0,
      defensePoints: card.defensePoints ?? 0,
      hitPoints: card.hitPoints ?? null,
      level: card.level ?? null,
      manaValue: card.manaValue ?? null,
      manaValueRole: (card.cardType === CardType.MONSTRE || card.cardType === CardType.MAGIC) ? 'COST' : (card.cardType === CardType.MANA ? 'VALUE' : null),
      effects: (card.effects || []).map(effect => this.transformEffectForExport(effect, actionsMap, conditionParamsMap, effectParamsMap)),
      imageUrl: card.imageUrl || ''
    };
  }

  private transformEffectForExport(effect: Effect, actionsMap: Map<number, ActionCard>, conditionParamsMap: Map<number, any[]>, effectParamsMap: Map<string, any[]>): any {
    // Collecter tous les paramètres d'effet pour cet effet
    const effectParametersByAction: any = {};
    if (effect.actions) {
      effect.actions.forEach(action => {
        if (action.id) {
          const effectParamsKey = `${effect.id}-${action.id}`;
          const effectParameters = effectParamsMap.get(effectParamsKey) || [];
          if (effectParameters.length > 0) {
            effectParametersByAction[action.id] = effectParameters.map((param: any) => ({
              parameterDefinitionCode: param.parameterDefinitionCode,
              valueString: param.valueString ?? null,
              valueNumber: param.valueNumber ?? null,
              enumOptionCode: param.enumOptionCode ?? null
            }));
          }
        }
      });
    }

    const effectData: any = {
      id: effect.id,
      effectName: effect.effectName || '',
      description: effect.description || '',
      conditionCards: (effect.conditionCards || []).map(condition => {
        const conditionParams = conditionParamsMap.get(condition.id || 0) || [];
        
        const conditionData: any = {
          id: condition.id,
          nameCondition: condition.nameCondition || '',
          description: condition.description || ''
        };
        
        // Ajouter les paramètres seulement s'il y en a
        if (conditionParams.length > 0) {
          conditionData.parameters = conditionParams.map((param: any) => ({
            parameterDefinitionCode: param.parameterDefinitionCode,
            valueString: param.valueString ?? null,
            valueNumber: param.valueNumber ?? null,
            enumOptionCode: param.enumOptionCode ?? null
          }));
        }
        
        return conditionData;
      }),
      actions: (effect.actions || []).map(action => {
        // Récupérer l'action avec paramètres depuis la Map
        const actionWithParameters = actionsMap.get(action.id);
        const parameters = actionWithParameters?.parameters || [];
        
        const actionData: any = {
          id: action.id,
          actionName: action.actionName || '',
          description: action.description || ''
        };
        
        // Ajouter les paramètres d'action généraux seulement s'il y en a
        if (parameters.length > 0) {
          actionData.parameters = parameters.map(param => ({
            parameterDefinitionCode: param.parameterDefinitionCode,
            valueString: param.valueString ?? null,
            valueNumber: param.valueNumber ?? null,
            enumOptionCode: param.enumOptionCode ?? null
          }));
        }
        
        return actionData;
      })
    };

    // Ajouter les paramètres d'effet au niveau de l'effet seulement s'il y en a
    if (Object.keys(effectParametersByAction).length > 0) {
      effectData.effectParameters = effectParametersByAction;
    }

    return effectData;
  }

  private downloadJsonFile(data: any, filename: string): void {
    // Créer le JSON avec indentation pour la lisibilité
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Créer un élément <a> temporaire pour déclencher le téléchargement
    const link = document.createElement('a');
    link.href = url;
    
    // Générer un nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `${filename}_${timestamp}.json`;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onSelectionChange(selectedCards: Card[]): void {
    console.log('Cartes sélectionnées:', selectedCards);
  }

  onPageChange(event: any): void {
    console.log('Changement de page:', event);
  }

  onSortChange(event: any): void {
    console.log('Changement de tri:', event);
  }

  private editCard(card: Card): void {
    console.log('Modifier la carte:', card);
    this.openCardDialog(card);
  }

  private deleteCard(card: Card): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la carte "${card.name}" ?`)) {
      this.cardService.deleteCard(card.id).subscribe({
        next: () => {
          console.log('Carte supprimée avec succès');
          this.loadCards();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  addNewCard(): void {
    console.log('Ajouter une nouvelle carte');
    this.openCardDialog();
  }

  private openCardDialog(card?: Card): void {
    const dialogRef = this.dialog.open(CardEditDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { card: card },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Données du dialog:', result);
        this.saveCard(result);
      }
    });
  }

  openCardRelationsDialog(card: Card): void {
    console.log('Ouvrir le dialogue de relations pour la carte:', card);
    const dialogRef = this.dialog.open(CardRelationsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { card: card },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Relations mises à jour, rechargement de la liste');
        this.loadCards();
      }
    });
  }

  private saveCard(dialogResult: any): void {
    const { card, actions, conditions, images, skipUpdate } = dialogResult;

    console.log('📥 Données reçues du dialogue:', dialogResult);
    console.log('📦 Objet carte:', card);
    console.log('🎯 Effets dans la carte:', card.effects);
    console.log('🚫 Skip update?:', skipUpdate);

    // Si skipUpdate est true, la carte a déjà été créée avec l'image et les effets
    if (skipUpdate) {
      console.log('✅ Carte déjà créée, rechargement de la liste');
      this.loadCards();
      return;
    }

    if (card.id) {
      // Modification d'une carte existante
      this.cardService.updateCard(card).subscribe({
        next: (updatedCard) => {
          console.log('Carte modifiée avec succès:', updatedCard);

          // Sauvegarder les actions et conditions séparément
          // loadCards() sera appelé dans saveActionsAndConditions après que tout soit terminé
          this.saveActionsAndConditions(card.id, actions, conditions);

          // Sauvegarder les images
          this.saveImages(card.id, images);

          // Si pas d'actions/conditions, recharger immédiatement
          if ((!actions || actions.length === 0) && (!conditions || conditions.length === 0)) {
            this.loadCards();
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de la modification:', error);
        }
      });
    } else {
      // Création d'une nouvelle carte
      this.cardService.createCard(card).subscribe({
        next: (newCard) => {
          console.log('Carte créée avec succès:', newCard);

          // Sauvegarder les actions et conditions avec l'ID de la nouvelle carte
          this.saveActionsAndConditions(newCard.id, actions, conditions);

          // Sauvegarder les images
          this.saveImages(newCard.id, images);
        },
        error: (error: any) => {
          console.error('Erreur lors de la création:', error);
        }
      });
    }
  }

  private saveActionsAndConditions(cardId: number, actions: any[], conditions: any[]): void {
    console.log('💾 Sauvegarde des actions et conditions pour la carte:', cardId);

    // D'abord gérer les suppressions
    this.handleDeletedItems(cardId, actions, conditions).then(() => {
      // Ensuite sauvegarder les actions
      this.saveActions(cardId, actions).then(() => {
        // Enfin sauvegarder les conditions
        this.saveConditions(cardId, conditions).then(() => {
          console.log('✅ Actions et conditions sauvegardées avec succès');
          this.loadCards();
        }).catch(error => {
          console.error('❌ Erreur lors de la sauvegarde des conditions:', error);
        });
      }).catch(error => {
        console.error('❌ Erreur lors de la sauvegarde des actions:', error);
      });
    }).catch(error => {
      console.error('❌ Erreur lors de la gestion des suppressions:', error);
    });
  }

  private async handleDeletedItems(cardId: number, currentActions: any[], currentConditions: any[]): Promise<void> {
    // TODO: Implémenter la gestion des suppressions quand les endpoints seront disponibles
    console.log('⚠️ Gestion des suppressions désactivée - endpoints non disponibles');
    console.log('Card ID:', cardId, 'Actions:', currentActions, 'Conditions:', currentConditions);
  }

  private saveImages(cardId: number, images: any[]): void {
    if (!images || images.length === 0) {
      console.log('📷 Aucune image à sauvegarder pour la carte', cardId);
      return;
    }

    console.log('📷 Images associées à la carte', cardId, ':', images);

    // Les images sont déjà uploadées et leurs URLs sont disponibles
    // L'image principale est déjà utilisée dans le champ imageUrl de la carte
    images.forEach((image, index) => {
      console.log(`📷 Image ${index + 1} pour la carte ${cardId}:`, {
        fileName: image.fileName,
        url: image.url,
        isPrimary: index === 0
      });
    });

    // TODO: Si vous voulez sauvegarder toutes les images (pas seulement la première),
    // il faudrait créer un endpoint API pour associer plusieurs images à une carte
    // ou modifier le modèle Card pour inclure un tableau d'images
  }

  private async saveActions(cardId: number, actions: any[]): Promise<void> {
    if (!actions || actions.length === 0) {
      console.log('📝 Aucune action à sauvegarder');
      return;
    }

    const promises = actions.map(action => {
      const actionData = {
        ...action,
        cardId: cardId
      };

      if (action.id) {
        // Modification d'une action existante
        console.log('📝 Modification de l\'action:', action.id);
        return this.actionCardService.updateAction(actionData).toPromise();
      } else {
        // Création d'une nouvelle action
        console.log('➕ Création d\'une nouvelle action');
        return this.actionCardService.createAction(actionData).toPromise();
      }
    });

    try {
      await Promise.all(promises);
      console.log('✅ Toutes les actions sauvegardées');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des actions:', error);
      throw error; // Re-throw pour arrêter le processus en cas d'erreur
    }
  }

  private async saveConditions(cardId: number, conditions: any[]): Promise<void> {
    if (!conditions || conditions.length === 0) {
      console.log('📝 Aucune condition à sauvegarder');
      return;
    }

    const promises = conditions.map(condition => {
      const conditionData = {
        ...condition,
        cardId: cardId
      };

      if (condition.id) {
        // Modification d'une condition existante
        console.log('📝 Modification de la condition:', condition.id);
        return this.conditionCardService.updateCondition(conditionData).toPromise();
      } else {
        // Création d'une nouvelle condition
        console.log('➕ Création d\'une nouvelle condition');
        return this.conditionCardService.createCondition(conditionData).toPromise();
      }
    });

    try {
      await Promise.all(promises);
      console.log('✅ Toutes les conditions sauvegardées');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des conditions:', error);
      throw error; // Re-throw pour arrêter le processus en cas d'erreur
    }
  }
}

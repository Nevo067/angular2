/**
 * Énumération des types de cartes
 */
export enum CardType {
  MONSTRE = 'MONSTRE',
  MAGIC = 'MAGIC',
  MANA = 'MANA'
}

/**
 * Labels des types de cartes en français
 */
export const CardTypeLabels: Record<CardType, string> = {
  [CardType.MONSTRE]: 'Monstre',
  [CardType.MAGIC]: 'Magic',
  [CardType.MANA]: 'Mana'
};


/**
 * Énumération des types de cartes
 */
export enum CardType {
  MONSTRE = 'MONSTRE',
  MAGIC = 'MAGIC'
}

/**
 * Labels des types de cartes en français
 */
export const CardTypeLabels: Record<CardType, string> = {
  [CardType.MONSTRE]: 'Monstre',
  [CardType.MAGIC]: 'Magic'
};


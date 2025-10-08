/**
 * Énumération des types d'éléments pour les cartes
 */
export enum ElementType {
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  AIR = 'AIR',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  LIGHTNING = 'LIGHTNING',
  ICE = 'ICE'
}

/**
 * Labels des types d'éléments en français
 */
export const ElementTypeLabels: Record<ElementType, string> = {
  [ElementType.FIRE]: 'Feu',
  [ElementType.WATER]: 'Eau',
  [ElementType.EARTH]: 'Terre',
  [ElementType.AIR]: 'Air',
  [ElementType.LIGHT]: 'Lumière',
  [ElementType.DARK]: 'Ténèbres',
  [ElementType.LIGHTNING]: 'Foudre',
  [ElementType.ICE]: 'Glace'
};

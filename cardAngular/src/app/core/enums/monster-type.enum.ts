/**
 * Énumération des types de monstres pour les cartes
 */
export enum MonsterType {
  BEAST = 'BEAST',
  DRAGON = 'DRAGON',
  UNDEAD = 'UNDEAD',
  WARRIOR = 'WARRIOR',
  SPELLCASTER = 'SPELLCASTER'
}

/**
 * Labels des types de monstres en français
 */
export const MonsterTypeLabels: Record<MonsterType, string> = {
  [MonsterType.BEAST]: 'Bête',
  [MonsterType.DRAGON]: 'Dragon',
  [MonsterType.UNDEAD]: 'Mort-vivant',
  [MonsterType.WARRIOR]: 'Guerrier',
  [MonsterType.SPELLCASTER]: 'Mage'
};

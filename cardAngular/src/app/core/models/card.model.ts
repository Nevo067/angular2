import { CardType } from '../enums/card-type.enum';
import { ElementType } from '../enums/element-type.enum';
import { MonsterType } from '../enums/monster-type.enum';
import { Effect } from './effect.model';

/**
 * Modèle principal pour les cartes
 */
export interface Card {
  id: number;
  name: string;
  monsterType: MonsterType;
  elementType: ElementType;
  cardType: CardType;
  tags: string[];
  attackPoints: number;
  defensePoints: number;
  imageUrl: string;
  effects: Effect[];
}

/**
 * Modèle pour créer une nouvelle carte
 */
export interface CreateCardRequest {
  name: string;
  monsterType: MonsterType;
  elementType: ElementType;
  cardType: CardType;
  tags: string[];
  attackPoints: number;
  defensePoints: number;
  imageUrl?: string;
  effects?: { id: number }[];
}

/**
 * Modèle pour mettre à jour une carte
 */
export interface UpdateCardRequest {
  id: number;
  name: string;
  monsterType: MonsterType;
  elementType: ElementType;
  cardType: CardType;
  tags: string[];
  attackPoints: number;
  defensePoints: number;
  imageUrl?: string;
  effects?: { id: number }[];
}

/**
 * Modèle pour ajouter un effet à une carte
 */
export interface AddEffectToCardRequest {
  cardId: number;
  effectId: number;
}

/**
 * Modèle pour créer une carte avec image en une seule opération
 */
export interface CreateCardWithImageRequest {
  name: string;
  elementType: ElementType;
  cardType: CardType;
  tags: string[];
  image: File;
  imageName: string;
  effects?: { id: number }[];
  // Ces champs sont optionnels et seulement pour les cartes Monstre
  monsterType?: MonsterType;
  attackPoints?: number;
  defensePoints?: number;
}

/**
 * Réponse de création de carte avec image
 */
export interface CreateCardWithImageResponse {
  card: Card;
  message: string;
}

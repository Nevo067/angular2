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
  monsterType: MonsterType;
  elementType: ElementType;
  attackPoints: number;
  defensePoints: number;
  tags: string[];
  image: File;
  imageName: string;
  effects?: { id: number }[];
}

/**
 * Réponse de création de carte avec image
 */
export interface CreateCardWithImageResponse {
  card: Card;
  message: string;
}

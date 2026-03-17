import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import {
  Card,
  CreateCardRequest,
  UpdateCardRequest,
  AddEffectToCardRequest,
  CreateCardWithImageRequest,
  CreateCardWithImageResponse,
  PaginationParams,
  SearchFilters
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class CardService extends BaseApiService {
  private readonly endpoint = '/Card';

  /**
   * Récupère toutes les cartes
   */
  getAllCards(paginationParams?: PaginationParams, filters?: SearchFilters): Observable<Card[]> {
    const params = { ...paginationParams, ...filters };
    return this.get<Card[]>(this.endpoint, params).pipe(
      map(cards => this.fixCardsImageUrls(cards))
    );
  }

  /**
   * Récupère une carte par son ID
   */
  getCardById(id: number): Observable<Card> {
    return this.get<Card>(`${this.endpoint}/${id}`).pipe(
      map(card => this.fixCardImageUrl(card))
    );
  }

  /**
   * Crée une nouvelle carte
   */
  createCard(card: CreateCardRequest): Observable<Card> {
    return this.post<Card>(this.endpoint, card);
  }

  /**
   * Met à jour une carte existante
   */
  updateCard(card: UpdateCardRequest): Observable<Card> {
    return this.put<Card>(`${this.endpoint}/${card.id}`, card);
  }

  /**
   * Supprime une carte
   */
  deleteCard(id: number): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Ajoute un effet à une carte
   */
  addEffectToCard(cardId: number, effectId: number): Observable<Card> {
    const request: AddEffectToCardRequest = { cardId, effectId };
    return this.put<Card>(`${this.endpoint}/addEffect/${cardId}/${effectId}`, request);
  }

  /**
   * Retire un effet d'une carte
   */
  removeEffectFromCard(cardId: number, effectId: number): Observable<Card> {
    return this.delete<Card>(`${this.endpoint}/${cardId}/effects/${effectId}`);
  }

  /**
   * Remplace tous les effets d'une carte
   */
  replaceCardEffects(cardId: number, effectIds: number[]): Observable<Card> {
    console.log(`🔄 Remplacement des effets pour la carte ${cardId}:`, effectIds);
    return this.put<Card>(`${this.endpoint}/${cardId}/replaceEffects`, effectIds);
  }

  /**
   * Recherche des cartes par nom
   */
  searchCardsByName(name: string): Observable<Card[]> {
    return this.get<Card[]>(`${this.endpoint}/search`, { name });
  }

  /**
   * Filtre les cartes par type de monstre
   */
  getCardsByMonsterType(monsterType: string): Observable<Card[]> {
    return this.get<Card[]>(`${this.endpoint}/monsterType/${monsterType}`);
  }

  /**
   * Filtre les cartes par type d'élément
   */
  getCardsByElementType(elementType: string): Observable<Card[]> {
    return this.get<Card[]>(`${this.endpoint}/elementType/${elementType}`);
  }

  /**
   * Upload une image pour une carte
   */
  uploadCardImage(cardId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    // Ne pas passer d'objet headers du tout - HttpClient définira automatiquement
    // le Content-Type avec la boundary appropriée pour multipart/form-data
    // C'est la seule façon de garantir que le Content-Type est correctement défini
    return this.http.post<any>(`${this.baseUrl}${this.endpoint}/${cardId}/upload-image`, formData).pipe(
      map(response => {
        // Corriger l'URL de l'image dans la réponse si elle existe
        if (response && response.imageUrl) {
          response.imageUrl = this.fixImageUrl(response.imageUrl);
        }
        return response;
      })
    );
  }

  /**
   * Teste l'endpoint d'upload d'image avec un fichier de test
   */
  testUploadImage(cardId: number): Observable<any> {
    console.log(`🧪 Test de l'endpoint d'upload pour la carte ${cardId}`);

    // Créer un fichier de test simple
    const testContent = 'Test image content';
    const testFile = new File([testContent], 'test-image.txt', { type: 'text/plain' });

    return this.uploadCardImage(cardId, testFile);
  }

  /**
   * Corrige une URL d'image relative en URL absolue
   */
  private fixImageUrl(imageUrl: string): string {
    if (!imageUrl) return imageUrl;

    let fixedUrl = imageUrl;

    // Correction 1: Remplacer localhost:5000 par l'URL correcte
    if (fixedUrl.includes('localhost:5000')) {
      fixedUrl = fixedUrl.replace('http://localhost:5000', this.baseUrl);
    }

    // Correction 2: Remplacer 127.0.0.1:5000 par l'URL correcte
    if (fixedUrl.includes('127.0.0.1:5000')) {
      fixedUrl = fixedUrl.replace('http://127.0.0.1:5000', this.baseUrl);
    }

    // Correction 3: Si l'URL est relative (commence par /api/), la convertir en URL absolue
    // baseUrl contient déjà /api, donc on retire /api/ du début pour éviter la duplication
    if (fixedUrl.startsWith('/api/')) {
      // Retirer /api/ du début de l'URL et concaténer avec baseUrl
      fixedUrl = `${this.baseUrl}${fixedUrl.substring(4)}`; // substring(4) retire '/api'
    }

    console.log('🖼️ URL image corrigée:', imageUrl, '→', fixedUrl);
    return fixedUrl;
  }

  /**
   * Corrige l'URL d'image d'une carte
   */
  private fixCardImageUrl(card: Card): Card {
    if (card && card.imageUrl) {
      card.imageUrl = this.fixImageUrl(card.imageUrl);
    }
    return card;
  }

  /**
   * Corrige les URLs d'images d'un tableau de cartes
   */
  private fixCardsImageUrls(cards: Card[]): Card[] {
    return cards.map(card => this.fixCardImageUrl(card));
  }

  /**
   * Crée une nouvelle carte avec image en une seule opération
   */
  createCardWithImage(request: CreateCardWithImageRequest): Observable<CreateCardWithImageResponse> {
    const formData = new FormData();

    // Ajouter tous les champs de la carte
    formData.append('name', request.name);
    formData.append('cardType', request.cardType);
    formData.append('elementType', request.elementType);
    formData.append('tags', JSON.stringify(request.tags));
    formData.append('image', request.image);
    formData.append('imageName', request.imageName);
    
    // Ajouter monsterType, attackPoints et defensePoints seulement s'ils sont définis (cartes Monstre)
    if (request.monsterType !== undefined) {
      formData.append('monsterType', request.monsterType);
    }
    if (request.attackPoints !== undefined) {
      formData.append('attackPoints', request.attackPoints.toString());
    }
    if (request.defensePoints !== undefined) {
      formData.append('defensePoints', request.defensePoints.toString());
    }
    if (request.manaValue !== undefined && request.manaValue != null) {
      formData.append('manaValue', request.manaValue.toString());
    }

    // Ajouter les effets si présents
    if (request.effects && request.effects.length > 0) {
      const effectsJson = JSON.stringify(request.effects);
      console.log('📦 Ajout des effets au FormData:', effectsJson);
      formData.append('effects', effectsJson);
    } else {
      console.log('⚠️ Aucun effet à ajouter');
    }

    console.log('📤 Envoi FormData vers:', `${this.baseUrl}${this.endpoint}/with-image`);

    return this.http.post<CreateCardWithImageResponse>(`${this.baseUrl}${this.endpoint}/with-image`, formData, {
      headers: {
        // Ne pas définir Content-Type, laisser le navigateur le faire automatiquement
        // pour gérer correctement les FormData avec les fichiers
      }
    }).pipe(
      map(response => {
        // Corriger l'URL de l'image dans la réponse
        if (response.card && response.card.imageUrl) {
          response.card.imageUrl = this.fixImageUrl(response.card.imageUrl);
        }
        return response;
      })
    );
  }
}

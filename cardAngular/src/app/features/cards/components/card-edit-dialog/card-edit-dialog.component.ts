import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Card, CreateCardWithImageRequest, Effect, ConditionCard, getEffectConditionsForDisplay } from '../../../../core/models';
import { CardType, MonsterType, ElementType } from '../../../../core/enums';
import { ActionCardService, ConditionCardService, FileService, CardService, EffectService } from '../../../../core/services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-card-edit-dialog',
  templateUrl: './card-edit-dialog.component.html',
  styleUrls: ['./card-edit-dialog.component.css'],
  standalone: false
})
export class CardEditDialogComponent implements OnInit {
  cardForm!: FormGroup;
  isEditMode: boolean;
  private isLoadingInitialData = false;

  // Images
  selectedImages: File[] = [];
  existingImages: any[] = [];
  previewUrls: string[] = [];
  isDragOver = false;
  isUploading = false;

  // Enums pour les selects
  cardTypes = Object.values(CardType);
  monsterTypes = Object.values(MonsterType);
  elementTypes = Object.values(ElementType);

  // Listes pour les effets et conditions
  availableEffects: Effect[] = [];
  availableConditions: ConditionCard[] = [];
  selectedEffectIds: number[] = [];

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
    [CardType.MAGIC]: 'Magic',
    [CardType.MANA]: 'Mana'
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CardEditDialogComponent>,
    private actionCardService: ActionCardService,
    private conditionCardService: ConditionCardService,
    private fileService: FileService,
    private cardService: CardService,
    private effectService: EffectService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { card?: Card }
  ) {
    this.isEditMode = !!data.card;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupCardTypeListener();
    this.loadAvailableEffectsAndConditions();
    if (this.isEditMode) {
      this.loadCardData();
    }
  }

  private initializeForm(): void {
    this.cardForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]],
      cardType: ['', [Validators.required]],
      monsterType: [''], // Optionnel par défaut, sera rendu requis si MONSTRE
      elementType: ['', [Validators.required]],
      attackPoints: [0], // Optionnel par défaut, sera rendu requis si MONSTRE
      defensePoints: [0], // Optionnel par défaut, sera rendu requis si MONSTRE
      hitPoints: [1], // Points de vie, requis pour les cartes Monstre
      level: [null as number | null], // Niveau du monstre (1 à 4)
      manaValue: [null as number | null], // Pour les cartes Mana
      tags: [''], // Champ pour les tags (séparés par des virgules)
      imageUrl: [''],
      actions: this.fb.array([]),
      conditions: this.fb.array([])
    });

    // Écouter les changements du formulaire pour forcer la détection des changements
    this.setupFormChangeDetection();
  }

  private setupFormChangeDetection(): void {
    // Écouter les changements du formulaire pour forcer la détection des changements
    this.cardForm.valueChanges.subscribe(() => {
      // Si on détecte un changement et qu'on était en train de charger, arrêter le chargement
      if (this.isLoadingInitialData) {
        this.isLoadingInitialData = false;
      }
      this.cdr.markForCheck();
    });
  }

  private setupCardTypeListener(): void {
    // Écouter les changements de cardType pour mettre à jour les validators
    this.cardForm.get('cardType')?.valueChanges.subscribe((cardType: CardType) => {
      const monsterTypeControl = this.cardForm.get('monsterType');
      const attackPointsControl = this.cardForm.get('attackPoints');
      const defensePointsControl = this.cardForm.get('defensePoints');
      const hitPointsControl = this.cardForm.get('hitPoints');
      const levelControl = this.cardForm.get('level');

      const manaValueControl = this.cardForm.get('manaValue');
      if (cardType === CardType.MAGIC) {
        // Retirer les validators required pour les cartes Magic
        monsterTypeControl?.clearValidators();
        attackPointsControl?.clearValidators();
        attackPointsControl?.setValidators([Validators.min(0)]);
        defensePointsControl?.clearValidators();
        defensePointsControl?.setValidators([Validators.min(0)]);
        hitPointsControl?.clearValidators();
        hitPointsControl?.setValue(null, { emitEvent: false });
        levelControl?.clearValidators();
        levelControl?.setValue(null, { emitEvent: false });
        manaValueControl?.setValidators([Validators.required, Validators.min(1)]);

        // Réinitialiser les valeurs
        monsterTypeControl?.setValue(null, { emitEvent: false });
        attackPointsControl?.setValue(0, { emitEvent: false });
        defensePointsControl?.setValue(0, { emitEvent: false });
      } else if (cardType === CardType.MANA) {
        // Cartes Mana : pas de stats monstre, valeur mana optionnelle
        monsterTypeControl?.clearValidators();
        attackPointsControl?.clearValidators();
        attackPointsControl?.setValidators([Validators.min(0)]);
        defensePointsControl?.clearValidators();
        defensePointsControl?.setValidators([Validators.min(0)]);
        hitPointsControl?.clearValidators();
        hitPointsControl?.setValue(null, { emitEvent: false });
        levelControl?.clearValidators();
        levelControl?.setValue(null, { emitEvent: false });
        manaValueControl?.clearValidators();
        manaValueControl?.setValidators([Validators.min(1)]);

        monsterTypeControl?.setValue(null, { emitEvent: false });
        attackPointsControl?.setValue(0, { emitEvent: false });
        defensePointsControl?.setValue(0, { emitEvent: false });
      } else if (cardType === CardType.MONSTRE) {
        // Ajouter les validators required pour les cartes Monstre
        monsterTypeControl?.setValidators([Validators.required]);
        attackPointsControl?.setValidators([Validators.required, Validators.min(0)]);
        defensePointsControl?.setValidators([Validators.required, Validators.min(0)]);
        hitPointsControl?.setValidators([Validators.required, Validators.min(1)]);
        levelControl?.setValidators([Validators.required, Validators.min(1), Validators.max(4)]);
        manaValueControl?.setValidators([Validators.required, Validators.min(1)]);
      }

      // Mettre à jour l'état de validation
      monsterTypeControl?.updateValueAndValidity({ emitEvent: false });
      attackPointsControl?.updateValueAndValidity({ emitEvent: false });
      defensePointsControl?.updateValueAndValidity({ emitEvent: false });
      hitPointsControl?.updateValueAndValidity({ emitEvent: false });
      levelControl?.updateValueAndValidity({ emitEvent: false });
      manaValueControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private loadCardData(): void {
    if (this.data.card) {
      this.isLoadingInitialData = true;
      console.log('📥 Carte reçue:', this.data.card);
      console.log('📥 cardType reçu:', this.data.card.cardType);

      // Préparer les données avec une valeur par défaut pour cardType si elle n'existe pas
      // Convertir les tags de tableau vers chaîne si nécessaire
      const tagsValue = Array.isArray(this.data.card.tags)
        ? this.data.card.tags.join(', ')
        : (this.data.card.tags || '');

      const cardData = {
        ...this.data.card,
        cardType: this.data.card.cardType || CardType.MONSTRE, // Valeur par défaut si null/undefined
        tags: tagsValue // Convertir les tags en chaîne pour le formulaire
      };

      console.log('📥 Données préparées pour le formulaire:', cardData);
      console.log('📥 cardType final:', cardData.cardType);

      // Charger les données sans marquer le formulaire comme modifié
      this.cardForm.patchValue(cardData, { emitEvent: false });

      // Forcer la mise à jour du champ cardType si nécessaire
      if (cardData.cardType) {
        const cardTypeControl = this.cardForm.get('cardType');
        if (cardTypeControl) {
          // S'assurer que la valeur correspond exactement à une valeur de l'enum
          const matchingCardType = this.cardTypes.find(type => type === cardData.cardType);
          if (matchingCardType) {
            cardTypeControl.setValue(matchingCardType, { emitEvent: true }); // Émettre l'événement pour déclencher le listener
            console.log('✅ cardType défini à:', matchingCardType);
          } else {
            console.warn('⚠️ cardType ne correspond à aucune valeur de l\'enum:', cardData.cardType);
            // Utiliser la valeur par défaut
            cardTypeControl.setValue(CardType.MONSTRE, { emitEvent: true });
          }
        }
      } else {
        // Si cardType n'est pas défini, déclencher manuellement le listener avec la valeur par défaut
        const cardTypeControl = this.cardForm.get('cardType');
        if (cardTypeControl) {
          cardTypeControl.setValue(CardType.MONSTRE, { emitEvent: true });
        }
      }

      // Charger les actions existantes
      this.loadActions();

      // Charger les conditions existantes
      this.loadConditions();

      // Charger les effets liés à la carte
      if (this.data.card.effects) {
        this.selectedEffectIds = this.data.card.effects.map(effect => effect.id);
        console.log('📥 Effets existants chargés:', this.selectedEffectIds);
      } else {
        console.log('⚠️ Aucun effet existant sur cette carte');
      }

      // Marquer le formulaire comme pristine après le chargement initial
      // pour que seules les modifications utilisateur marquent le formulaire comme dirty
      // Utiliser setTimeout pour s'assurer que tous les setValue sont terminés
      setTimeout(() => {
        const formCardType = this.cardForm.get('cardType')?.value;
        console.log('📥 Valeur dans le formulaire après patchValue:', formCardType);
        console.log('📥 Valeurs disponibles dans cardTypes:', this.cardTypes);
        console.log('📥 La valeur correspond-elle?', this.cardTypes.includes(formCardType));

        // Marquer le formulaire comme pristine après toutes les opérations de chargement
        // seulement si on est toujours en train de charger (pas de modifications utilisateur)
        if (this.isLoadingInitialData) {
          this.cardForm.markAsPristine();
          this.isLoadingInitialData = false;
        }
      }, 100);
    }
  }

  private loadAvailableEffectsAndConditions(): void {
    forkJoin({
      effects: this.effectService.getAllEffects(),
      conditions: this.conditionCardService.getAllConditions()
    }).subscribe({
      next: (result) => {
        this.availableEffects = result.effects;
        this.availableConditions = result.conditions;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des effets et conditions:', error);
        this.snackBar.open('Erreur lors du chargement des effets et conditions', 'Fermer', { duration: 3000 });
      }
    });
  }

  private loadActions(): void {
    const actionsArray = this.cardForm.get('actions') as FormArray;
    actionsArray.clear();

    if (this.data.card?.id) {
      this.actionCardService.getActionsByCardId(this.data.card.id).subscribe({
        next: (actions: any[]) => {
          actions.forEach(action => {
            actionsArray.push(this.createActionFormGroup(action));
          });
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des actions:', error);
        }
      });
    }
  }

  private loadConditions(): void {
    const conditionsArray = this.cardForm.get('conditions') as FormArray;
    conditionsArray.clear();

    if (this.data.card?.id) {
      this.conditionCardService.getConditionsByCardId(this.data.card.id).subscribe({
        next: (conditions: any[]) => {
          conditions.forEach(condition => {
            conditionsArray.push(this.createConditionFormGroup(condition));
          });
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des conditions:', error);
        }
      });
    }
  }

  // Gestion des actions
  get actionsArray(): FormArray {
    return this.cardForm.get('actions') as FormArray;
  }

  addAction(): void {
    this.actionsArray.push(this.createActionFormGroup());
  }

  removeAction(index: number): void {
    this.actionsArray.removeAt(index);
  }

  private createActionFormGroup(action?: any): FormGroup {
    return this.fb.group({
      id: [action?.id || null],
      name: [action?.actionName ?? action?.name ?? '', [Validators.required]],
      description: [action?.description || '', [Validators.required]],
      cost: [action?.cost ?? 0, [Validators.min(0)]],
      damage: [action?.damage ?? 0, [Validators.min(0)]],
      healing: [action?.healing ?? 0, [Validators.min(0)]]
    });
  }

  // Gestion des conditions
  get conditionsArray(): FormArray {
    return this.cardForm.get('conditions') as FormArray;
  }

  addCondition(): void {
    this.conditionsArray.push(this.createConditionFormGroup());
  }

  removeCondition(index: number): void {
    this.conditionsArray.removeAt(index);
  }

  private createConditionFormGroup(condition?: any): FormGroup {
    return this.fb.group({
      id: [condition?.id || null],
      name: [condition?.nameCondition ?? condition?.name ?? '', [Validators.required]],
      description: [condition?.description || '', [Validators.required]],
      duration: [condition?.duration ?? 1, [Validators.min(1)]],
      effect: [condition?.effect || '']
    });
  }

  // Méthodes pour les labels des enums
  getMonsterTypeLabel(type: MonsterType): string {
    return this.monsterTypeLabels[type] || type;
  }

  getElementTypeLabel(type: ElementType): string {
    return this.elementTypeLabels[type] || type;
  }

  getCardTypeLabel(type: CardType | null | undefined): string {
    if (!type) {
      return '';
    }
    return this.cardTypeLabels[type] || type;
  }

  get selectedCardTypeLabel(): string {
    const cardType = this.cardForm.get('cardType')?.value;
    if (!cardType) {
      return '';
    }
    // S'assurer que la valeur correspond à un enum CardType
    const cardTypeValue = Object.values(CardType).includes(cardType) ? cardType : null;
    return this.getCardTypeLabel(cardTypeValue);
  }

  get isMagicCard(): boolean {
    const cardType = this.cardForm.get('cardType')?.value;
    return cardType === CardType.MAGIC;
  }

  get isManaCard(): boolean {
    const cardType = this.cardForm.get('cardType')?.value;
    return cardType === CardType.MANA;
  }

  get isMonsterCard(): boolean {
    const cardType = this.cardForm.get('cardType')?.value;
    return cardType === CardType.MONSTRE;
  }

  onSave(): void {
    // Utiliser la même logique que canSave() pour permettre la sauvegarde
    // même si le formulaire n'est pas complètement valide mais a été modifié
    if (this.canSave()) {
      const formValue = this.cardForm.value;

      // Vérifier si on a une image sélectionnée pour une nouvelle carte
      const hasSelectedImage = this.selectedImages.length > 0;
      const isNewCard = !this.isEditMode;

      console.log('💾 onSave appelé:', {
        isEditMode: this.isEditMode,
        hasSelectedImage,
        isNewCard,
        selectedEffectIds: this.selectedEffectIds,
        formValid: this.cardForm.valid,
        formDirty: this.cardForm.dirty
      });

      if (isNewCard && hasSelectedImage) {
        // Utiliser le nouvel endpoint pour créer une carte avec image
        this.createCardWithImage(formValue);
      } else if (!isNewCard && hasSelectedImage) {
        // Modification d'une carte existante avec nouvelle image
        this.saveCardWithNewImage(formValue);
      } else {
        // Utiliser l'ancienne méthode pour les autres cas
        this.saveCardWithOldMethod(formValue);
      }
    } else {
      // Si on ne peut pas sauvegarder, marquer les champs comme touchés pour afficher les erreurs
      this.markFormGroupTouched();
      this.snackBar.open('Veuillez remplir les champs obligatoires', 'Fermer', { duration: 3000 });
    }
  }

  private createCardWithImage(formValue: any): void {
    // Convertir les tags de string vers array
    // Gérer le cas où tags est déjà un tableau ou une chaîne
    let tags: string[] = [];
    if (formValue.tags) {
      if (Array.isArray(formValue.tags)) {
        // Si c'est déjà un tableau, l'utiliser directement
        tags = formValue.tags.filter((tag: any) => tag && String(tag).trim().length > 0).map((tag: any) => String(tag).trim());
      } else if (typeof formValue.tags === 'string') {
        // Si c'est une chaîne, la diviser par les virgules
        tags = formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    }

    // Toujours envoyer le tableau (éventuellement vide) pour que le back remplace la liste ; ne pas omettre le champ.
    const effects = this.selectedEffectIds.map(id => ({ id }));

    console.log('🎯 Effets sélectionnés:', this.selectedEffectIds);
    console.log('🎯 Effets formatés:', effects);

    // Préparer la requête en fonction du type de carte
    const isNonMonster = formValue.cardType === CardType.MAGIC || formValue.cardType === CardType.MANA;
    const usesManaValue = formValue.cardType === CardType.MANA || formValue.cardType === CardType.MONSTRE || formValue.cardType === CardType.MAGIC;
    const request: CreateCardWithImageRequest = {
      name: formValue.name,
      cardType: formValue.cardType,
      elementType: formValue.elementType,
      tags: tags,
      image: this.selectedImages[0],
      imageName: this.selectedImages[0].name,
      effects,
      // Inclure monsterType, attackPoints, defensePoints et hitPoints seulement pour les cartes Monstre
      ...(isNonMonster ? {} : {
        monsterType: formValue.monsterType,
        attackPoints: formValue.attackPoints,
        defensePoints: formValue.defensePoints,
        hitPoints: formValue.hitPoints != null ? Number(formValue.hitPoints) : 1,
        ...(formValue.level != null ? { level: Number(formValue.level) } : {})
      }),
      ...(usesManaValue && formValue.manaValue != null ? { manaValue: Number(formValue.manaValue) } : {})
    };

    console.log('📦 Requête complète:', request);

    this.isUploading = true;

    this.cardService.createCardWithImage(request).subscribe({
      next: (response) => {
        const totalConditions = this.selectedEffectIds.reduce((sum, effectId) => {
          return sum + this.getEffectConditions(effectId).length;
        }, 0);

        const message = this.selectedEffectIds.length > 0
          ? `Carte créée avec ${this.selectedEffectIds.length} effet(s) et ${totalConditions} condition(s) !`
          : 'Carte créée avec succès !';

        const result = {
          card: response.card,
          actions: formValue.actions || [],
          conditions: formValue.conditions || [],
          images: [{ fileName: this.selectedImages[0].name, url: response.card.imageUrl }],
          effectIds: this.selectedEffectIds,
          skipUpdate: true  // ← IMPORTANT : Ne pas refaire de requête, la carte est déjà créée
        };

        this.isUploading = false;
        this.snackBar.open(message, 'Fermer', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création de carte avec image:', error);
        this.isUploading = false;
        this.snackBar.open('Erreur lors de la création de la carte avec image', 'Fermer', { duration: 3000 });
      }
    });
  }

  private saveCardWithOldMethod(formValue: any): void {
    // Valider que les champs essentiels sont présents
    if (!formValue.name || !formValue.cardType || !formValue.elementType) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      this.markFormGroupTouched();
      return;
    }

    // Si c'est une carte Monstre, vérifier les champs spécifiques
    if (formValue.cardType === CardType.MONSTRE) {
      if (!formValue.monsterType || formValue.attackPoints === null || formValue.attackPoints === undefined ||
          formValue.defensePoints === null || formValue.defensePoints === undefined ||
          formValue.hitPoints == null || formValue.hitPoints === undefined || formValue.hitPoints < 1 ||
          formValue.level == null || formValue.level === undefined || formValue.level < 1 || formValue.level > 4 ||
          formValue.manaValue == null || formValue.manaValue === undefined || formValue.manaValue < 1) {
        this.snackBar.open('Veuillez remplir tous les champs obligatoires pour une carte Monstre (level 1-4, PV >= 1 et coût mana >= 1)', 'Fermer', { duration: 3000 });
        this.markFormGroupTouched();
        return;
      }
    }

    // Séparer les données de la carte des actions et conditions
    // Utiliser la première image uploadée comme imageUrl de la carte
    const primaryImageUrl = this.existingImages.length > 0
      ? this.existingImages[0].url
      : formValue.imageUrl;

    // Préparer les tags
    // Gérer le cas où tags est déjà un tableau ou une chaîne
    let tags: string[] = [];
    if (formValue.tags) {
      if (Array.isArray(formValue.tags)) {
        // Si c'est déjà un tableau, l'utiliser directement
        tags = formValue.tags.filter((tag: any) => tag && String(tag).trim().length > 0).map((tag: any) => String(tag).trim());
      } else if (typeof formValue.tags === 'string') {
        // Si c'est une chaîne, la diviser par les virgules
        tags = formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    }

    const effects = this.selectedEffectIds.map(id => ({ id }));

    console.log('🎯 Effets sélectionnés (oldMethod):', this.selectedEffectIds);
    console.log('🎯 Effets formatés (oldMethod):', effects);

    // Préparer les données en fonction du type de carte
    const isNonMonster = formValue.cardType === CardType.MAGIC || formValue.cardType === CardType.MANA;
    const usesManaValue = formValue.cardType === CardType.MANA || formValue.cardType === CardType.MONSTRE || formValue.cardType === CardType.MAGIC;
    const cardData: any = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description || '', // S'assurer que description est toujours présent
      cardType: formValue.cardType,
      elementType: formValue.elementType,
      imageUrl: primaryImageUrl,
      tags: tags,
      effects,
      // Inclure monsterType, attackPoints, defensePoints et hitPoints seulement pour les cartes Monstre
      ...(isNonMonster ? {} : {
        monsterType: formValue.monsterType,
        attackPoints: formValue.attackPoints,
        defensePoints: formValue.defensePoints,
        hitPoints: formValue.hitPoints != null ? Number(formValue.hitPoints) : 1,
        ...(formValue.level != null ? { level: Number(formValue.level) } : {})
      }),
      ...(usesManaValue && formValue.manaValue != null ? { manaValue: Number(formValue.manaValue) } : {})
    };

    console.log('📦 Données de carte à sauvegarder:', cardData);

    const result = {
      card: cardData,
      actions: formValue.actions || [],
      conditions: formValue.conditions || [],
      images: this.existingImages || [],
      effectIds: this.selectedEffectIds
    };

    this.dialogRef.close(result);
  }

  private saveCardWithNewImage(formValue: any): void {
    // Valider que les champs essentiels sont présents
    if (!formValue.name || !formValue.cardType || !formValue.elementType) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      this.markFormGroupTouched();
      return;
    }

    // Si c'est une carte Monstre, vérifier les champs spécifiques
    if (formValue.cardType === CardType.MONSTRE) {
      if (!formValue.monsterType || formValue.attackPoints === null || formValue.attackPoints === undefined ||
          formValue.defensePoints === null || formValue.defensePoints === undefined ||
          formValue.hitPoints == null || formValue.hitPoints === undefined || formValue.hitPoints < 1 ||
          formValue.level == null || formValue.level === undefined || formValue.level < 1 || formValue.level > 4 ||
          formValue.manaValue == null || formValue.manaValue === undefined || formValue.manaValue < 1) {
        this.snackBar.open('Veuillez remplir tous les champs obligatoires pour une carte Monstre (level 1-4, PV >= 1 et coût mana >= 1)', 'Fermer', { duration: 3000 });
        this.markFormGroupTouched();
        return;
      }
    }
    if (formValue.cardType === CardType.MAGIC) {
      if (formValue.manaValue == null || formValue.manaValue === undefined || formValue.manaValue < 1) {
        this.snackBar.open('Veuillez renseigner un coût en mana (>= 1) pour une carte Magic', 'Fermer', { duration: 3000 });
        this.markFormGroupTouched();
        return;
      }
    }

    // Vérifier qu'on a bien une carte existante avec un ID
    if (!this.data.card?.id) {
      this.snackBar.open('Erreur: carte non trouvée', 'Fermer', { duration: 3000 });
      return;
    }

    // Vérifier qu'on a bien une image sélectionnée
    if (this.selectedImages.length === 0) {
      this.snackBar.open('Aucune image sélectionnée', 'Fermer', { duration: 3000 });
      return;
    }

    this.isUploading = true;

    // Uploader l'image (l'endpoint met automatiquement à jour l'imageUrl de la carte)
    this.cardService.uploadCardImage(this.data.card.id, this.selectedImages[0]).subscribe({
      next: (uploadResult) => {
        console.log('📤 Réponse upload:', uploadResult);
        
        // Récupérer l'URL de l'image depuis la réponse
        // La réponse contient: { card: Card, imageUrl: string, fileName: string }
        const imageUrl = uploadResult.imageUrl || (uploadResult.card && uploadResult.card.imageUrl);
        
        console.log('🖼️ URL image récupérée:', imageUrl);
        
        if (!imageUrl) {
          console.error('❌ Aucune URL d\'image dans la réponse');
          this.isUploading = false;
          this.snackBar.open('Erreur: URL d\'image non trouvée dans la réponse', 'Fermer', { duration: 3000 });
          return;
        }
        
        // Récupérer la carte mise à jour (soit depuis la réponse, soit utiliser les données du formulaire)
        const updatedCard = uploadResult.card || this.data.card;

        // Préparer les tags
        let tags: string[] = [];
        if (formValue.tags) {
          if (Array.isArray(formValue.tags)) {
            tags = formValue.tags.filter((tag: any) => tag && String(tag).trim().length > 0).map((tag: any) => String(tag).trim());
          } else if (typeof formValue.tags === 'string') {
            tags = formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
          }
        }

        const effects = this.selectedEffectIds.map(id => ({ id }));

        // Préparer les données en fonction du type de carte
        const isNonMonster = formValue.cardType === CardType.MAGIC || formValue.cardType === CardType.MANA;
    const usesManaValue = formValue.cardType === CardType.MANA || formValue.cardType === CardType.MONSTRE || formValue.cardType === CardType.MAGIC;
        const cardData: any = {
          id: formValue.id,
          name: formValue.name,
          description: formValue.description || '',
          cardType: formValue.cardType,
          elementType: formValue.elementType,
          imageUrl: imageUrl, // Utiliser la nouvelle URL d'image
          tags: tags,
          effects,
          ...(isNonMonster ? {} : {
            monsterType: formValue.monsterType,
            attackPoints: formValue.attackPoints,
            defensePoints: formValue.defensePoints,
            hitPoints: formValue.hitPoints != null ? Number(formValue.hitPoints) : 1,
            ...(formValue.level != null ? { level: Number(formValue.level) } : {})
          }),
          ...(usesManaValue && formValue.manaValue != null ? { manaValue: Number(formValue.manaValue) } : {})
        };

        console.log('📦 Données de carte à sauvegarder (avec nouvelle image):', cardData);

        // Préparer le résultat avec la carte mise à jour et la nouvelle image
        const result = {
          card: cardData,
          actions: formValue.actions || [],
          conditions: formValue.conditions || [],
          images: [{ fileName: this.selectedImages[0].name, url: imageUrl }],
          effectIds: this.selectedEffectIds
        };

        this.isUploading = false;
        this.snackBar.open('Image modifiée et carte mise à jour', 'Fermer', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'upload de l\'image:', error);
        this.isUploading = false;
        this.snackBar.open('Erreur lors de l\'upload de l\'image', 'Fermer', { duration: 3000 });
      }
    });
  }

  // Méthodes pour gérer les effets
  toggleEffectSelection(effectId: number): void {
    console.log('🔄 Toggle effet ID:', effectId);
    const index = this.selectedEffectIds.indexOf(effectId);
    if (index > -1) {
      this.selectedEffectIds.splice(index, 1);
      console.log('❌ Effet retiré. Liste actuelle:', this.selectedEffectIds);
    } else {
      this.selectedEffectIds.push(effectId);
      console.log('✅ Effet ajouté. Liste actuelle:', this.selectedEffectIds);
    }
  }

  isEffectSelected(effectId: number): boolean {
    return this.selectedEffectIds.includes(effectId);
  }

  // Méthodes pour récupérer les informations des effets
  getEffectName(effectId: number): string {
    const effect = this.availableEffects.find(e => e.id === effectId);
    return effect ? effect.effectName : '';
  }

  getEffectConditions(effectId: number): ConditionCard[] {
    const effect = this.availableEffects.find(e => e.id === effectId);
    if (!effect) {
      return [];
    }
    return getEffectConditionsForDisplay(effect).map(r => ({
      id: r.id,
      nameCondition: r.nameCondition || '',
      description: r.description || ''
    }));
  }

  getEffectConditionCount(effect: Effect): number {
    return getEffectConditionsForDisplay(effect).length;
  }

  getEffectActions(effectId: number): any[] {
    const effect = this.availableEffects.find(e => e.id === effectId);
    return effect && effect.actions ? effect.actions : [];
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  canSave(): boolean {
    // Si le formulaire est valide, on peut toujours sauvegarder
    if (this.cardForm.valid) {
      return true;
    }

    // Si le formulaire a été modifié (dirty), vérifier les champs essentiels
    if (this.cardForm.dirty) {
      const name = this.cardForm.get('name')?.value;
      const cardType = this.cardForm.get('cardType')?.value;
      const elementType = this.cardForm.get('elementType')?.value;

      // Vérifier les champs obligatoires de base
      if (!name || name.trim().length < 2 || !cardType || !elementType) {
        return false;
      }

      // Si c'est une carte Monstre, vérifier les champs spécifiques
      if (cardType === CardType.MONSTRE) {
        const monsterType = this.cardForm.get('monsterType')?.value;
        const attackPoints = this.cardForm.get('attackPoints')?.value;
        const defensePoints = this.cardForm.get('defensePoints')?.value;
        const hitPoints = this.cardForm.get('hitPoints')?.value;
        const level = this.cardForm.get('level')?.value;
        const manaValue = this.cardForm.get('manaValue')?.value;

        if (!monsterType || attackPoints === null || attackPoints === undefined ||
            defensePoints === null || defensePoints === undefined ||
            hitPoints == null || hitPoints === undefined || hitPoints < 1 ||
            level == null || level === undefined || level < 1 || level > 4 ||
            manaValue == null || manaValue === undefined || manaValue < 1) {
          return false;
        }
      }
      if (cardType === CardType.MAGIC) {
        const manaValue = this.cardForm.get('manaValue')?.value;
        if (manaValue == null || manaValue === undefined || manaValue < 1) {
          return false;
        }
      }

      // Si on arrive ici, les champs essentiels sont remplis
      return true;
    }

    // Par défaut, ne pas permettre la sauvegarde
    return false;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.cardForm.controls).forEach(key => {
      const control = this.cardForm.get(key);
      control?.markAsTouched();
    });
  }

  // Méthodes pour la validation des erreurs
  hasError(controlName: string, errorType: string): boolean {
    const control = this.cardForm.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.cardForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    if (control?.hasError('min')) {
      return `Valeur minimale: ${control.errors?.['min'].min}`;
    }
    return '';
  }

  // Méthodes pour la gestion des images
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);

    // Reset input
    input.value = '';
  }

  private handleFiles(files: File[]): void {
    if (files.length === 0) return;

    // Vérifier le nombre de fichiers
    if (files.length > 5) {
      this.snackBar.open('Maximum 5 fichiers autorisés', 'Fermer', { duration: 3000 });
      return;
    }

    // Vérifier les types de fichiers
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !acceptedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      this.snackBar.open('Seuls les fichiers image sont autorisés', 'Fermer', { duration: 3000 });
      return;
    }

    // Vérifier la taille des fichiers (5MB max)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      this.snackBar.open('Fichiers trop volumineux (max 5MB)', 'Fermer', { duration: 3000 });
      return;
    }

    // Créer les prévisualisations
    this.createPreviews(files);
    this.selectedImages = files;
  }

  private createPreviews(files: File[]): void {
    this.previewUrls = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removePreview(index: number): void {
    this.previewUrls.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  uploadImages(): void {
    if (this.selectedImages.length === 0) return;

    // Si on est en mode édition et qu'on a un ID de carte, utiliser l'endpoint spécifique
    if (this.isEditMode && this.data.card?.id) {
      this.uploadCardImage(this.data.card.id, this.selectedImages[0]);
    } else {
      // Sinon, utiliser le service de fichiers générique
      this.fileService.uploadFile(this.selectedImages[0]).subscribe({
        next: (result) => {
          if (result.success && result.file) {
            this.existingImages.push({
              fileName: result.file.fileName,
              url: this.fileService.getImageUrl(result.file.fileName)
            });
            this.selectedImages = [];
            this.previewUrls = [];
            this.snackBar.open('Image uploadée avec succès', 'Fermer', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Erreur upload:', error);
          this.snackBar.open('Erreur lors de l\'upload', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  private uploadCardImage(cardId: number, file: File): void {
    this.isUploading = true;

    this.cardService.uploadCardImage(cardId, file).subscribe({
      next: (result) => {
        // Ajouter l'image à la liste des images existantes
        this.existingImages.push({
          fileName: file.name,
          url: result.imageUrl || result.url || URL.createObjectURL(file)
        });

        this.selectedImages = [];
        this.previewUrls = [];
        this.isUploading = false;
        this.snackBar.open('Image uploadée avec succès', 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ Erreur upload image carte:', error);
        this.isUploading = false;
        this.snackBar.open('Erreur lors de l\'upload de l\'image', 'Fermer', { duration: 3000 });
      }
    });
  }

  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
    this.snackBar.open('Image supprimée', 'Fermer', { duration: 2000 });
  }

  uploadAllImages(): void {
    if (this.selectedImages.length === 0) return;

    this.isUploading = true;
    let uploadCount = 0;
    const totalImages = this.selectedImages.length;

    // Upload toutes les images sélectionnées
    this.selectedImages.forEach((file, index) => {
      // Si on est en mode édition et qu'on a un ID de carte, utiliser l'endpoint spécifique
      if (this.isEditMode && this.data.card?.id) {
        this.cardService.uploadCardImage(this.data.card.id, file).subscribe({
          next: (result) => {
            this.existingImages.push({
              fileName: file.name,
              url: result.imageUrl || result.url || URL.createObjectURL(file)
            });
            uploadCount++;

            if (uploadCount === totalImages) {
              // Toutes les images sont uploadées
              this.selectedImages = [];
              this.previewUrls = [];
              this.isUploading = false;
              this.snackBar.open(`${totalImages} image(s) uploadée(s) avec succès`, 'Fermer', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error(`❌ Erreur upload image ${index + 1}:`, error);
            this.isUploading = false;
            this.snackBar.open(`Erreur lors de l'upload de l'image ${index + 1}`, 'Fermer', { duration: 3000 });
          }
        });
      } else {
        // Utiliser le service de fichiers générique
        this.fileService.uploadFile(file).subscribe({
          next: (result) => {
            if (result.success && result.file) {
              this.existingImages.push({
                fileName: result.file.fileName,
                url: this.fileService.getImageUrl(result.file.fileName)
              });
              uploadCount++;

              if (uploadCount === totalImages) {
                // Toutes les images sont uploadées
                this.selectedImages = [];
                this.previewUrls = [];
                this.isUploading = false;
                this.snackBar.open(`${totalImages} image(s) uploadée(s) avec succès`, 'Fermer', { duration: 3000 });
              }
            }
          },
          error: (error) => {
            console.error('Erreur upload image', index + 1, ':', error);
            this.isUploading = false;
            this.snackBar.open(`Erreur lors de l'upload de l'image ${index + 1}`, 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  clearSelectedImages(): void {
    this.selectedImages = [];
    this.previewUrls = [];
    this.snackBar.open('Sélection annulée', 'Fermer', { duration: 2000 });
  }

  testUploadEndpoint(): void {
    if (!this.data.card?.id) {
      this.snackBar.open('Aucune carte sélectionnée pour le test', 'Fermer', { duration: 3000 });
      return;
    }

    this.cardService.testUploadImage(this.data.card.id).subscribe({
      next: (result) => {
        this.snackBar.open('Test d\'upload réussi !', 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ Test d\'upload échoué:', error);
        this.snackBar.open('Test d\'upload échoué. Vérifiez la console pour les détails.', 'Fermer', { duration: 5000 });
      }
    });
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Card, CreateCardWithImageRequest, Effect, ConditionCard } from '../../../../core/models';
import { MonsterType, ElementType } from '../../../../core/enums';
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

  // Images
  selectedImages: File[] = [];
  existingImages: any[] = [];
  previewUrls: string[] = [];
  isDragOver = false;
  isUploading = false;

  // Enums pour les selects
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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CardEditDialogComponent>,
    private actionCardService: ActionCardService,
    private conditionCardService: ConditionCardService,
    private fileService: FileService,
    private cardService: CardService,
    private effectService: EffectService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { card?: Card }
  ) {
    this.isEditMode = !!data.card;
  }

  ngOnInit(): void {
    this.initializeForm();
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
      monsterType: ['', [Validators.required]],
      elementType: ['', [Validators.required]],
      attackPoints: [0, [Validators.required, Validators.min(0)]],
      defensePoints: [0, [Validators.required, Validators.min(0)]],
      tags: [''], // Champ pour les tags (séparés par des virgules)
      imageUrl: [''],
      actions: this.fb.array([]),
      conditions: this.fb.array([])
    });
  }

  private loadCardData(): void {
    if (this.data.card) {
      this.cardForm.patchValue(this.data.card);

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
      name: [action?.name || '', [Validators.required]],
      description: [action?.description || '', [Validators.required]],
      cost: [action?.cost || 0, [Validators.min(0)]],
      damage: [action?.damage || 0, [Validators.min(0)]],
      healing: [action?.healing || 0, [Validators.min(0)]]
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
      name: [condition?.name || '', [Validators.required]],
      description: [condition?.description || '', [Validators.required]],
      duration: [condition?.duration || 1, [Validators.min(1)]],
      effect: [condition?.effect || '', [Validators.required]]
    });
  }

  // Méthodes pour les labels des enums
  getMonsterTypeLabel(type: MonsterType): string {
    return this.monsterTypeLabels[type] || type;
  }

  getElementTypeLabel(type: ElementType): string {
    return this.elementTypeLabels[type] || type;
  }

  onSave(): void {
    if (this.cardForm.valid) {
      const formValue = this.cardForm.value;

      // Vérifier si on a une image sélectionnée pour une nouvelle carte
      const hasSelectedImage = this.selectedImages.length > 0;
      const isNewCard = !this.isEditMode;

      console.log('💾 onSave appelé:', {
        isEditMode: this.isEditMode,
        hasSelectedImage,
        isNewCard,
        selectedEffectIds: this.selectedEffectIds
      });

      if (isNewCard && hasSelectedImage) {
        // Utiliser le nouvel endpoint pour créer une carte avec image
        this.createCardWithImage(formValue);
      } else {
        // Utiliser l'ancienne méthode pour les autres cas
        this.saveCardWithOldMethod(formValue);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createCardWithImage(formValue: any): void {
    // Convertir les tags de string vers array
    const tags = formValue.tags
      ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
      : [];

    // Préparer les effets au format attendu par l'API
    const effects = this.selectedEffectIds.map(id => ({ id }));

    console.log('🎯 Effets sélectionnés:', this.selectedEffectIds);
    console.log('🎯 Effets formatés:', effects);

    const request: CreateCardWithImageRequest = {
      name: formValue.name,
      monsterType: formValue.monsterType,
      elementType: formValue.elementType,
      attackPoints: formValue.attackPoints,
      defensePoints: formValue.defensePoints,
      tags: tags,
      image: this.selectedImages[0],
      imageName: this.selectedImages[0].name,
      effects: effects.length > 0 ? effects : undefined
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
    // Séparer les données de la carte des actions et conditions
    // Utiliser la première image uploadée comme imageUrl de la carte
    const primaryImageUrl = this.existingImages.length > 0
      ? this.existingImages[0].url
      : formValue.imageUrl;

    // Préparer les tags
    const tags = formValue.tags
      ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
      : [];

    // Préparer les effets au format attendu par l'API
    const effects = this.selectedEffectIds.map(id => ({ id }));

    console.log('🎯 Effets sélectionnés (oldMethod):', this.selectedEffectIds);
    console.log('🎯 Effets formatés (oldMethod):', effects);

    const cardData = {
      id: formValue.id,
      name: formValue.name,
      monsterType: formValue.monsterType,
      elementType: formValue.elementType,
      attackPoints: formValue.attackPoints,
      defensePoints: formValue.defensePoints,
      imageUrl: primaryImageUrl,
      tags: tags,
      effects: effects.length > 0 ? effects : undefined
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
    return effect && effect.conditionCards ? effect.conditionCards : [];
  }

  getEffectActions(effectId: number): any[] {
    const effect = this.availableEffects.find(e => e.id === effectId);
    return effect && effect.actions ? effect.actions : [];
  }

  onCancel(): void {
    this.dialogRef.close();
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

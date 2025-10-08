import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-image-drop-zone',
  templateUrl: './image-drop-zone.component.html',
  styleUrls: ['./image-drop-zone.component.css']
})
export class ImageDropZoneComponent {
  @Input() maxFiles: number = 5;
  @Input() maxFileSize: number = 5 * 1024 * 1024; // 5MB par défaut
  @Input() acceptedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  @Input() placeholder: string = 'Glissez-déposez vos images ici ou cliquez pour sélectionner';
  @Input() disabled: boolean = false;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() uploadComplete = new EventEmitter<any[]>();
  @Output() uploadError = new EventEmitter<string>();

  isDragOver = false;
  isUploading = false;
  uploadedFiles: any[] = [];
  previewUrls: string[] = [];

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (this.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelected(event: Event): void {
    if (this.disabled) return;

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);

    // Reset input
    input.value = '';
  }

  private handleFiles(files: File[]): void {
    if (files.length === 0) return;

    // Vérifier le nombre de fichiers
    if (files.length > this.maxFiles) {
      console.warn(`Maximum ${this.maxFiles} fichiers autorisés`);
      this.filesSelected.emit([]);
      return;
    }

    // Vérifier les types de fichiers
    const invalidFiles = files.filter(file => !this.acceptedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      console.warn('Seuls les fichiers image sont autorisés');
      this.filesSelected.emit([]);
      return;
    }

    // Vérifier la taille des fichiers
    const oversizedFiles = files.filter(file => file.size > this.maxFileSize);
    if (oversizedFiles.length > 0) {
      console.warn(`Fichiers trop volumineux (max ${this.formatFileSize(this.maxFileSize)})`);
      this.filesSelected.emit([]);
      return;
    }

    // Créer les prévisualisations
    this.createPreviews(files);

    // Émettre les fichiers sélectionnés
    this.filesSelected.emit(files);
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
  }

  clearAll(): void {
    this.previewUrls = [];
    this.uploadedFiles = [];
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileSize(file: File): string {
    return this.formatFileSize(file.size);
  }
}

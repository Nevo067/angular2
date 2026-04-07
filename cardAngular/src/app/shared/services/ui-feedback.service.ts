import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

const CLOSE = 'Fermer';

const BASE: MatSnackBarConfig = {
  horizontalPosition: 'center',
  verticalPosition: 'top'
};

/**
 * Snackbars succès / erreur / avertissement avec libellés et panelClass homogènes
 * (écrans paramètres actions / conditions / effets / catalogue).
 */
@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  constructor(private readonly snackBar: MatSnackBar) {}

  showSuccess(message: string, durationMs = 3000): void {
    this.snackBar.open(message, CLOSE, {
      ...BASE,
      duration: durationMs,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string, durationMs = 4000): void {
    this.snackBar.open(message, CLOSE, {
      ...BASE,
      duration: durationMs,
      panelClass: ['error-snackbar']
    });
  }

  showWarning(message: string, durationMs = 4000): void {
    this.snackBar.open(message, CLOSE, {
      ...BASE,
      duration: durationMs,
      panelClass: ['warning-snackbar']
    });
  }

  /** Snackbar d’erreur avec bouton d’action (ex. « Fermer quand même »). */
  showErrorWithAction(message: string, actionLabel: string, durationMs = 12000): Observable<void> {
    return this.snackBar.open(message, actionLabel, {
      ...BASE,
      duration: durationMs,
      panelClass: ['error-snackbar']
    }).onAction();
  }
}

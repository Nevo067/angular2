import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Effect, getEffectConditionsForDisplay } from '../../../../core/models';

@Component({
  selector: 'app-effect-details-dialog',
  templateUrl: './effect-details-dialog.component.html',
  styleUrls: ['./effect-details-dialog.component.css'],
  standalone: false
})
export class EffectDetailsDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<EffectDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { effect: Effect }
  ) {}

  get conditionRows(): { id: number; nameCondition?: string; description?: string }[] {
    return getEffectConditionsForDisplay(this.data.effect);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

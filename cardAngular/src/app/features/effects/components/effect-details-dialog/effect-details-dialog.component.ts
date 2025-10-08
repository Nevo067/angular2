import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Effect } from '../../../../core/models';

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

  onClose(): void {
    this.dialogRef.close();
  }
}

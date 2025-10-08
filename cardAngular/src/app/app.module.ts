import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardListComponent } from './features/cards/components/card-list/card-list.component';
import { CardEditDialogComponent } from './features/cards/components/card-edit-dialog/card-edit-dialog.component';
import { ActionListComponent } from './features/actions/components/action-list/action-list.component';
import { ActionEditDialogComponent } from './features/actions/components/action-edit-dialog/action-edit-dialog.component';
import { ConditionListComponent } from './features/conditions/components/condition-list/condition-list.component';
import { ConditionEditDialogComponent } from './features/conditions/components/condition-edit-dialog/condition-edit-dialog.component';
import { EffectListComponent } from './features/effects/components/effect-list/effect-list.component';
import { EffectEditDialogComponent } from './features/effects/components/effect-edit-dialog/effect-edit-dialog.component';
import { EffectDetailsDialogComponent } from './features/effects/components/effect-details-dialog/effect-details-dialog.component';
import { EffectRelationsDialogComponent } from './features/effects/components/effect-relations-dialog/effect-relations-dialog.component';
import { ConditionRelationsDialogComponent } from './features/conditions/components/condition-relations-dialog/condition-relations-dialog.component';
import { NavigationComponent } from './shared/components/navigation/navigation.component';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';

// Shared Components
import { DataTableComponent } from './shared/components/data-table/data-table.component';

@NgModule({
  declarations: [
    AppComponent,
    CardListComponent,
    CardEditDialogComponent,
    ActionListComponent,
    ActionEditDialogComponent,
    ConditionListComponent,
    ConditionEditDialogComponent,
    EffectListComponent,
    EffectEditDialogComponent,
    EffectDetailsDialogComponent,
    EffectRelationsDialogComponent,
    ConditionRelationsDialogComponent,
    NavigationComponent,
    DataTableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    // Angular Material Modules
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSliderModule,
    MatExpansionModule,
    MatTabsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    RouterModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

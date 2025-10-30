import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardListComponent } from './features/cards/components/card-list/card-list.component';
import { ActionListComponent } from './features/actions/components/action-list/action-list.component';
import { ConditionListComponent } from './features/conditions/components/condition-list/condition-list.component';
import { ConditionParametersPageComponent } from './features/conditions/components/condition-parameters-page/condition-parameters-page.component';
import { EffectListComponent } from './features/effects/components/effect-list/effect-list.component';
import { ActionParametersPageComponent } from './features/actions/components/action-parameters-page/action-parameters-page.component';

const routes: Routes = [
  { path: '', redirectTo: '/cards', pathMatch: 'full' },
  { path: 'cards', component: CardListComponent },
  { path: 'actions', component: ActionListComponent },
  { path: 'actions/:id/parameters', component: ActionParametersPageComponent },
  { path: 'conditions', component: ConditionListComponent },
  { path: 'conditions/:id/parameters', component: ConditionParametersPageComponent },
  { path: 'effects', component: EffectListComponent },
  { path: '**', redirectTo: '/cards' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

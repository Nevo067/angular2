import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardListComponent } from './features/cards/components/card-list/card-list.component';
import { ActionListComponent } from './features/actions/components/action-list/action-list.component';
import { ConditionListComponent } from './features/conditions/components/condition-list/condition-list.component';
import { ConditionParametersPageComponent } from './features/conditions/components/condition-parameters-page/condition-parameters-page.component';
import { EffectListComponent } from './features/effects/components/effect-list/effect-list.component';
import { EffectParametersPageComponent } from './features/effects/components/effect-parameters-page/effect-parameters-page.component';
import { ActionParametersPageComponent } from './features/actions/components/action-parameters-page/action-parameters-page.component';
import { ParameterDefinitionListComponent } from './features/parameters/components/parameter-definition-list/parameter-definition-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/cards', pathMatch: 'full' },
  { path: 'cards', component: CardListComponent },
  { path: 'actions', component: ActionListComponent },
  { path: 'actions/:id/parameters', component: ActionParametersPageComponent },
  { path: 'conditions', component: ConditionListComponent },
  { path: 'conditions/:id/parameters', component: ConditionParametersPageComponent },
  { path: 'effects', component: EffectListComponent },
  { path: 'effects/:id/parameters', component: EffectParametersPageComponent },
  { path: 'parameters', component: ParameterDefinitionListComponent },
  { path: '**', redirectTo: '/cards' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

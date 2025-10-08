import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardListComponent } from './features/cards/components/card-list/card-list.component';
import { ActionListComponent } from './features/actions/components/action-list/action-list.component';
import { ConditionListComponent } from './features/conditions/components/condition-list/condition-list.component';
import { EffectListComponent } from './features/effects/components/effect-list/effect-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/cards', pathMatch: 'full' },
  { path: 'cards', component: CardListComponent },
  { path: 'actions', component: ActionListComponent },
  { path: 'conditions', component: ConditionListComponent },
  { path: 'effects', component: EffectListComponent },
  { path: '**', redirectTo: '/cards' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

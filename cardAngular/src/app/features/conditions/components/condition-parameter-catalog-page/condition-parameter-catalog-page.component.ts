import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConditionParameterCatalogService, ParameterDefinitionService } from '../../../../core/services';
import { ConditionParameterCatalogEntryDTO, ParameterDefinitionDTO } from '../../../../core/models';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';

@Component({
  selector: 'app-condition-parameter-catalog-page',
  templateUrl: './condition-parameter-catalog-page.component.html',
  styleUrls: ['./condition-parameter-catalog-page.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ConditionParameterCatalogPageComponent implements OnInit {
  conditionId!: number;
  definitions: ParameterDefinitionDTO[] = [];
  links: ConditionParameterCatalogEntryDTO[] = [];
  loading = true;
  busyCodes = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private defs: ParameterDefinitionService,
    private catalog: ConditionParameterCatalogService,
    private ui: UiFeedbackService
  ) {}

  ngOnInit(): void {
    this.conditionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      definitions: this.defs.listDefinitions(),
      links: this.catalog.list(this.conditionId).pipe(catchError(() => of([] as ConditionParameterCatalogEntryDTO[])))
    }).subscribe({
      next: ({ definitions, links }) => {
        this.definitions = definitions;
        this.links = links;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.ui.showError('✕ Erreur lors du chargement');
      }
    });
  }

  isLinked(code: string): boolean {
    return this.links.some(l => l.parameterDefinitionCode === code);
  }

  private linkIdForCode(code: string): number | undefined {
    return this.links.find(l => l.parameterDefinitionCode === code)?.id;
  }

  toggleDefinition(def: ParameterDefinitionDTO, checked: boolean): void {
    const code = def.code;
    if (this.busyCodes.has(code)) {
      return;
    }
    this.busyCodes.add(code);

    if (checked) {
      this.catalog.add(this.conditionId, { parameterDefinitionCode: code }).subscribe({
        next: row => {
          if (!this.links.some(l => l.id === row.id)) {
            this.links = [...this.links, row];
          }
          this.busyCodes.delete(code);
        },
        error: () => {
          this.busyCodes.delete(code);
          this.ui.showError('✕ Impossible d’ajouter le paramètre');
        }
      });
    } else {
      const id = this.linkIdForCode(code);
      if (id == null) {
        this.busyCodes.delete(code);
        return;
      }
      this.catalog.remove(this.conditionId, id).subscribe({
        next: () => {
          this.links = this.links.filter(l => l.id !== id);
          this.busyCodes.delete(code);
        },
        error: () => {
          this.busyCodes.delete(code);
          this.ui.showError('✕ Impossible de retirer le paramètre');
        }
      });
    }
  }

  isBusy(code: string): boolean {
    return this.busyCodes.has(code);
  }
}

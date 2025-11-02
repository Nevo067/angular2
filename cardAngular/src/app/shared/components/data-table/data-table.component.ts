import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, AfterViewInit, ViewChild, ChangeDetectorRef, SimpleChanges, TemplateRef, ContentChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableConfig, TableColumn, TableAction, TableState } from '../../models/table-config.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
  standalone: false,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class DataTableComponent<T = any> implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() config!: TableConfig<T>;
  @Input() data: T[] = [];
  @Input() loading = false;
  @ContentChild('expandedRow') expandedRowTemplate?: TemplateRef<any>;

  @Output() actionClick = new EventEmitter<{ action: string; row: T; index: number }>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<T>();
  displayedColumns: string[] = [];
  globalFilterControl = new FormControl('');
  selectedRows: T[] = [];
  expandedRows = new Set<T>();

  private destroy$ = new Subject<void>();
  private tableState: TableState = {
    page: 0,
    pageSize: 10,
    sortColumn: '',
    sortDirection: 'asc',
    globalFilter: '',
    selectedRows: []
  };

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeTable();
    this.setupCustomFilter();
    this.setupGlobalFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.dataSource.data = changes['data'].currentValue;
    }
  }

  ngAfterViewInit(): void {
    this.setupSorting();
    this.setupPagination();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTable(): void {
    this.dataSource.data = this.data;
    this.setupDisplayedColumns();
  }

  private setupDisplayedColumns(): void {
    this.displayedColumns = this.config.columns.map(col => col.key);

    if (this.config.selection?.enabled) {
      this.displayedColumns.unshift('select');
    }

    if (this.config.expandable?.enabled) {
      this.displayedColumns.unshift('expand');
    }

    if (this.config.actions && this.config.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
  }

  private setupSorting(): void {
    if (this.config.sorting?.enabled && this.sort) {
      this.dataSource.sort = this.sort;

      if (this.config.sorting.defaultSort && this.config.sorting.defaultSort.column) {
        // Utiliser setTimeout pour éviter l'erreur de détection des changements
        setTimeout(() => {
          if (this.sort && this.config.sorting?.defaultSort) {
            this.sort.active = this.config.sorting.defaultSort.column;
            this.sort.direction = this.config.sorting.defaultSort.direction;
            this.cdr.detectChanges();
          }
        }, 0);
      }
    }
  }

  private setupPagination(): void {
    if (this.config.pagination && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  private setupGlobalFilter(): void {
    if (this.config.filtering?.globalFilter) {
      this.globalFilterControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(value => {
          this.tableState.globalFilter = value || '';
          this.applyGlobalFilter();
        });
    }
  }

  private applyGlobalFilter(): void {
    this.dataSource.filter = this.tableState.globalFilter.trim().toLowerCase();
  }

  // Fonction de filtrage personnalisée pour une recherche plus intelligente
  private setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: T, filter: string) => {
      if (!filter) return true;

      const searchTerm = filter.toLowerCase();

      // Recherche dans toutes les colonnes de type texte
      return this.config.columns.some(column => {
        const value = data[column.key as keyof T];
        if (value === null || value === undefined) return false;

        // Convertir la valeur en chaîne et la formater si nécessaire
        let searchValue = '';
        if (column.formatter) {
          searchValue = column.formatter(value, data).toLowerCase();
        } else {
          searchValue = String(value).toLowerCase();
        }

        return searchValue.includes(searchTerm);
      });
    };
  }

  onActionClick(action: TableAction, row: T, index: number): void {
    this.actionClick.emit({ action: action.key, row, index });
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  onSelectionChange(selectedRows: T[]): void {
    this.tableState.selectedRows = selectedRows;
    this.selectionChange.emit(selectedRows);
  }

  onPageChange(event: PageEvent): void {
    this.tableState.page = event.pageIndex;
    this.tableState.pageSize = event.pageSize;
    this.pageChange.emit(event);
  }

  onSortChange(sort: Sort): void {
    this.tableState.sortColumn = sort.active;
    this.tableState.sortDirection = sort.direction as 'asc' | 'desc';
    this.sortChange.emit(sort);
  }

  isActionDisabled(action: TableAction, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  isActionHidden(action: TableAction, row: T): boolean {
    return action.hidden ? action.hidden(row) : false;
  }

  /**
   * Nettoie une URL d'image en supprimant les guillemets et autres caractères indésirables
   */
  cleanImageUrl(url: string): string {
    if (!url) return url;

    // Supprimer les guillemets et les caractères d'encodage
    let cleanUrl = url.replace(/"/g, '').replace(/%22/g, '');

    // Supprimer les espaces en début et fin
    cleanUrl = cleanUrl.trim();

    return cleanUrl;
  }

  formatCellValue(column: TableColumn, value: any, row: T): string {
    if (column.formatter) {
      return column.formatter(value, row);
    }

    switch (column.type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'number':
        return value?.toString() || '0';
      default:
        return value?.toString() || '';
    }
  }

  getChipConfig(column: TableColumn, value: any): any {
    if (column.type === 'chip' && column.chipConfig) {
      return column.chipConfig;
    }
    return null;
  }

  refresh(): void {
    this.dataSource.data = [...this.data];
  }

  getTableState(): TableState {
    return { ...this.tableState };
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selectedRows.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Whether the selection has any value. */
  hasValue(): boolean {
    return this.selectedRows.length > 0;
  }

  /** Whether a row is selected. */
  isSelected(row: T): boolean {
    return this.selectedRows.includes(row);
  }

  /** Toggle selection of a row. */
  toggle(row: T): void {
    const index = this.selectedRows.indexOf(row);
    if (index > -1) {
      this.selectedRows.splice(index, 1);
    } else {
      this.selectedRows.push(row);
    }
    this.onSelectionChange(this.selectedRows);
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedRows = [];
    } else {
      this.selectedRows = [...this.dataSource.data];
    }
    this.onSelectionChange(this.selectedRows);
  }

  /** Toggle expansion of a row. */
  toggleRow(row: T, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedRows.has(row)) {
      this.expandedRows.delete(row);
    } else {
      this.expandedRows.add(row);
    }
  }

  /** Check if a row is expanded. */
  isExpanded(row: T): boolean {
    return this.expandedRows.has(row);
  }

  /** Function to determine if expanded row should be shown */
  shouldShowExpandedRow = (index: number, row: T): boolean => {
    return !!(this.config.expandable?.enabled && this.isExpanded(row));
  };
}

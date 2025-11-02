/**
 * Configuration d'une colonne de tableau
 */
export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'image' | 'chip' | 'actions';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any, row: any) => string;
  chipConfig?: {
    color: string;
    textColor?: string;
  };
}

/**
 * Configuration des actions du tableau
 */
export interface TableAction {
  key: string;
  label: string;
  icon: string;
  color: 'primary' | 'accent' | 'warn' | 'basic';
  tooltip?: string;
  disabled?: (row: any) => boolean;
  hidden?: (row: any) => boolean;
}

/**
 * Configuration complète du tableau
 */
export interface TableConfig<T = any> {
  columns: TableColumn[];
  actions?: TableAction[];
  pagination?: {
    pageSize: number;
    pageSizeOptions: number[];
    showFirstLastButtons: boolean;
  };
  selection?: {
    enabled: boolean;
    multiple: boolean;
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: {
      column: string;
      direction: 'asc' | 'desc';
    };
  };
  filtering?: {
    enabled: boolean;
    globalFilter?: boolean;
  };
  expandable?: {
    enabled: boolean;
    expandOnClick?: boolean;
  };
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * État du tableau
 */
export interface TableState {
  page: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  globalFilter: string;
  selectedRows: any[];
}

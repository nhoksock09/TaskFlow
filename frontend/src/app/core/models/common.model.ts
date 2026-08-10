export interface SelectOption<T = string> {
  label: string;
  value: T;
}


export interface Column {
  field: string;
  header: string;
  class: string;
  sortable: boolean;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export interface PaginatorState {
  page?: number;
  first?: number;
  rows?: number;
  pageCount?: number;
}

export interface BaseDocument {
  _id?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

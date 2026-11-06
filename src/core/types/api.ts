/**
 * Canonical frontend representation of the Spring Boot REST response envelope.
 *
 * The shared apiClient unwraps Axios' response object, so feature services receive
 * this envelope directly from the backend.
 */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: string[] | null;
  timestamp?: string | null;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: string[] | null;
  data?: unknown;
  timestamp?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Spring Data Page-style payload used by the /questions endpoint.
 */
export interface ApiPage<T> {
  content: T[];
  pageable?: unknown;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  pageSize?: number;
  pageNumber?: number;
  sort?: unknown;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

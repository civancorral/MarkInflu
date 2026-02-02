// Auth types
export * from './auth';

// User & Profile types
export * from './user';

// Campaign types
export * from './campaign';

// Enums
export * from './enums';

// Common API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?:
    | string
    | {
        code: string;
        message: string;
        details?: Record<string, unknown>;
      };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

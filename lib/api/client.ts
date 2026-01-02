import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import { ErrorDetails } from '../types';
import { authClient } from '../auth/client';

let onUnauthorized: (() => void) | undefined;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorized = callback;
};

// API Response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | {
    code: string;
    message: string;
    details?: ErrorDetails;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Auth request interceptor - adds session cookie to requests
const authRequestInterceptor = (config: InternalAxiosRequestConfig) => {
  const cookies = authClient.getCookie();

  if (cookies) {
    config.headers.set('Cookie', cookies);
  }

  return config;
};

// Request interceptor for debugging
const requestInterceptor = (config: InternalAxiosRequestConfig) => config;

// Response interceptor for debugging and error handling
const responseInterceptor = (response: AxiosResponse) => response;

// Error interceptor
const errorInterceptor = (error: AxiosError) => {
  // Handle network errors
  if (!error.response) {
    throw new ApiError(
      'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
      'NETWORK_ERROR',
      0
    );
  }

  // Handle API errors
  const { status, data } = error.response;

  // Handle unauthorized (session expired or invalid)
  if (status === 401) {
    onUnauthorized?.();
    authClient.signOut();
  }

  // Type guard for API error response
  const isApiErrorResponse = (data: unknown): data is ApiResponse => {
    return typeof data === 'object' && data !== null && ('success' in data || 'error' in data || 'message' in data);
  };

  const apiData = isApiErrorResponse(data) ? data : { success: false, message: 'Bilinmeyen hata' };
  const errorInfo = typeof apiData.error === 'object' ? apiData.error : { code: 'UNKNOWN_ERROR', message: apiData.error || apiData.message || 'Bilinmeyen hata' };

  throw new ApiError(
    errorInfo.message,
    errorInfo.code,
    status,
    errorInfo.details
  );
};

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: ENV.API_BASE_URL,
    timeout: ENV.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Add interceptors
  // Auth interceptor first to add session cookie
  client.interceptors.request.use(authRequestInterceptor);
  client.interceptors.request.use(requestInterceptor);
  client.interceptors.response.use(responseInterceptor, errorInterceptor);

  return client;
};

// Export singleton instance
export const apiClient = createApiClient();

// Export utility functions
export const api = {
  // GET request
  get: async <T = unknown>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, { params });
    return response.data;
  },

  // POST request
  post: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data);
    return response.data;
  },

  // PUT request
  put: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data);
    return response.data;
  },

  // DELETE request
  delete: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, { data });
    return response.data;
  },

  // PATCH request
  patch: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data);
    return response.data;
  },

  // File upload (multipart/form-data)
  upload: async <T = unknown>(url: string, formData: FormData): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

/**
 * Raw download helper for binary responses (e.g., PDFs)
 */
export const download = async (
  url: string,
  params?: Record<string, unknown>
): Promise<AxiosResponse<ArrayBuffer>> => {
  return apiClient.get<ArrayBuffer>(url, {
    params,
    responseType: 'arraybuffer',
    headers: {
      Accept: 'application/pdf',
    },
  });
};

export default api;

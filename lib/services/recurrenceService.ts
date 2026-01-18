import { api, ApiError, ApiResponse } from '../api/client';
import type { RecurrenceRule, RecurrenceRuleData, UpdateRecurrenceRuleData } from '../schemas/recurrenceSchema';
import type { Event } from '../types';

/**
 * Recurrence Service - Manages all recurrence rule API operations
 */
export class RecurrenceService {
  private baseUrl = '/api/recurrence-rules';

  /**
   * Get all recurrence rules for the current user
   */
  async getRules(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    petId?: string;
  }): Promise<ApiResponse<RecurrenceRule[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params?.petId) queryParams.append('petId', params.petId);

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get<RecurrenceRule[]>(url);

      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.recurrence.fetchSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.recurrence.fetchError',
        },
      };
    }
  }

  /**
   * Get a single recurrence rule by ID
   */
  async getRuleById(id: string): Promise<ApiResponse<RecurrenceRule>> {
    try {
      const response = await api.get<RecurrenceRule>(`${this.baseUrl}/${id}`);

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.recurrence.fetchOneSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.recurrence.notFound',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.recurrence.fetchError',
        },
      };
    }
  }

  /**
   * Create a new recurrence rule
   */
  async createRule(data: RecurrenceRuleData): Promise<ApiResponse<{ rule: RecurrenceRule; eventsCreated: number }>> {
    try {
      const response = await api.post<{ rule: RecurrenceRule; eventsCreated: number }>(this.baseUrl, data);

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.recurrence.createSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'CREATE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.recurrence.createError',
        },
      };
    }
  }

  /**
   * Update a recurrence rule
   */
  async updateRule(id: string, data: UpdateRecurrenceRuleData): Promise<ApiResponse<{ rule: RecurrenceRule; eventsUpdated: number }>> {
    try {
      const response = await api.put<{ rule: RecurrenceRule; eventsUpdated: number }>(`${this.baseUrl}/${id}`, data);

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.recurrence.updateSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.recurrence.notFoundUpdate',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'UPDATE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.recurrence.updateError',
        },
      };
    }
  }

  /**
   * Delete a recurrence rule
   */
  async deleteRule(id: string): Promise<ApiResponse<{ message: string; eventsDeleted: number }>> {
    try {
      const response = await api.delete<{ message: string; eventsDeleted: number }>(`${this.baseUrl}/${id}`);

      return {
        success: true,
        data: response.data,
        message: 'serviceResponse.recurrence.deleteSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.recurrence.notFoundDelete',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'DELETE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.recurrence.deleteError',
        },
      };
    }
  }

  /**
   * Regenerate events for a recurrence rule
   */
  async regenerateEvents(id: string): Promise<ApiResponse<{ eventsDeleted: number; eventsCreated: number }>> {
    try {
      const response = await api.post<{ eventsDeleted: number; eventsCreated: number }>(`${this.baseUrl}/${id}/regenerate`, {});

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.recurrence.regenerateSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'REGENERATE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'REGENERATE_ERROR',
          message: 'serviceResponse.recurrence.regenerateError',
        },
      };
    }
  }

  /**
   * Get events for a specific recurrence rule
   */
  async getEventsByRuleId(id: string, options?: { includePast?: boolean; limit?: number }): Promise<ApiResponse<Event[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.includePast) queryParams.append('includePast', 'true');
      if (options?.limit) queryParams.append('limit', String(options.limit));

      const url = queryParams.toString() 
        ? `${this.baseUrl}/${id}/events?${queryParams}` 
        : `${this.baseUrl}/${id}/events`;
      
      const response = await api.get<Event[]>(url);

      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.recurrence.eventsSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.recurrence.eventsError',
        },
      };
    }
  }

  /**
   * Add an exception (exclude a specific date)
   */
  async addException(id: string, date: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<{ message: string }>(`${this.baseUrl}/${id}/exceptions`, { date });

      return {
        success: true,
        data: response.data,
        message: 'serviceResponse.recurrence.exceptionSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'EXCEPTION_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'EXCEPTION_ERROR',
          message: 'serviceResponse.recurrence.exceptionError',
        },
      };
    }
  }
}

// Singleton instance
export const recurrenceService = new RecurrenceService();

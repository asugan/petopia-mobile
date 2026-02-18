import type { ApiResponse } from '@/lib/contracts/api';
import { recurrenceRepository } from '@/lib/repositories/recurrenceRepository';
import type {
  RecurrenceRule,
  RecurrenceRuleData,
  UpdateRecurrenceRuleData,
} from '@/lib/schemas/recurrenceSchema';
import type { Event } from '@/lib/types';

/**
 * Recurrence Service - Manages all recurrence rule operations
 */
export class RecurrenceService {
  async getRules(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    petId?: string;
  }): Promise<ApiResponse<RecurrenceRule[]>> {
    try {
      const rules = recurrenceRepository.getRules(params);

      return {
        success: true,
        data: rules,
        message: 'serviceResponse.recurrence.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.recurrence.fetchError',
        },
      };
    }
  }

  async getRuleById(id: string): Promise<ApiResponse<RecurrenceRule>> {
    try {
      const rule = recurrenceRepository.getRuleById(id);

      if (!rule) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.recurrence.notFound',
          },
        };
      }

      return {
        success: true,
        data: rule,
        message: 'serviceResponse.recurrence.fetchOneSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.recurrence.fetchError',
        },
      };
    }
  }

  async createRule(data: RecurrenceRuleData): Promise<ApiResponse<{ rule: RecurrenceRule; eventsCreated: number }>> {
    try {
      const result = recurrenceRepository.createRule(data);

      return {
        success: true,
        data: result,
        message: 'serviceResponse.recurrence.createSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.recurrence.createError',
        },
      };
    }
  }

  async updateRule(id: string, data: UpdateRecurrenceRuleData): Promise<ApiResponse<{ rule: RecurrenceRule; eventsUpdated: number }>> {
    try {
      const result = recurrenceRepository.updateRule(id, data);

      if (!result) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.recurrence.notFoundUpdate',
          },
        };
      }

      return {
        success: true,
        data: result,
        message: 'serviceResponse.recurrence.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.recurrence.updateError',
        },
      };
    }
  }

  async deleteRule(id: string): Promise<ApiResponse<{ message: string; eventsDeleted: number }>> {
    try {
      const result = recurrenceRepository.deleteRule(id);

      if (!result) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.recurrence.notFoundDelete',
          },
        };
      }

      return {
        success: true,
        data: result,
        message: 'serviceResponse.recurrence.deleteSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.recurrence.deleteError',
        },
      };
    }
  }

  async regenerateEvents(id: string): Promise<ApiResponse<{ eventsDeleted: number; eventsCreated: number }>> {
    try {
      const result = recurrenceRepository.regenerateEvents(id);

      if (!result) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.recurrence.notFound',
          },
        };
      }

      return {
        success: true,
        data: result,
        message: 'serviceResponse.recurrence.regenerateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'REGENERATE_ERROR',
          message: 'serviceResponse.recurrence.regenerateError',
        },
      };
    }
  }

  async getEventsByRuleId(id: string, options?: { includePast?: boolean; limit?: number }): Promise<ApiResponse<Event[]>> {
    try {
      const events = recurrenceRepository.getEventsByRuleId(id, options);

      return {
        success: true,
        data: events,
        message: 'serviceResponse.recurrence.eventsSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.recurrence.eventsError',
        },
      };
    }
  }

  async addException(id: string, date: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const result = recurrenceRepository.addException(id, date);

      if (!result) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.recurrence.notFound',
          },
        };
      }

      return {
        success: true,
        data: result,
        message: 'serviceResponse.recurrence.exceptionSuccess',
      };
    } catch {
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

export const recurrenceService = new RecurrenceService();

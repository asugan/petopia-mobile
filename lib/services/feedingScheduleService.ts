import { api, ApiError, ApiResponse } from '@/lib/api/client';
import { ENV } from '@/lib/config/env';
import type { FeedingSchedule, CreateFeedingScheduleInput, UpdateFeedingScheduleInput } from '@/lib/types';

// ============================================================================
// FEEDING NOTIFICATION TYPES
// ============================================================================

export interface FeedingNotification {
  _id: string;
  userId: string;
  scheduleId: string;
  petId: string;
  scheduledFor: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
  expoPushToken: string;
}

export interface FeedingReminderInput {
  reminderMinutes: number; // Minutes before feeding time to send reminder
}

export interface FeedingReminderResponse {
  success: boolean;
  notificationId?: string;
  scheduledFor: string;
}

export interface FeedingCompletionResponse {
  success: boolean;
  nextFeedingTime?: string;
}

export interface CancelFeedingReminderResponse {
  success: boolean;
  message?: string;
}

export interface FeedingScheduleNotificationsResponse {
  success: boolean;
  notifications: FeedingNotification[];
}

// ============================================================================
// FEEDING SCHEDULE SERVICE
// ============================================================================

/**
 * Feeding Schedule Service - Tüm feeding schedule API operasyonlarını yönetir
 */
export class FeedingScheduleService {
  /**
   * Yeni feeding schedule oluşturur
   */
  async createFeedingSchedule(data: CreateFeedingScheduleInput): Promise<ApiResponse<FeedingSchedule>> {
    try {
      const response = await api.post<FeedingSchedule>(ENV.ENDPOINTS.FEEDING_SCHEDULES, data);

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.feedingSchedule.createSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.feedingSchedule.createError',
        },
      };
      }
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.feedingSchedule.createError',
        },
      };
    }
  }

  /**
   * Tüm feeding scheduleleri listeler
   */
  async getFeedingSchedules(): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const response = await api.get<FeedingSchedule[]>(ENV.ENDPOINTS.FEEDING_SCHEDULES);

      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.feedingSchedule.fetchSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: 'serviceResponse.feedingSchedule.fetchError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchError',
        },
      };
    }
  }

  /**
   * Pet ID'ye göre feeding scheduleleri getirir
   */
  async getFeedingSchedulesByPetId(petId: string): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const response = await api.get<FeedingSchedule[]>(ENV.ENDPOINTS.FEEDING_SCHEDULES_BY_PET(petId));

      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.feedingSchedule.fetchSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: 'serviceResponse.feedingSchedule.fetchError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchError',
        },
      };
    }
  }

  /**
   * ID'ye göre tek bir feeding schedule getirir
   */
  async getFeedingScheduleById(id: string): Promise<ApiResponse<FeedingSchedule>> {
    try {
      const response = await api.get<FeedingSchedule>(ENV.ENDPOINTS.FEEDING_SCHEDULE_BY_ID(id));

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.feedingSchedule.fetchOneSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.feedingSchedule.notFound',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: 'serviceResponse.feedingSchedule.fetchError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchError',
        },
      };
    }
  }

  /**
   * Feeding schedule bilgilerini günceller
   */
  async updateFeedingSchedule(id: string, data: UpdateFeedingScheduleInput): Promise<ApiResponse<FeedingSchedule>> {
    try {
      const response = await api.put<FeedingSchedule>(ENV.ENDPOINTS.FEEDING_SCHEDULE_BY_ID(id), data);

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.feedingSchedule.updateSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.feedingSchedule.notFoundUpdate',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'UPDATE_ERROR',
            message: 'serviceResponse.feedingSchedule.updateError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.feedingSchedule.updateError',
        },
      };
    }
  }

  /**
   * Feeding schedule siler
   */
  async deleteFeedingSchedule(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(ENV.ENDPOINTS.FEEDING_SCHEDULE_BY_ID(id));

      return {
        success: true,
        message: 'serviceResponse.feedingSchedule.deleteSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.feedingSchedule.notFoundDelete',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'DELETE_ERROR',
            message: 'serviceResponse.feedingSchedule.deleteError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.feedingSchedule.deleteError',
        },
      };
    }
  }

  /**
   * Aktif feeding scheduleleri getirir
   */
  async getActiveFeedingSchedules(): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const response = await api.get<FeedingSchedule[]>(ENV.ENDPOINTS.ACTIVE_FEEDING_SCHEDULES);

      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.feedingSchedule.fetchActiveSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: 'serviceResponse.feedingSchedule.fetchActiveError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchActiveError',
        },
      };
    }
  }

  /**
   * Bugünün feeding scheduleleri getirir
   */
  async getTodayFeedingSchedules(): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const response = await api.get<FeedingSchedule[]>(ENV.ENDPOINTS.TODAY_FEEDING_SCHEDULES);

      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.feedingSchedule.fetchTodaySuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: 'serviceResponse.feedingSchedule.fetchTodayError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchTodayError',
        },
      };
    }
  }

  /**
   * Sonraki beslenme zamanını getirir
   */
  async getNextFeeding(): Promise<ApiResponse<FeedingSchedule | null>> {
    try {
      const response = await api.get<FeedingSchedule | null>(ENV.ENDPOINTS.NEXT_FEEDING);

      return {
        success: true,
        data: response.data || null,
        message: response.data ? 'serviceResponse.feedingSchedule.fetchNextFound' : 'serviceResponse.feedingSchedule.fetchNextNotFound',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: 'serviceResponse.feedingSchedule.fetchNextError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchNextError',
        },
      };
    }
  }

  /**
   * Pet'e ait aktif beslenme takvimlerini getirir
   */
  async getActiveFeedingSchedulesByPet(petId: string): Promise<ApiResponse<FeedingSchedule[]>> {
    const response = await this.getFeedingSchedulesByPetId(petId);
    if (!response.success) {
      return response;
    }
    const activeSchedules = (response.data || []).filter((schedule: FeedingSchedule) => schedule.isActive);

    return {
      success: true,
      data: activeSchedules,
      message: 'serviceResponse.feedingSchedule.fetchActiveByPetSuccess',
    };
  }

  /**
   * Beslenme takvimini aktif/pasif hale getirir
   */
  async toggleFeedingSchedule(id: string, isActive: boolean): Promise<ApiResponse<FeedingSchedule>> {
    const response = await this.updateFeedingSchedule(id, { isActive });

    return response;
  }

  /**
   * Besleme takvimi için notification durumunu getirir
   */
  async getFeedingScheduleNotifications(id: string): Promise<ApiResponse<FeedingScheduleNotificationsResponse>> {
    try {
      const response = await api.get<FeedingScheduleNotificationsResponse>(
        ENV.ENDPOINTS.FEEDING_SCHEDULE_NOTIFICATIONS(id)
      );

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.feedingSchedule.fetchNotificationsSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_NOTIFICATIONS_ERROR',
            message: 'serviceResponse.feedingSchedule.fetchNotificationsError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_NOTIFICATIONS_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchNotificationsError',
        },
      };
    }
  }

  /**
   * Besleme takvimi için manuel reminder tetikler
   */
  async triggerFeedingReminder(id: string, input: FeedingReminderInput): Promise<ApiResponse<FeedingReminderResponse>> {
    try {
      const response = await api.post<FeedingReminderResponse>(
        ENV.ENDPOINTS.FEEDING_SCHEDULE_REMINDER(id),
        input
      );

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.feedingSchedule.triggerReminderSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'TRIGGER_REMINDER_ERROR',
            message: 'serviceResponse.feedingSchedule.triggerReminderError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'TRIGGER_REMINDER_ERROR',
          message: 'serviceResponse.feedingSchedule.triggerReminderError',
        },
      };
    }
  }

  /**
   * Besleme tamamlandığında bildirir ve sonraki besleme zamanını alır
   */
  async completeFeeding(id: string): Promise<ApiResponse<FeedingCompletionResponse>> {
    try {
      const response = await api.post<FeedingCompletionResponse>(
        ENV.ENDPOINTS.FEEDING_SCHEDULE_COMPLETE(id)
      );

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.feedingSchedule.completeFeedingSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'COMPLETE_FEEDING_ERROR',
            message: 'serviceResponse.feedingSchedule.completeFeedingError',
            details: { rawMessage: error.message },
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'COMPLETE_FEEDING_ERROR',
          message: 'serviceResponse.feedingSchedule.completeFeedingError',
        },
      };
    }
  }

  async cancelFeedingReminder(id: string): Promise<ApiResponse<CancelFeedingReminderResponse>> {
    try {
      const response = await api.delete<CancelFeedingReminderResponse>(
        ENV.ENDPOINTS.FEEDING_SCHEDULE_CANCEL_REMINDER(id)
      );

      return {
        success: true,
        data: response.data,
        message: 'serviceResponse.feedingSchedule.cancelReminderSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'CANCEL_REMINDER_ERROR',
            message: 'serviceResponse.feedingSchedule.cancelReminderError',
            details: { rawMessage: error.message },
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'CANCEL_REMINDER_ERROR',
          message: 'serviceResponse.feedingSchedule.cancelReminderError',
        },
      };
    }
  }
}

// Singleton instance
export const feedingScheduleService = new FeedingScheduleService();

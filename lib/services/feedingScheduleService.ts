import type { ApiResponse } from '@/lib/contracts/api';
import { feedingScheduleRepository } from '@/lib/repositories/feedingScheduleRepository';
import type {
  CreateFeedingScheduleInput,
  FeedingSchedule,
  UpdateFeedingScheduleInput,
} from '@/lib/types';
import { detectDeviceTimezone } from '@/lib/utils/timezone';

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
  reminderMinutes: number;
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

export class FeedingScheduleService {
  async createFeedingSchedule(
    data: CreateFeedingScheduleInput,
  ): Promise<ApiResponse<FeedingSchedule>> {
    try {
      const schedule = feedingScheduleRepository.createFeedingSchedule(data);

      return {
        success: true,
        data: schedule,
        message: 'serviceResponse.feedingSchedule.createSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.feedingSchedule.createError',
        },
      };
    }
  }

  async getFeedingSchedules(): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const schedules = feedingScheduleRepository.getFeedingSchedules();

      return {
        success: true,
        data: schedules,
        message: 'serviceResponse.feedingSchedule.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchError',
        },
      };
    }
  }

  async getFeedingSchedulesByPetId(petId: string): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const schedules = feedingScheduleRepository.getFeedingSchedulesByPetId(petId);

      return {
        success: true,
        data: schedules,
        message: 'serviceResponse.feedingSchedule.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchError',
        },
      };
    }
  }

  async getFeedingScheduleById(id: string): Promise<ApiResponse<FeedingSchedule>> {
    try {
      const schedule = feedingScheduleRepository.getFeedingScheduleById(id);

      if (!schedule) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.feedingSchedule.notFound',
          },
        };
      }

      return {
        success: true,
        data: schedule,
        message: 'serviceResponse.feedingSchedule.fetchOneSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchError',
        },
      };
    }
  }

  async updateFeedingSchedule(
    id: string,
    data: UpdateFeedingScheduleInput,
  ): Promise<ApiResponse<FeedingSchedule>> {
    try {
      const updated = feedingScheduleRepository.updateFeedingSchedule(id, data);

      if (!updated) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.feedingSchedule.notFoundUpdate',
          },
        };
      }

      return {
        success: true,
        data: updated,
        message: 'serviceResponse.feedingSchedule.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.feedingSchedule.updateError',
        },
      };
    }
  }

  async deleteFeedingSchedule(id: string): Promise<ApiResponse<void>> {
    try {
      const deleted = feedingScheduleRepository.deleteFeedingSchedule(id);

      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.feedingSchedule.notFoundDelete',
          },
        };
      }

      return {
        success: true,
        message: 'serviceResponse.feedingSchedule.deleteSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.feedingSchedule.deleteError',
        },
      };
    }
  }

  async getActiveFeedingSchedules(): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const schedules = feedingScheduleRepository.getActiveFeedingSchedules();

      return {
        success: true,
        data: schedules,
        message: 'serviceResponse.feedingSchedule.fetchActiveSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchActiveError',
        },
      };
    }
  }

  async getTodayFeedingSchedules(): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const schedules = feedingScheduleRepository.getTodayFeedingSchedules(
        detectDeviceTimezone(),
      );

      return {
        success: true,
        data: schedules,
        message: 'serviceResponse.feedingSchedule.fetchTodaySuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchTodayError',
        },
      };
    }
  }

  async getNextFeeding(): Promise<ApiResponse<FeedingSchedule | null>> {
    try {
      const next = feedingScheduleRepository.getNextFeeding(detectDeviceTimezone());

      return {
        success: true,
        data: next,
        message: next
          ? 'serviceResponse.feedingSchedule.fetchNextFound'
          : 'serviceResponse.feedingSchedule.fetchNextNotFound',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchNextError',
        },
      };
    }
  }

  async getActiveFeedingSchedulesByPet(petId: string): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const schedules = feedingScheduleRepository.getActiveFeedingSchedulesByPet(petId);

      return {
        success: true,
        data: schedules,
        message: 'serviceResponse.feedingSchedule.fetchActiveByPetSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchError',
        },
      };
    }
  }

  async toggleFeedingSchedule(
    id: string,
    isActive: boolean,
  ): Promise<ApiResponse<FeedingSchedule>> {
    return this.updateFeedingSchedule(id, { isActive });
  }

  async getFeedingScheduleNotifications(
    id: string,
  ): Promise<ApiResponse<FeedingScheduleNotificationsResponse>> {
    try {
      const schedule = feedingScheduleRepository.getFeedingScheduleById(id);

      if (!schedule) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.feedingSchedule.notFound',
          },
        };
      }

      return {
        success: true,
        data: {
          success: true,
          notifications: [],
        },
        message: 'serviceResponse.feedingSchedule.fetchNotificationsSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_NOTIFICATIONS_ERROR',
          message: 'serviceResponse.feedingSchedule.fetchNotificationsError',
        },
      };
    }
  }

  async triggerFeedingReminder(
    id: string,
    input: FeedingReminderInput,
  ): Promise<ApiResponse<FeedingReminderResponse>> {
    try {
      const schedule = feedingScheduleRepository.getFeedingScheduleById(id);
      if (!schedule) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.feedingSchedule.notFound',
          },
        };
      }

      const now = new Date();
      const scheduledFor = new Date(now.getTime() + input.reminderMinutes * 60 * 1000).toISOString();

      return {
        success: true,
        data: {
          success: true,
          notificationId: `local-${id}-${Date.now()}`,
          scheduledFor,
        },
        message: 'serviceResponse.feedingSchedule.triggerReminderSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'TRIGGER_REMINDER_ERROR',
          message: 'serviceResponse.feedingSchedule.triggerReminderError',
        },
      };
    }
  }

  async completeFeeding(id: string): Promise<ApiResponse<FeedingCompletionResponse>> {
    try {
      const schedule = feedingScheduleRepository.getFeedingScheduleById(id);
      if (!schedule) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.feedingSchedule.notFound',
          },
        };
      }

      const nextFeeding = feedingScheduleRepository.getNextFeeding(detectDeviceTimezone());

      return {
        success: true,
        data: {
          success: true,
          nextFeedingTime: nextFeeding?.nextNotificationTime,
        },
        message: 'serviceResponse.feedingSchedule.completeFeedingSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'COMPLETE_FEEDING_ERROR',
          message: 'serviceResponse.feedingSchedule.completeFeedingError',
        },
      };
    }
  }

  async cancelFeedingReminder(
    id: string,
  ): Promise<ApiResponse<CancelFeedingReminderResponse>> {
    try {
      const schedule = feedingScheduleRepository.getFeedingScheduleById(id);
      if (!schedule) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.feedingSchedule.notFound',
          },
        };
      }

      return {
        success: true,
        data: {
          success: true,
          message: 'ok',
        },
        message: 'serviceResponse.feedingSchedule.cancelReminderSuccess',
      };
    } catch {
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

export const feedingScheduleService = new FeedingScheduleService();

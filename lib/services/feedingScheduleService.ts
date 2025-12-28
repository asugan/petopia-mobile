import { api, ApiError, ApiResponse } from '../api/client';
import { ENV } from '../config/env';
import type { FeedingSchedule, CreateFeedingScheduleInput, UpdateFeedingScheduleInput } from '../types';

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

      console.log('✅ Feeding schedule created successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'feedingSchedule.createSuccess',
      };
    } catch (error) {
      console.error('❌ Create feeding schedule error:', error);
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
          message: 'feedingSchedule.createError',
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

      console.log(`✅ ${response.data?.length || 0} feeding schedules loaded successfully`);
      return {
        success: true,
        data: response.data || [],
        message: 'feedingSchedule.fetchSuccess',
      };
    } catch (error) {
      console.error('❌ Get feeding schedules error:', error);
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
          message: 'feedingSchedule.fetchError',
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

      console.log(`✅ ${response.data?.length || 0} feeding schedules loaded for pet ${petId}`);
      return {
        success: true,
        data: response.data || [],
        message: 'feedingSchedule.fetchSuccess',
      };
    } catch (error) {
      console.error('❌ Get feeding schedules by pet error:', error);
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
          message: 'feedingSchedule.fetchError',
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

      console.log('✅ Feeding schedule loaded successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'feedingSchedule.fetchOneSuccess',
      };
    } catch (error) {
      console.error('❌ Get feeding schedule error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'feedingSchedule.notFound',
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
          message: 'feedingSchedule.fetchError',
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

      console.log('✅ Feeding schedule updated successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'feedingSchedule.updateSuccess',
      };
    } catch (error) {
      console.error('❌ Update feeding schedule error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'feedingSchedule.notFoundUpdate',
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
          message: 'feedingSchedule.updateError',
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

      console.log('✅ Feeding schedule deleted successfully:', id);
      return {
        success: true,
        message: 'feedingSchedule.deleteSuccess',
      };
    } catch (error) {
      console.error('❌ Delete feeding schedule error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'feedingSchedule.notFoundDelete',
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
          message: 'feedingSchedule.deleteError',
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

      console.log(`✅ ${response.data?.length || 0} active feeding schedules loaded`);
      return {
        success: true,
        data: response.data || [],
        message: 'feedingSchedule.fetchActiveSuccess',
      };
    } catch (error) {
      console.error('❌ Get active feeding schedules error:', error);
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
          message: 'feedingSchedule.fetchActiveError',
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

      console.log(`✅ ${response.data?.length || 0} today feeding schedules loaded`);
      return {
        success: true,
        data: response.data || [],
        message: 'feedingSchedule.fetchTodaySuccess',
      };
    } catch (error) {
      console.error('❌ Get today feeding schedules error:', error);
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
          message: 'feedingSchedule.fetchTodayError',
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

      console.log('✅ Next feeding loaded successfully');
      return {
        success: true,
        data: response.data || null,
        message: response.data ? 'feedingSchedule.fetchNextFound' : 'feedingSchedule.fetchNextNotFound',
      };
    } catch (error) {
      console.error('❌ Get next feeding error:', error);
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
          message: 'feedingSchedule.fetchNextError',
        },
      };
    }
  }

  /**
   * Pet'e ait aktif beslenme takvimlerini getirir
   */
  async getActiveFeedingSchedulesByPet(petId: string): Promise<ApiResponse<FeedingSchedule[]>> {
    try {
      const response = await this.getFeedingSchedulesByPetId(petId);
      if (!response.success) {
        return response;
      }
      const activeSchedules = (response.data || []).filter((schedule: FeedingSchedule) => schedule.isActive);

      console.log(`✅ ${activeSchedules.length} active schedules loaded for pet ${petId}`);
      return {
        success: true,
        data: activeSchedules,
        message: 'feedingSchedule.fetchActiveByPetSuccess',
      };
    } catch (error) {
      console.error('❌ Get active feeding schedules by pet error:', error);
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
          message: 'feedingSchedule.fetchActiveByPetError',
        },
      };
    }
  }

  /**
   * Beslenme takvimini aktif/pasif hale getirir
   */
  async toggleFeedingSchedule(id: string, isActive: boolean): Promise<ApiResponse<FeedingSchedule>> {
    try {
      const response = await this.updateFeedingSchedule(id, { isActive });

      console.log(`✅ Feeding schedule toggled successfully: ${id}`);
      return response;
    } catch (error) {
      console.error('❌ Toggle feeding schedule error:', error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'TOGGLE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'TOGGLE_ERROR',
          message: 'feedingSchedule.toggleError',
        },
      };
    }
  }
}

// Singleton instance
export const feedingScheduleService = new FeedingScheduleService();

import { api, ApiError, ApiResponse } from '../api/client';
import { ENV } from '../config/env';
import type { Event, CreateEventInput, UpdateEventInput } from '../types';

/**
 * Event Service - Tüm event API operasyonlarını yönetir
 */
export class EventService {
  /**
   * Yeni event oluşturur
   */
  async createEvent(data: CreateEventInput): Promise<ApiResponse<Event>> {
    try {
      const response = await api.post<Event>(ENV.ENDPOINTS.EVENTS, data);

      console.log('✅ Event created successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.event.createSuccess',
      };
    } catch (error) {
      console.error('❌ Create event error:', error);
      if (error instanceof ApiError) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.event.fetchError',
        },
      };
      }
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.event.createError',
        },
      };
    }
  }

  /**
   * Tüm eventleri listeler
   */
  async getEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<Event[]>(ENV.ENDPOINTS.EVENTS);

      console.log(`✅ ${response.data?.length || 0} events loaded successfully`);
      return {
        success: true,
        data: response.data || [],
        message: 'event.fetchSuccess',
      };
    } catch (error) {
      console.error('❌ Get events error:', error);
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
          message: 'event.fetchError',
        },
      };
    }
  }

  /**
   * Pet ID'ye göre eventleri getirir
   */
  async getEventsByPetId(petId: string): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<Event[]>(ENV.ENDPOINTS.EVENTS_BY_PET(petId));

      console.log(`✅ ${response.data?.length || 0} events loaded for pet ${petId}`);
      return {
        success: true,
        data: response.data || [],
        message: 'event.fetchSuccess',
      };
    } catch (error) {
      console.error('❌ Get events by pet error:', error);
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
          message: 'event.fetchError',
        },
      };
    }
  }

  /**
   * ID'ye göre tek bir event getirir
   */
  async getEventById(id: string): Promise<ApiResponse<Event>> {
    try {
      const response = await api.get<Event>(ENV.ENDPOINTS.EVENT_BY_ID(id));

      console.log('✅ Event loaded successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.event.fetchOneSuccess',
      };
    } catch (error) {
      console.error('❌ Get event error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.event.notFound',
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
          message: 'event.fetchError',
        },
      };
    }
  }

  /**
   * Event bilgilerini günceller
   */
  async updateEvent(id: string, data: UpdateEventInput): Promise<ApiResponse<Event>> {
    try {
      const response = await api.put<Event>(ENV.ENDPOINTS.EVENT_BY_ID(id), data);

      console.log('✅ Event updated successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.event.updateSuccess',
      };
    } catch (error) {
      console.error('❌ Update event error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.event.notFoundUpdate',
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
          message: 'serviceResponse.event.updateError',
        },
      };
    }
  }

  /**
   * Event siler
   */
  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(ENV.ENDPOINTS.EVENT_BY_ID(id));

      console.log('✅ Event deleted successfully:', id);
      return {
        success: true,
        message: 'serviceResponse.event.deleteSuccess',
      };
    } catch (error) {
      console.error('❌ Delete event error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.event.notFoundDelete',
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
          message: 'serviceResponse.event.deleteError',
        },
      };
    }
  }

  /**
   * Tarihe göre calendar eventlerini getirir
   */
  async getEventsByDate(date: string): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<Event[]>(ENV.ENDPOINTS.EVENTS_BY_DATE(date));

      console.log(`✅ ${response.data?.length || 0} events loaded for date ${date}`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.event.fetchTodaySuccess',
      };
    } catch (error) {
      console.error('❌ Get events by date error:', error);
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
          message: 'serviceResponse.event.fetchByDateError',
        },
      };
    }
  }

  /**
   * Yaklaşan eventleri getirir
   */
  async getUpcomingEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<Event[]>(ENV.ENDPOINTS.UPCOMING_EVENTS);

      console.log(`✅ ${response.data?.length || 0} upcoming events loaded`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.event.fetchUpcomingSuccess',
      };
    } catch (error) {
      console.error('❌ Get upcoming events error:', error);
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
          message: 'serviceResponse.event.fetchUpcomingError',
        },
      };
    }
  }

  /**
   * Bugünün eventlerini getirir
   */
  async getTodayEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<Event[]>(ENV.ENDPOINTS.TODAY_EVENTS);

      console.log(`✅ ${response.data?.length || 0} today events loaded`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.event.fetchByDateSuccess',
      };
    } catch (error) {
      console.error('❌ Get today events error:', error);
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
          message: 'serviceResponse.event.fetchTodayError',
        },
      };
    }
  }
}

// Singleton instance
export const eventService = new EventService();

import { api, ApiError, ApiResponse } from "../api/client";
import { ENV } from "../config/env";
import type { Event, CreateEventInput, UpdateEventInput } from "../types";

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

      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.event.createSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "serviceResponse.event.fetchError",
          },
        };
      }
      return {
        success: false,
        error: {
          code: "CREATE_ERROR",
          message: "serviceResponse.event.createError",
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

      return {
        success: true,
        data: response.data || [],
        message: "event.fetchSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "FETCH_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "event.fetchError",
        },
      };
    }
  }

  /**
   * Pet ID'ye göre eventleri getirir
   */
  async getEventsByPetId(petId: string): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<Event[]>(
        ENV.ENDPOINTS.EVENTS_BY_PET(petId),
      );

      return {
        success: true,
        data: response.data || [],
        message: "event.fetchSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "FETCH_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "event.fetchError",
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

      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.event.fetchOneSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "serviceResponse.event.notFound",
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || "FETCH_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "event.fetchError",
        },
      };
    }
  }

  /**
   * Event bilgilerini günceller
   */
  async updateEvent(
    id: string,
    data: UpdateEventInput,
  ): Promise<ApiResponse<Event>> {
    try {
      const response = await api.put<Event>(
        ENV.ENDPOINTS.EVENT_BY_ID(id),
        data,
      );

      return {
        success: true,
        data: response.data!,
        message: "serviceResponse.event.updateSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "serviceResponse.event.notFoundUpdate",
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || "UPDATE_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "UPDATE_ERROR",
          message: "serviceResponse.event.updateError",
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

      return {
        success: true,
        message: "serviceResponse.event.deleteSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "serviceResponse.event.notFoundDelete",
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || "DELETE_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "DELETE_ERROR",
          message: "serviceResponse.event.deleteError",
        },
      };
    }
  }

  /**
   * Tarihe göre calendar eventlerini getirir
   */
  async getEventsByDate(
    date: string,
    timezone?: string,
  ): Promise<ApiResponse<Event[]>> {
    try {
      const endpoint = timezone
        ? `${ENV.ENDPOINTS.EVENTS_BY_DATE(date)}?timezone=${encodeURIComponent(timezone)}`
        : ENV.ENDPOINTS.EVENTS_BY_DATE(date);

      const response = await api.get<Event[]>(endpoint);

      return {
        success: true,
        data: response.data || [],
        message: "serviceResponse.event.fetchTodaySuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "FETCH_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "serviceResponse.event.fetchByDateError",
        },
      };
    }
  }

  /**
   * Yaklaşan eventleri getirir
   */
  async getUpcomingEvents(timezone?: string): Promise<ApiResponse<Event[]>> {
    try {
      const endpoint = timezone
        ? `${ENV.ENDPOINTS.UPCOMING_EVENTS}?timezone=${encodeURIComponent(timezone)}`
        : ENV.ENDPOINTS.UPCOMING_EVENTS;
      const response = await api.get<Event[]>(endpoint);

      return {
        success: true,
        data: response.data || [],
        message: "serviceResponse.event.fetchUpcomingSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "FETCH_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "serviceResponse.event.fetchUpcomingError",
        },
      };
    }
  }

  /**
   * Bugünün eventlerini getirir
   */
  async getTodayEvents(timezone?: string): Promise<ApiResponse<Event[]>> {
    try {
      const endpoint = timezone
        ? `${ENV.ENDPOINTS.TODAY_EVENTS}?timezone=${encodeURIComponent(timezone)}`
        : ENV.ENDPOINTS.TODAY_EVENTS;
      const response = await api.get<Event[]>(endpoint);

      return {
        success: true,
        data: response.data || [],
        message: "serviceResponse.event.fetchByDateSuccess",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || "FETCH_ERROR",
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "serviceResponse.event.fetchTodayError",
        },
      };
    }
  }
}

// Singleton instance
export const eventService = new EventService();

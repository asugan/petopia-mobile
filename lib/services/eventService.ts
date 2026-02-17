import type { ApiResponse } from '@/lib/contracts/api';
import { eventRepository } from '@/lib/repositories/eventRepository';
import type { CreateEventInput, Event, UpdateEventInput } from '@/lib/types';

export class EventService {
  async createEvent(data: CreateEventInput): Promise<ApiResponse<Event>> {
    try {
      const event = eventRepository.createEvent(data);

      return {
        success: true,
        data: event,
        message: 'serviceResponse.event.createSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.event.createError',
        },
      };
    }
  }

  async getEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const events = eventRepository.getEvents();

      return {
        success: true,
        data: events,
        message: 'event.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'event.fetchError',
        },
      };
    }
  }

  async getEventsByPetId(petId: string): Promise<ApiResponse<Event[]>> {
    try {
      const events = eventRepository.getEventsByPetId(petId);

      return {
        success: true,
        data: events,
        message: 'event.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'event.fetchError',
        },
      };
    }
  }

  async getEventById(id: string): Promise<ApiResponse<Event>> {
    try {
      const event = eventRepository.getEventById(id);

      if (!event) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.event.notFound',
          },
        };
      }

      return {
        success: true,
        data: event,
        message: 'serviceResponse.event.fetchOneSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'event.fetchError',
        },
      };
    }
  }

  async updateEvent(
    id: string,
    data: UpdateEventInput,
  ): Promise<ApiResponse<Event>> {
    try {
      const updated = eventRepository.updateEvent(id, data);

      if (!updated) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.event.notFoundUpdate',
          },
        };
      }

      return {
        success: true,
        data: updated,
        message: 'serviceResponse.event.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.event.updateError',
        },
      };
    }
  }

  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    try {
      const deleted = eventRepository.deleteEvent(id);

      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.event.notFoundDelete',
          },
        };
      }

      return {
        success: true,
        message: 'serviceResponse.event.deleteSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.event.deleteError',
        },
      };
    }
  }

  async getEventsByDate(date: string, timezone?: string): Promise<ApiResponse<Event[]>> {
    try {
      const events = eventRepository.getEventsByDate(date, timezone);

      return {
        success: true,
        data: events,
        message: 'serviceResponse.event.fetchTodaySuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.event.fetchByDateError',
        },
      };
    }
  }

  async getUpcomingEvents(timezone?: string): Promise<ApiResponse<Event[]>> {
    try {
      const events = eventRepository.getUpcomingEvents(timezone);

      return {
        success: true,
        data: events,
        message: 'serviceResponse.event.fetchUpcomingSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.event.fetchUpcomingError',
        },
      };
    }
  }

  async getTodayEvents(timezone?: string): Promise<ApiResponse<Event[]>> {
    try {
      const events = eventRepository.getTodayEvents(timezone);

      return {
        success: true,
        data: events,
        message: 'serviceResponse.event.fetchByDateSuccess',
      };
    } catch {
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

export const eventService = new EventService();

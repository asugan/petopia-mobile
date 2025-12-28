import { api, ApiError, ApiResponse } from '../api/client';
import { ENV } from '../config/env';
import type { HealthRecord, CreateHealthRecordInput, UpdateHealthRecordInput } from '../types';

/**
 * Health Record Service - Tüm health record API operasyonlarını yönetir
 */
export class HealthRecordService {
  /**
   * Yeni health record oluşturur
   */
  async createHealthRecord(data: CreateHealthRecordInput): Promise<ApiResponse<HealthRecord>> {
    try {
      const response = await api.post<HealthRecord>(ENV.ENDPOINTS.HEALTH_RECORDS, data);

      console.log('✅ Health record created successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.healthRecord.createSuccess',
      };
    } catch (error) {
      console.error('❌ Create health record error:', error);
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
          message: 'serviceResponse.healthRecord.createError',
        },
      };
    }
  }

  /**
   * Tüm health recordları listeler
   */
  async getHealthRecords(): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const response = await api.get<HealthRecord[]>(ENV.ENDPOINTS.HEALTH_RECORDS);

      console.log(`✅ ${response.data?.length || 0} health records loaded successfully`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.healthRecord.fetchSuccess',
      };
    } catch (error) {
      console.error('❌ Get health records error:', error);
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
          message: 'serviceResponse.healthRecord.fetchError',
        },
      };
    }
  }

  /**
   * Pet ID'ye göre health recordları getirir
   */
  async getHealthRecordsByPetId(petId: string): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const response = await api.get<HealthRecord[]>(ENV.ENDPOINTS.HEALTH_RECORDS_BY_PET(petId));

      console.log(`✅ ${response.data?.length || 0} health records loaded for pet ${petId}`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.healthRecord.fetchSuccess',
      };
    } catch (error) {
      console.error('❌ Get health records by pet error:', error);
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
          message: 'serviceResponse.healthRecord.fetchError',
        },
      };
    }
  }

  /**
   * ID'ye göre tek bir health record getirir
   */
  async getHealthRecordById(id: string): Promise<ApiResponse<HealthRecord>> {
    try {
      const response = await api.get<HealthRecord>(ENV.ENDPOINTS.HEALTH_RECORD_BY_ID(id));

      console.log('✅ Health record loaded successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.healthRecord.fetchOneSuccess',
      };
    } catch (error) {
      console.error('❌ Get health record error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.healthRecord.notFound',
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
          message: 'serviceResponse.healthRecord.fetchError',
        },
      };
    }
  }

  /**
   * Health record bilgilerini günceller
   */
  async updateHealthRecord(id: string, data: UpdateHealthRecordInput): Promise<ApiResponse<HealthRecord>> {
    try {
      const response = await api.put<HealthRecord>(ENV.ENDPOINTS.HEALTH_RECORD_BY_ID(id), data);

      console.log('✅ Health record updated successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.healthRecord.updateSuccess',
      };
    } catch (error) {
      console.error('❌ Update health record error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.serviceResponse.healthRecord.notFoundUpdate',
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
          message: 'serviceResponse.healthRecord.updateError',
        },
      };
    }
  }

  /**
   * Health record siler
   */
  async deleteHealthRecord(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(ENV.ENDPOINTS.HEALTH_RECORD_BY_ID(id));

      console.log('✅ Health record deleted successfully:', id);
      return {
        success: true,
        message: 'serviceResponse.healthRecord.deleteSuccess',
      };
    } catch (error) {
      console.error('❌ Delete health record error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.serviceResponse.healthRecord.notFoundDelete',
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
          message: 'serviceResponse.healthRecord.deleteError',
        },
      };
    }
  }

  /**
   * Pet ID ve tip'e göre sağlık kayıtlarını getirir
   */
  async getHealthRecordsByType(petId: string, type: string): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const response = await this.getHealthRecordsByPetId(petId);
      if (!response.success) {
        return response;
      }
      const filteredRecords = (response.data || []).filter((record: HealthRecord) => record.type === type);

      console.log(`✅ ${filteredRecords.length} ${type} records loaded for pet ${petId}`);
      return {
        success: true,
        data: filteredRecords,
        message: 'serviceResponse.healthRecord.fetchByTypeSuccess',
      };
    } catch (error) {
      console.error('❌ Get health records by type error:', error);
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
          message: 'serviceResponse.healthRecord.fetchByTypeError',
        },
      };
    }
  }
}

// Singleton instance
export const healthRecordService = new HealthRecordService();

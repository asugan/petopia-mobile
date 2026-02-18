import type { ApiResponse } from '@/lib/contracts/api';
import { healthRecordRepository } from '@/lib/repositories/healthRecordRepository';
import type {
  CreateHealthRecordInput,
  HealthRecord,
  UpdateHealthRecordInput,
} from '@/lib/types';

export class HealthRecordService {
  async createHealthRecord(
    data: CreateHealthRecordInput,
  ): Promise<ApiResponse<HealthRecord>> {
    try {
      const record = healthRecordRepository.createHealthRecord(data);

      return {
        success: true,
        data: record,
        message: 'serviceResponse.healthRecord.createSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.healthRecord.createError',
        },
      };
    }
  }

  async getHealthRecords(): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const records = healthRecordRepository.getHealthRecords();

      return {
        success: true,
        data: records,
        message: 'serviceResponse.healthRecord.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.healthRecord.fetchError',
        },
      };
    }
  }

  async getHealthRecordsByPetId(petId: string): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const records = healthRecordRepository.getHealthRecordsByPetId(petId);

      return {
        success: true,
        data: records,
        message: 'serviceResponse.healthRecord.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.healthRecord.fetchError',
        },
      };
    }
  }

  async getHealthRecordById(id: string): Promise<ApiResponse<HealthRecord>> {
    try {
      const record = healthRecordRepository.getHealthRecordById(id);

      if (!record) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.healthRecord.notFound',
          },
        };
      }

      return {
        success: true,
        data: record,
        message: 'serviceResponse.healthRecord.fetchOneSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.healthRecord.fetchError',
        },
      };
    }
  }

  async updateHealthRecord(
    id: string,
    data: UpdateHealthRecordInput,
  ): Promise<ApiResponse<HealthRecord>> {
    try {
      const updated = healthRecordRepository.updateHealthRecord(id, data);

      if (!updated) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.healthRecord.notFoundUpdate',
          },
        };
      }

      return {
        success: true,
        data: updated,
        message: 'serviceResponse.healthRecord.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.healthRecord.updateError',
        },
      };
    }
  }

  async deleteHealthRecord(id: string): Promise<ApiResponse<void>> {
    try {
      const deleted = healthRecordRepository.deleteHealthRecord(id);

      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.healthRecord.notFoundDelete',
          },
        };
      }

      return {
        success: true,
        message: 'serviceResponse.healthRecord.deleteSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.healthRecord.deleteError',
        },
      };
    }
  }

  async getHealthRecordsByType(
    petId: string,
    type: string,
  ): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const records = healthRecordRepository
        .getHealthRecordsByPetId(petId)
        .filter((record) => record.type === type);

      return {
        success: true,
        data: records,
        message: 'serviceResponse.healthRecord.fetchByTypeSuccess',
      };
    } catch {
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

export const healthRecordService = new HealthRecordService();

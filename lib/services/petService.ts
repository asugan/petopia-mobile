import { api, ApiError, ApiResponse } from '../api/client';
import { ENV } from '../config/env';
import type { Pet, CreatePetInput, UpdatePetInput } from '../types';
import { normalizeToISOString } from '../utils/dateConversion';

/**
 * Pet Service - Tüm pet API operasyonlarını yönetir
 */
export class PetService {
  /**
   * Yeni pet oluşturur
   */
  async createPet(data: CreatePetInput): Promise<ApiResponse<Pet>> {
    try {
      // Clean up the data before sending to API
      const cleanedData = {
        ...data,
        birthDate: normalizeToISOString(data.birthDate),
        profilePhoto: data.profilePhoto || undefined,
      };

      const response = await api.post<Pet>(ENV.ENDPOINTS.PETS, cleanedData);

      console.log('✅ Pet created successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.pet.createSuccess',
      };
    } catch (error) {
      console.error('❌ Create pet error:', error);
      if (error instanceof ApiError) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.pet.fetchError',
        },
      };
      }
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.pet.createError',
        },
      };
    }
  }

  /**
   * Tüm petleri listeler (en yeni başa)
   * Supports pagination, filtering by type, search, and sorting
   */
  async getPets(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Pet[]>> {
    try {
      const queryParams: Record<string, string | number> = {};

      // Build query params from all available filters
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.type) queryParams.type = params.type;
      if (params?.search) queryParams.search = params.search;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

      const response = await api.get<Pet[]>(
        ENV.ENDPOINTS.PETS,
        Object.keys(queryParams).length > 0 ? queryParams : undefined
      );

      console.log(`✅ ${response.data?.length || 0} pets loaded successfully`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.pet.fetchSuccess',
      };
    } catch (error) {
      console.error('❌ Get pets error:', error);
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
          message: 'pet.fetchError',
        },
      };
    }
  }

  /**
   * ID'ye göre tek bir pet getirir
   */
  async getPetById(id: string): Promise<ApiResponse<Pet>> {
    try {
      const response = await api.get<Pet>(ENV.ENDPOINTS.PET_BY_ID(id));

      console.log('✅ Pet loaded successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.pet.fetchOneSuccess',
      };
    } catch (error) {
      console.error('❌ Get pet error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.pet.notFound',
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
          message: 'pet.fetchError',
        },
      };
    }
  }

  /**
   * Pet bilgilerini günceller
   */
  async updatePet(id: string, data: UpdatePetInput): Promise<ApiResponse<Pet>> {
    try {
      // Clean up the data before sending to API
      const updateData = {
        ...data,
        birthDate: normalizeToISOString(data.birthDate),
        profilePhoto: data.profilePhoto || undefined,
      };

      const response = await api.put<Pet>(ENV.ENDPOINTS.PET_BY_ID(id), updateData);

      console.log('✅ Pet updated successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.pet.updateSuccess',
      };
    } catch (error) {
      console.error('❌ Update pet error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.pet.notFoundUpdate',
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
          message: 'serviceResponse.pet.updateError',
        },
      };
    }
  }

  /**
   * Pet siler
   */
  async deletePet(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(ENV.ENDPOINTS.PET_BY_ID(id));

      console.log('✅ Pet deleted successfully:', id);
      return {
        success: true,
        message: 'serviceResponse.pet.deleteSuccess',
      };
    } catch (error) {
      console.error('❌ Delete pet error:', error);
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.pet.notFoundDelete',
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
          message: 'serviceResponse.pet.deleteError',
        },
      };
    }
  }

  /**
   * Petleri türe göre filtreler
   */
  async getPetsByType(type: string): Promise<ApiResponse<Pet[]>> {
    try {
      const response = await api.get<Pet[]>(ENV.ENDPOINTS.PETS, { type });

      console.log(`✅ ${response.data?.length || 0} pets of type ${type} loaded successfully`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.pet.fetchByTypeSuccess',
      };
    } catch (error) {
      console.error('❌ Get pets by type error:', error);
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
          message: 'pet.fetchError',
        },
      };
    }
  }

  /**
   * Pet arama (isime göre)
   */
  async searchPets(query: string): Promise<ApiResponse<Pet[]>> {
    try {
      const response = await api.get<Pet[]>(ENV.ENDPOINTS.PETS, { search: query });

      console.log(`✅ ${response.data?.length || 0} pets found for query: ${query}`);
      return {
        success: true,
        data: response.data || [],
        message: 'serviceResponse.pet.searchSuccess',
      };
    } catch (error) {
      console.error('❌ Search pets error:', error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'SEARCH_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'serviceResponse.pet.searchError',
        },
      };
    }
  }

  /**
   * Pet fotoğrafı yükler
   */
  async uploadPetPhoto(id: string, photoUri: string): Promise<ApiResponse<Pet>> {
    try {
      const formData = new FormData();
      // React Native FormData blob type
      const photoBlob = {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'pet-photo.jpg',
      } as unknown as Blob;
      formData.append('photo', photoBlob);

      const response = await api.upload<Pet>(ENV.ENDPOINTS.PET_PHOTO(id), formData);

      console.log('✅ Pet photo uploaded successfully:', response.data?._id);
      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.pet.uploadPhotoSuccess',
      };
    } catch (error) {
      console.error('❌ Upload pet photo error:', error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'UPLOAD_ERROR',
            message: error.message,
            details: error.details,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'serviceResponse.pet.uploadError',
        },
      };
    }
  }

  /**
   * Pet istatistiklerini getirir
   */
  async getPetStats(): Promise<ApiResponse<{
    total: number;
    byType: Record<string, number>;
    byGender: Record<string, number>;
    averageAge: number;
  }>> {
    try {
      // Backend'de bu endpoint olabilir ya da tüm petleri çekip hesaplayabiliriz
      const allPetsResponse = await api.get<Pet[]>(ENV.ENDPOINTS.PETS);
      const allPets = allPetsResponse.data || [];

      const byType: Record<string, number> = {};
      const byGender: Record<string, number> = {};
      let totalAge = 0;

      allPets.forEach(pet => {
        // Tür sayımı
        byType[pet.type] = (byType[pet.type] || 0) + 1;

        // Cinsiyet sayımı
        if (pet.gender) {
          byGender[pet.gender] = (byGender[pet.gender] || 0) + 1;
        }

        // Yaş hesaplama
        if (pet.birthDate) {
          const birthDate = new Date(pet.birthDate);
          const now = new Date();
          const ageInYears = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          totalAge += ageInYears;
        }
      });

      const averageAge = allPets.length > 0 ? totalAge / allPets.length : 0;

      console.log('✅ Pet stats calculated successfully');
      return {
        success: true,
        data: {
          total: allPets.length,
          byType,
          byGender,
          averageAge: Math.round(averageAge * 10) / 10, // 1 decimal basamak
        },
        message: 'serviceResponse.pet.statsCalculatedSuccess',
      };
    } catch (error) {
      console.error('❌ Get pet stats error:', error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'STATS_ERROR',
            message: error.message,
            details: error.details,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'serviceResponse.pet.statsError',
        },
      };
    }
  }
}

// Singleton instance
export const petService = new PetService();
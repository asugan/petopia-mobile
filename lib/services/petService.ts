import type { ApiResponse } from '@/lib/contracts/api';
import { petRepository } from '@/lib/repositories/petRepository';
import type { CreatePetInput, Pet, UpdatePetInput } from '@/lib/types';

export class PetService {
  async createPet(data: CreatePetInput): Promise<ApiResponse<Pet>> {
    try {
      const createdPet = petRepository.createPet(data);

      return {
        success: true,
        data: createdPet,
        message: 'serviceResponse.pet.createSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.pet.createError',
        },
      };
    }
  }

  async getPets(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Pet[]>> {
    try {
      const pets = petRepository.getPets({
        page: params?.page,
        limit: params?.limit,
        type: params?.type,
        search: params?.search,
        sortBy: params?.sortBy as 'name' | 'createdAt' | 'updatedAt' | 'type' | undefined,
        sortOrder: params?.sortOrder,
      });

      return {
        success: true,
        data: pets,
        message: 'serviceResponse.pet.fetchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.pet.fetchError',
        },
      };
    }
  }

  async getPetById(id: string): Promise<ApiResponse<Pet>> {
    try {
      const pet = petRepository.getPetById(id);

      if (!pet) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.pet.notFound',
          },
        };
      }

      return {
        success: true,
        data: pet,
        message: 'serviceResponse.pet.fetchOneSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.pet.fetchError',
        },
      };
    }
  }

  async updatePet(id: string, data: UpdatePetInput): Promise<ApiResponse<Pet>> {
    try {
      const updatedPet = petRepository.updatePet(id, data);

      if (!updatedPet) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.pet.notFoundUpdate',
          },
        };
      }

      return {
        success: true,
        data: updatedPet,
        message: 'serviceResponse.pet.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.pet.updateError',
        },
      };
    }
  }

  async deletePet(id: string): Promise<ApiResponse<void>> {
    try {
      const deleted = petRepository.deletePet(id);

      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.pet.notFoundDelete',
          },
        };
      }

      return {
        success: true,
        message: 'serviceResponse.pet.deleteSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.pet.deleteError',
        },
      };
    }
  }

  async getPetsByType(type: string): Promise<ApiResponse<Pet[]>> {
    return this.getPets({ type });
  }

  async searchPets(query: string): Promise<ApiResponse<Pet[]>> {
    try {
      const pets = petRepository.getPets({ search: query });

      return {
        success: true,
        data: pets,
        message: 'serviceResponse.pet.searchSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'serviceResponse.pet.searchError',
        },
      };
    }
  }

  async uploadPetPhoto(id: string, photoUri: string): Promise<ApiResponse<Pet>> {
    try {
      const updatedPet = petRepository.updatePet(id, { profilePhoto: photoUri });

      if (!updatedPet) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.pet.notFoundUpdate',
          },
        };
      }

      return {
        success: true,
        data: updatedPet,
        message: 'serviceResponse.pet.uploadPhotoSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'serviceResponse.pet.uploadError',
        },
      };
    }
  }

  async getPetStats(): Promise<ApiResponse<{
    total: number;
    byType: Record<string, number>;
    byGender: Record<string, number>;
    averageAge: number;
  }>> {
    try {
      const allPets = petRepository.getPets();

      const byType: Record<string, number> = {};
      const byGender: Record<string, number> = {};
      let totalAge = 0;

      allPets.forEach((pet) => {
        byType[pet.type] = (byType[pet.type] || 0) + 1;

        if (pet.gender) {
          byGender[pet.gender] = (byGender[pet.gender] || 0) + 1;
        }

        if (pet.birthDate) {
          const birthDate = new Date(pet.birthDate);
          const now = new Date();
          const ageInYears =
            (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          totalAge += ageInYears;
        }
      });

      const averageAge = allPets.length > 0 ? totalAge / allPets.length : 0;

      return {
        success: true,
        data: {
          total: allPets.length,
          byType,
          byGender,
          averageAge: Math.round(averageAge * 10) / 10,
        },
        message: 'serviceResponse.pet.statsCalculatedSuccess',
      };
    } catch {
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

export const petService = new PetService();

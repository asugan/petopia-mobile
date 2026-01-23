import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usePendingPetStore } from '@/stores/pendingPetStore';
import { useCreatePet } from './usePets';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { showToast } from '@/lib/toast/showToast';
import { PetCreateInput, PetCreateSchema } from '@/lib/schemas/petSchema';

const PENDING_PET_PROCESSING_KEY = ['pending-pet-processing'] as const;

interface UsePendingPetReturn {
  processPendingPet: (existingPetsCount?: number) => Promise<void>;
  isProcessing: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

export function usePendingPet(): UsePendingPetReturn {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { hasPendingPet, getPetData, clearPendingPet } = usePendingPetStore();
  const createPetMutation = useCreatePet();
  const { isInitialized } = useSubscriptionStore();

  const isProcessing = queryClient.getQueryData(PENDING_PET_PROCESSING_KEY) === true;
  const { isPending, isError, error } = createPetMutation;

  const processPendingPet = useCallback(async (existingPetsCount: number = 0) => {
    // If subscription system is not ready yet, skip processing
    // The pending pet will be processed after subscription is initialized
    if (!isInitialized) {
      return;
    }

    // If user already has pets, pending pet data is stale - clear it
    if (existingPetsCount > 0) {
      if (hasPendingPet) {
        clearPendingPet();
        showToast({
          type: 'info',
          title: t('pets.pendingPetSkipped'),
        });
      }
      return;
    }

    if (!hasPendingPet || isProcessing) {
      return;
    }

    const petData = getPetData();
    if (!petData) {
      clearPendingPet();
      return;
    }

    queryClient.setQueryData(PENDING_PET_PROCESSING_KEY, true);

    try {
      const apiData: PetCreateInput = PetCreateSchema().parse(petData);
      await createPetMutation.mutateAsync(apiData);
      clearPendingPet();
      showToast({
        type: 'success',
        title: t('pets.pendingPetCreated'),
      });
    } catch (error) {
      console.error('Pending pet creation failed:', error);
      showToast({
        type: 'error',
        title: t('pets.pendingPetError'),
      });
    } finally {
      queryClient.setQueryData(PENDING_PET_PROCESSING_KEY, false);
    }
  }, [
    hasPendingPet,
    isProcessing,
    getPetData,
    clearPendingPet,
    createPetMutation,
    t,
    queryClient,
    isInitialized,
  ]);

  return { processPendingPet, isProcessing, isPending, isError, error };
}

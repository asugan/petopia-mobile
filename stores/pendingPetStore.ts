import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PetCreateFormInput } from '@/lib/schemas/petSchema';

interface PendingPetState {
  petData: PetCreateFormInput | null;
  hasPendingPet: boolean;
}

interface PendingPetActions {
  setPendingPet: (data: PetCreateFormInput) => void;
  clearPendingPet: () => void;
  getPetData: () => PetCreateFormInput | null;
}

export const usePendingPetStore = create<PendingPetState & PendingPetActions>()(
  persist(
    (set, get) => ({
      petData: null,
      hasPendingPet: false,

      setPendingPet: (data) => set({ petData: data, hasPendingPet: true }),

      clearPendingPet: () => set({ petData: null, hasPendingPet: false }),

      getPetData: () => get().petData,
    }),
    {
      name: '@petopia_pending_pet_storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

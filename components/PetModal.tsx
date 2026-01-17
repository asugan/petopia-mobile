
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';
import { useCreatePet, useUpdatePet } from '@/lib/hooks/usePets';
import { Modal as RNModal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PetCreateInput, PetCreateFormInput, PetCreateSchema } from '../lib/schemas/petSchema';
import { Pet } from '../lib/types';
import { PetForm } from './forms/PetForm';
import { showToast } from '@/lib/toast/showToast';

interface PetModalProps {
  visible: boolean;
  pet?: Pet;
  onClose: () => void;
  onSuccess: () => void;
  testID?: string;
}

export function PetModal({
  visible,
  pet,
  onClose,
  onSuccess,
  testID,
}: PetModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = React.useState(false);

  // ✅ React Query hooks for server state
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();


  const handleSubmit = React.useCallback(async (data: PetCreateFormInput) => {
    try {
      // Transform form data to API format using the schema transformation
      const apiData: PetCreateInput = PetCreateSchema().parse(data);

      setLoading(true);
      if (pet) {
        // Pet güncelleme
        await updatePetMutation.mutateAsync({ _id: pet._id, data: apiData });
        showToast({ type: 'success', title: t('pets.updateSuccess') });
      } else {
        // Yeni pet oluşturma
        await createPetMutation.mutateAsync(apiData);
        showToast({ type: 'success', title: t('pets.saveSuccess') });
      }

      onSuccess();
      onClose();
    } catch (error) {
      const fallbackMessage = pet ? t('pets.updateError') : t('pets.createError');
      const errorMessage = error instanceof Error ? error.message : fallbackMessage;
      showToast({ type: 'error', title: fallbackMessage, message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [pet, createPetMutation, updatePetMutation, onSuccess, onClose, t]);

  const handleClose = React.useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [onClose, loading]);


  return (
    <>
      <RNModal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onDismiss={handleClose}
        onRequestClose={handleClose}
        testID={testID}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {pet ? t('pets.editPet') : t('pets.addNewPet')}
            </Text>
          </View>

          <PetForm
            pet={pet}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            testID="pet-form-in-modal"
          />
        </SafeAreaView>
      </RNModal>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default PetModal;

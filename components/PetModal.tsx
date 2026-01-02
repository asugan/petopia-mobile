import { Portal, Snackbar } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal as RNModal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreatePet, useUpdatePet } from '../lib/hooks/usePets';
import { PetCreateInput, PetCreateFormInput, PetCreateSchema } from '../lib/schemas/petSchema';
import { Pet } from '../lib/types';
import { PetForm } from './forms/PetForm';

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
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarType, setSnackbarType] = React.useState<'success' | 'error'>('success');

  // ✅ React Query hooks for server state
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();

  const showSnackbar = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  }, []);

  const handleSubmit = React.useCallback(async (data: PetCreateFormInput) => {
    setLoading(true);
    try {
      // Transform form data to API format using the schema transformation
      const apiData: PetCreateInput = PetCreateSchema().parse(data);

      if (pet) {
        // Pet güncelleme
        await updatePetMutation.mutateAsync({ _id: pet._id, data: apiData });
        showSnackbar(t('pets.updateSuccess'), 'success');
      } else {
        // Yeni pet oluşturma
        await createPetMutation.mutateAsync(apiData);
        showSnackbar(t('pets.saveSuccess'), 'success');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const fallbackMessage = pet ? t('pets.updateError') : t('pets.createError');
      const errorMessage = error instanceof Error ? error.message : fallbackMessage;
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [pet, createPetMutation, updatePetMutation, onSuccess, onClose, showSnackbar]);

  const handleClose = React.useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [onClose, loading]);

  const handleSnackbarDismiss = React.useCallback(() => {
    setSnackbarVisible(false);
  }, []);

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

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={handleSnackbarDismiss}
          duration={3000}
          message={snackbarMessage}
          style={{
            ...styles.snackbar,
            backgroundColor: snackbarType === 'success' ? theme.colors.primary : theme.colors.error
          }}
        />
      </Portal>
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
  snackbar: {
    marginBottom: 16,
  },
});

export default PetModal;

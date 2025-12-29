import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PetDetailModal from '@/components/PetDetailModal';

/**
 * This route serves as a URL entry point for the pet detail modal.
 * When a user navigates directly to /pet/[id], it opens the PetDetailModal.
 */
export default function PetDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Auto-open modal when route is accessed
    if (id) {
      setModalVisible(true);
    }
  }, [id]);

  const handleClose = () => {
    setModalVisible(false);
    // Small delay to allow modal animation to complete
    setTimeout(() => {
      router.back();
    }, 300);
  };

  if (!id) {
    return null;
  }

  return (
    <PetDetailModal
      visible={modalVisible}
      petId={id}
      onClose={handleClose}
    />
  );
}
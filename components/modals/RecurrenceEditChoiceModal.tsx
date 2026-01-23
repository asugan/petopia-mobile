import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Text } from '@/components/ui';

interface RecurrenceEditChoiceModalProps {
  visible: boolean;
  onDismiss: () => void;
  onChoice: (choice: 'single' | 'series') => void;
  mode: 'edit' | 'delete';
}

export function RecurrenceEditChoiceModal({
  visible,
  onDismiss,
  onChoice,
  mode,
}: RecurrenceEditChoiceModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>
        {mode === 'edit' ? t('events.recurrence.editTitle') : t('events.recurrence.deleteTitle')}
      </Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium">
          {mode === 'edit' 
            ? t('events.recurrence.editDescription') 
            : t('events.recurrence.deleteDescription')}
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button mode="text" onPress={onDismiss}>
          {t('common.cancel')}
        </Button>
        <Button mode="outlined" onPress={() => onChoice('single')}>
          {mode === 'edit' ? t('events.recurrence.editSingle') : t('events.recurrence.deleteSingle')}
        </Button>
        <Button mode="contained" onPress={() => onChoice('series')}>
          {mode === 'edit' ? t('events.recurrence.editSeries') : t('events.recurrence.deleteSeries')}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

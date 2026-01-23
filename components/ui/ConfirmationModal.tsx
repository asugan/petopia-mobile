import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Text } from './Text';
import { Button } from './Button';
import { useTheme } from '@/lib/theme';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} onDismiss={onCancel} dismissable={false}>
      <View style={styles.container}>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
        <View style={styles.buttons}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.button}
          >
            {cancelText}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            buttonColor={destructive ? theme.colors.error : undefined}
            style={styles.button}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});

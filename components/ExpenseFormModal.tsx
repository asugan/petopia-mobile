import React from 'react';
import { Modal as RNModal, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import ExpenseForm from './ExpenseForm';
import { CreateExpenseInput, Expense } from '../lib/types';

interface ExpenseFormModalProps {
  visible: boolean;
  petId?: string;
  expense?: Expense;
  onDismiss: () => void;
  onSubmit: (data: CreateExpenseInput) => void;
  isSubmitting?: boolean;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  visible,
  petId,
  expense,
  onDismiss,
  onSubmit,
  isSubmitting,
}) => {
  const { theme } = useTheme();

  const animationType = Platform.select({
    ios: 'slide' as const,
    android: 'fade' as const,
  });

  const presentationStyle = Platform.select({
    ios: 'pageSheet' as const,
    android: undefined,
  });

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {expense ? 'Edit Expense' : 'Add Expense'}
          </Text>
          <Button
            mode="text"
            onPress={onDismiss}
            disabled={isSubmitting}
            compact
          >
            Close
          </Button>
        </View>

        <ExpenseForm
          petId={petId}
          initialData={expense}
          onSubmit={onSubmit}
          onCancel={onDismiss}
          isSubmitting={isSubmitting}
        />
      </SafeAreaView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ExpenseFormModal;

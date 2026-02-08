import React from "react";
import { Modal as RNModal, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import UserBudgetForm from "./UserBudgetForm";
import { SetUserBudgetInput, UserBudget } from "@/lib/types";

interface UserBudgetFormModalProps {
  visible: boolean;
  budget?: UserBudget;
  onDismiss: () => void;
  onSubmit: (data: SetUserBudgetInput) => void;
  isSubmitting?: boolean;
}

const UserBudgetFormModal: React.FC<UserBudgetFormModalProps> = ({
  visible,
  budget,
  onDismiss,
  onSubmit,
  isSubmitting,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {budget ? t("common.edit", "Edit") : t("budgets.setBudget", "Set Budget")}
          </Text>
          <Button
            mode="text"
            onPress={onDismiss}
            disabled={isSubmitting}
            compact
          >
            {t("common.close", "Close")}
          </Button>
        </View>

        <UserBudgetForm
          initialData={budget}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
});

export default UserBudgetFormModal;

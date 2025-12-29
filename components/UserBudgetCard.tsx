import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, IconButton, ProgressBar, Badge } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { UserBudget, UserBudgetStatus } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatCurrency } from "@/lib/utils/currency";

interface UserBudgetCardProps {
  budget: UserBudget;
  status?: UserBudgetStatus | null;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const UserBudgetCard: React.FC<UserBudgetCardProps> = ({
  budget,
  status,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= budget.alertThreshold * 100) return theme.colors.tertiary;
    if (percentage >= 70) return theme.colors.primary;
    return theme.colors.secondary;
  };

  const getStatusIcon = (
    percentage: number
  ): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (percentage >= 100) return "alert-circle";
    if (percentage >= budget.alertThreshold * 100) return "alert";
    return "check-circle";
  };

  const percentage = status ? status.percentage : 0;
  const currentSpending = status ? status.currentSpending : 0;
  const remainingAmount = status ? status.remainingAmount : budget.amount;

  const cardContent = (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: budget.isActive
            ? getProgressColor(percentage)
            : theme.colors.surfaceDisabled,
        },
      ]}
      elevation={2}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.headerText}>
              <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                {t("budgets.monthlyBudget", "Monthly Budget")}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {budget.currency}
              </Text>
            </View>
          </View>
          {showActions && (
            <View style={styles.headerActions}>
              {onEdit && (
                <IconButton
                  icon="pencil"
                  size={18}
                  onPress={onEdit}
                  iconColor={theme.colors.primary}
                />
              )}
              {onDelete && (
                <IconButton
                  icon="delete"
                  size={18}
                  onPress={onDelete}
                  iconColor={theme.colors.error}
                />
              )}
            </View>
          )}
        </View>

        {!budget.isActive && (
          <Badge
            size={20}
            style={{ backgroundColor: theme.colors.surfaceDisabled }}
          >
            {t("budgets.inactive", "Inactive")}
          </Badge>
        )}

        <View style={styles.amountSection}>
          <Text variant="headlineLarge" style={styles.budgetAmount}>
            {formatCurrency(budget.amount, budget.currency)}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t("budgets.currentSpending", "Current spending")}:{" "}
            {formatCurrency(currentSpending, budget.currency)}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <ProgressBar
            progress={Math.min(percentage / 100, 1)}
            color={getProgressColor(percentage)}
            style={styles.progressBar}
          />
          <View style={styles.progressInfo}>
            <View style={styles.progressLeft}>
              <MaterialCommunityIcons
                name={getStatusIcon(percentage)}
                size={16}
                color={getProgressColor(percentage)}
              />
              <Text
                variant="bodySmall"
                style={{
                  color: getProgressColor(percentage),
                  marginLeft: 4,
                  fontWeight: "700",
                }}
              >
                {percentage.toFixed(1)}%
              </Text>
            </View>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {remainingAmount >= 0
                ? `${formatCurrency(remainingAmount, budget.currency)} ${t("budgets.remaining", "remaining")}`
                : `${formatCurrency(Math.abs(remainingAmount), budget.currency)} ${t("budgets.exceeded", "exceeded")}`}
            </Text>
          </View>
        </View>

        {percentage >= budget.alertThreshold * 100 && budget.isActive && (
          <View
            style={[
              styles.alertBanner,
              {
                backgroundColor:
                  percentage >= 100
                    ? theme.colors.errorContainer
                    : theme.colors.tertiaryContainer,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="alert"
              size={16}
              color={
                percentage >= 100 ? theme.colors.error : theme.colors.tertiary
              }
            />
            <Text
              variant="bodySmall"
              style={{
                marginLeft: 8,
                color:
                  percentage >= 100
                    ? theme.colors.error
                    : theme.colors.tertiary,
                fontWeight: "600",
              }}
            >
              {percentage >= 100
                ? t("budgets.budgetExceeded", "Budget exceeded!")
                : t("budgets.approachingLimit", "Approaching budget limit")}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  pressable: {
    marginVertical: 6,
  },
  card: {
    marginVertical: 6,
    borderRadius: 18,
  },
  cardContent: {
    padding: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  amountSection: {
    marginVertical: 8,
    alignItems: "center",
  },
  budgetAmount: {
    fontWeight: "700",
    marginBottom: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
});

export default UserBudgetCard;

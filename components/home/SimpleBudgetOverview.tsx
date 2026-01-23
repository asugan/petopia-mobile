import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Card, ProgressBar, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { TAB_ROUTES } from "@/constants/routes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useUserBudget,
  useUserBudgetStatus,
} from "../../lib/hooks/useUserBudget";

interface SimpleBudgetOverviewProps {
  onPress?: () => void;
}

/**
 * SimpleBudgetOverview - Clean single budget display for home screen
 * Shows monthly budget amount, current spending with progress bar, and alerts
 */
export const SimpleBudgetOverview = ({
  onPress,
}: SimpleBudgetOverviewProps) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { data: budget, isLoading: budgetLoading } = useUserBudget();
  const { data: status, isLoading: statusLoading } = useUserBudgetStatus();

  const formatCurrency = (amount: number, currency: string): string => {
    const currencySymbols: Record<string, string> = {
      TRY: "₺",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };

    const symbol = currencySymbols[currency] || currency;
    const formatted = amount.toLocaleString(
      i18n.language === "tr" ? "tr-TR" : "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    );

    return `${symbol}${formatted}`;
  };

  const getProgressColor = (percentage: number, threshold: number): string => {
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= threshold * 100) return theme.colors.tertiary;
    return theme.colors.secondary;
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(TAB_ROUTES.finance);
    }
  };

  // Loading state
  if (budgetLoading || statusLoading) {
    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <View style={styles.loadingContainer}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t("common.loading", "Loading...")}
          </Text>
        </View>
      </Card>
    );
  }

  // Empty state - no budget set
  if (!budget) {
    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="wallet-plus"
              size={32}
              color={theme.colors.onPrimary}
            />
          </View>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            {t("budgets.noBudgetSet", "No Budget Set")}
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.emptyDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t(
              "budgets.setBudgetDescription",
              "Set a monthly budget to track your pet expenses"
            )}
          </Text>
          <Button
            mode="contained"
            onPress={handlePress}
            style={styles.setupButton}
          >
            {t("budgets.setupBudget", "Setup Budget")}
          </Button>
        </View>
      </Card>
    );
  }

  // Budget display
  const percentage = status ? status.percentage : 0;
  const currentSpending = status ? status.currentSpending : 0;
  const remainingAmount = status ? status.remainingAmount : budget.amount;

  return (
    <Pressable onPress={handlePress}>
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderLeftWidth: 4,
            borderLeftColor: budget.isActive
              ? getProgressColor(percentage, budget.alertThreshold)
              : theme.colors.surfaceDisabled,
          },
        ]}
        elevation={2}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="wallet"
                size={24}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <View style={styles.headerText}>
                <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
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
            {!budget.isActive && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t("budgets.inactive", "Inactive")}
              </Text>
            )}
          </View>

          {/* Budget Amount */}
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

          {/* Progress Bar */}
          {budget.isActive && (
            <View style={styles.progressSection}>
              <ProgressBar
                progress={Math.min(percentage / 100, 1)}
                color={getProgressColor(percentage, budget.alertThreshold)}
                style={styles.progressBar}
              />
              <View style={styles.progressInfo}>
                <Text
                  variant="bodySmall"
                  style={{
                    color: getProgressColor(percentage, budget.alertThreshold),
                    fontWeight: "bold",
                  }}
                >
                  {percentage.toFixed(1)}%
                </Text>
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
          )}

          {/* Alert Banner */}
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

          {/* Footer */}
          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  setupButton: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  amountSection: {
    marginBottom: 16,
    alignItems: "center",
  },
  budgetAmount: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
});

export default SimpleBudgetOverview;

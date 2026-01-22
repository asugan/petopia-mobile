import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, ProgressBar, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { UserBudgetStatus, Expense } from "@/lib/types";
import { TAB_ROUTES } from "@/constants/routes";
import CompactExpenseItem from "@/components/CompactExpenseItem";

interface FinancialOverviewProps {
  budgetStatus?: UserBudgetStatus;
  recentExpenses?: Expense[];
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  budgetStatus,
  recentExpenses = [],
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const formatCurrency = (amount: number, currency: string = "TRY"): string => {
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

    return `${symbol}${formatted}`; // e.g. ₺450
  };

  const getProgressColor = (percentage: number, threshold: number): string => {
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= threshold * 100) return theme.colors.tertiary; // Orange/Warning
    return theme.colors.secondary; // Normal
  };

  // Budget Data
  const hasBudget = !!budgetStatus?.budget;
  const percentage = budgetStatus?.percentage || 0;
  const currentSpending = budgetStatus?.currentSpending || 0;
  const totalBudget = budgetStatus?.budget?.amount || 0;
  const currency = budgetStatus?.budget?.currency || "TRY";
  const alertThreshold = budgetStatus?.budget?.alertThreshold || 0.8;

  // Recent Expenses Data - take top 3
  const displayExpenses = recentExpenses.slice(0, 3);
  const hasExpenses = displayExpenses.length > 0;

  if (!hasBudget && !hasExpenses) {
    return (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            borderWidth: 1,
          },
        ]}
        elevation={2}
      >
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="wallet" size={24} color={theme.colors.primary} />
          </View>
          <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {t("home.financialOverviewEmptyTitle", "Start tracking finances")}
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.emptyDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t(
              "home.financialOverviewEmptyDescription",
              "You have not added any expenses or a budget yet. Add your first entry to see insights here."
            )}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push(TAB_ROUTES.finance)}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            style={styles.emptyButton}
          >
            {t("home.financialOverviewEmptyCta", "Add budget or expense")}
          </Button>
        </View>
      </Card>
    );
  }

  return (
    <Pressable onPress={() => router.push(TAB_ROUTES.finance)}>
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.title}>
            {t("home.financialOverview", "Finansal Genel Bakış")}
          </Text>

          {/* Budget Section */}
          {hasBudget ? (
            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {t("finance.monthlyExpenses", "Bu Ayki Harcamalar")}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text variant="bodyLarge" style={{ fontWeight: "600" }}>
                    {formatCurrency(currentSpending, currency)}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {" / "}
                    {formatCurrency(totalBudget, currency)}
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={Math.min(percentage / 100, 1)}
                color={getProgressColor(percentage, alertThreshold)}
                style={styles.progressBar}
              />
            </View>
          ) : (
             // Placeholder if no budget but has expenses
             <View style={styles.budgetSection}>
                <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                    {t("budgets.noBudgetSet", "No Budget Set")}
                </Text>
                {/* Maybe a link to set it? */}
             </View>
          )}

          {/* Recent Expenses Section */}
          {hasExpenses && (
            <View
              style={[
                styles.expensesSection,
                { borderTopColor: theme.colors.outlineVariant },
              ]}
            >
              <Text variant="titleSmall" style={styles.expensesTitle}>
                {t("expenses.recent", "Son Harcamalar")}
              </Text>

              <View style={styles.expensesList}>
                {displayExpenses.map((expense) => (
                  <CompactExpenseItem
                    key={expense._id}
                    expense={expense}
                    // We can customize the item style if needed, but default is fine
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
  },
  content: {
    padding: 16,
  },
  emptyContent: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyDescription: {
    textAlign: "center",
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 16,
    alignSelf: "center",
  },
  budgetSection: {
    gap: 8,
    marginBottom: 4,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  expensesSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  expensesTitle: {
    fontWeight: "600",
  },
  expensesList: {
    gap: 0,
  },
});

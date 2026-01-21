import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, FAB, SegmentedButtons, Text } from "@/components/ui";
import { HeaderActions, LargeTitle } from "@/components/LargeTitle";
import { PetPickerBase } from "@/components/PetPicker";
import { BudgetInsights } from "@/components/BudgetInsights";
import { useTheme } from "@/lib/theme";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { expenseService } from "@/lib/services/expenseService";
import { usePets } from "@/lib/hooks/usePets";
import { formatCurrency } from "@/lib/utils/currency";
import { useUserSettingsStore } from "@/stores/userSettingsStore";
import {
  useExpenses,
  useInfiniteExpenses,
  useExpenseStats,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExportExpensesCSV,
  useExportExpensesPDF,
  useExportVetSummaryPDF,
} from "@/lib/hooks/useExpenses";
import { expenseKeys } from "@/lib/hooks/queryKeys";
import {
  useUserBudget,
  useUserBudgetStatus,
  useSetUserBudget,
  useDeleteUserBudget,
  useBudgetAlertNotifications,
} from "@/lib/hooks/useUserBudget";
import ExpenseCard from "@/components/ExpenseCard";
import ExpenseFormModal from "@/components/ExpenseFormModal";
import UserBudgetCard from "@/components/UserBudgetCard";
import UserBudgetFormModal from "@/components/UserBudgetFormModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import {
  CreateExpenseInput,
  Expense,
  SetUserBudgetInput,
  UserBudget,
} from "@/lib/types";
import { LAYOUT } from "@/constants";
import { ENV } from "@/lib/config/env";
import { showToast } from "@/lib/toast/showToast";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useRequestDeduplication } from "@/lib/hooks/useRequestCancellation";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import { registerPushTokenWithBackend } from "@/lib/services/notificationService";

type FinanceTabValue = 'budget' | 'expenses';

export default function FinanceScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { isProUser } = useSubscription();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = LAYOUT.TAB_BAR_HEIGHT + insets.bottom;
  const contentBottomPadding = TAB_BAR_HEIGHT + LAYOUT.FAB_OFFSET;

  const queryClient = useQueryClient();
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency || "TRY";

  // Tab state
  const [activeTab, setActiveTab] = useState<FinanceTabValue>('expenses');

  // Shared state - default to undefined to show all pets
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();

  // Expenses state
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [page, setPage] = useState(1);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Budget state
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<UserBudget | undefined>();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingBudgetData, setPendingBudgetData] = useState<SetUserBudgetInput | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Notifications
  const { requestPermission } = useNotifications();
  const { executeWithDeduplication } = useRequestDeduplication();

  // Fetch pets
  const { data: pets = [], isLoading: petsLoading } = usePets();

  // Conditional hook: Use infinite query for single pet, regular query for all pets
  const infiniteQuery = useInfiniteExpenses(selectedPetId, {
    category: undefined,
    startDate: undefined,
    endDate: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    currency: undefined,
    paymentMethod: undefined,
  });

  const regularQuery = useExpenses(selectedPetId, {
    page,
    limit: ENV.DEFAULT_LIMIT,
  });

  // Use the appropriate query based on whether a pet is selected
  const useInfinite = !!selectedPetId;
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchInfinite,
  } = infiniteQuery;

  const {
    data: expensesData = { expenses: [], total: 0 },
    isLoading: regularLoading,
    isFetching: regularFetching,
  } = regularQuery;

  // Combine loading states
  const expensesLoading = useInfinite ? infiniteLoading : regularLoading;
  const expensesFetching = useInfinite ? isFetchingNextPage : regularFetching;

  // Flatten infinite query pages for display
  const allExpensesFromInfinite = useMemo(
    () => infiniteData?.pages?.flatMap((page) => page) || [],
    [infiniteData?.pages]
  );

  // Fetch expense stats
  const { data: expenseStats } = useExpenseStats({ petId: selectedPetId });

  // Fetch user budget (new simplified system)
  const { data: budget, isLoading: budgetLoading } = useUserBudget();
  const { data: budgetStatus } = useUserBudgetStatus();
  useBudgetAlertNotifications();

  // Mutations
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const setBudgetMutation = useSetUserBudget();
  const deleteBudgetMutation = useDeleteUserBudget();
  const exportCsvMutation = useExportExpensesCSV();
  const exportPdfMutation = useExportExpensesPDF();
  const exportVetSummaryMutation = useExportVetSummaryPDF();

  // Determine which expenses source to use
  const displayExpenses = useInfinite ? allExpensesFromInfinite : allExpenses;

  // Effects for pagination (only for regular query - all pets)
  useEffect(() => {
    if (!useInfinite && expensesData?.expenses) {
      if (page === 1) {
        setAllExpenses(expensesData.expenses);
      } else {
        setAllExpenses((prev) => [...prev, ...expensesData.expenses]);
      }
      setHasMore(expensesData.expenses.length >= ENV.DEFAULT_LIMIT);
    }
  }, [expensesData, page, useInfinite]);

  // Expense handlers
  const handleAddExpense = () => {
    setEditingExpense(undefined);
    setExpenseModalVisible(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseModalVisible(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(t("expenses.deleteExpense"), t("expenses.deleteConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpenseMutation.mutateAsync(expense._id);
            showToast({ type: 'success', title: t("expenses.deleteSuccess") });
          } catch {
            showToast({ type: 'error', title: t("expenses.deleteError") });
          }
        },
      },
    ]);
  };

  const handleExpenseFormSubmit = async (data: CreateExpenseInput) => {
    try {
      if (editingExpense) {
        await updateExpenseMutation.mutateAsync({
          _id: editingExpense._id,
          data,
        });
        showToast({ type: 'success', title: t("expenses.updateSuccess") });
      } else {
        await createExpenseMutation.mutateAsync(data);
        showToast({ type: 'success', title: t("expenses.createSuccess") });
      }
      setExpenseModalVisible(false);
      setEditingExpense(undefined);
    } catch {
      showToast({
        type: 'error',
        title: editingExpense ? t("expenses.updateError") : t("expenses.createError"),
      });
    }
  };

  // Budget handlers (new simplified system)
  const handleCreateBudget = async () => {
    if (!isProUser) {
      router.push('/subscription');
      return;
    }
    setEditingBudget(undefined);
    setBudgetModalVisible(true);
  };

  const handleEditBudget = async () => {
    if (!budget) {
      return;
    }

    if (!isProUser) {
      router.push('/subscription');
      return;
    }

    setEditingBudget(budget);
    setBudgetModalVisible(true);
  };

  const handleDeleteBudget = () => {
    if (!budget) return;

    Alert.alert(t("budgets.deleteBudget"), t("budgets.deleteConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBudgetMutation.mutateAsync();
            showToast({ type: 'success', title: t("budgets.deleteSuccess") });
          } catch {
            showToast({ type: 'error', title: t("budgets.deleteError") });
          }
        },
      },
    ]);
  };

  const handleBudgetFormSubmit = async (data: SetUserBudgetInput) => {
    if (!isProUser) {
      router.push('/subscription');
      return;
    }

    // Request notification permission if budget notifications are enabled
    const budgetNotificationsEnabled = settings?.budgetNotificationsEnabled ?? true;
    if (budgetNotificationsEnabled) {
      setIsRequestingPermission(true);
      const granted = await executeWithDeduplication(
        'budget-notification-permission',
        async () => await requestPermission()
      );
      setIsRequestingPermission(false);

      if (granted) {
        void registerPushTokenWithBackend();
        await setBudgetMutation.mutateAsync(data);
        setBudgetModalVisible(false);
        setEditingBudget(undefined);
        showToast({ type: 'success', title: t("budgets.budgetSetSuccess") });
      } else {
        setPendingBudgetData(data);
        setShowPermissionModal(true);
      }
    } else {
      try {
        await setBudgetMutation.mutateAsync(data);
        setBudgetModalVisible(false);
        setEditingBudget(undefined);
        showToast({ type: 'success', title: t("budgets.budgetSetSuccess") });
      } catch {
        showToast({ type: 'error', title: t("budgets.budgetSetError") });
      }
    }
  };

  const handleExportCsv = async () => {
    if (!isProUser) {
      router.push('/subscription');
      return;
    }

    try {
      await exportCsvMutation.mutateAsync({
        petId: selectedPetId,
      });
      showToast({ type: 'success', title: t("expenses.exportSuccess") });
    } catch (error) {
      showToast({
        type: 'error',
        title: t("expenses.exportError"),
        message: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleExportPdf = async () => {
    if (!isProUser) {
      router.push('/subscription');
      return;
    }

    try {
      const uri = await exportPdfMutation.mutateAsync({
        petId: selectedPetId,
      });
      const shareResult = await expenseService.sharePdf(uri, t("expenses.exportTitle"));
      if (!shareResult.success) {
        showToast({
          type: 'error',
          title: t("expenses.exportError"),
          message: typeof shareResult.error === "string" ? shareResult.error : undefined,
        });
      } else {
        showToast({ type: 'success', title: t("expenses.exportSuccess") });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: t("expenses.exportError"),
        message: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleVetSummary = async () => {
    if (!selectedPetId) {
      showToast({
        type: 'warning',
        title: t("expenses.selectPetForSummary"),
      });
      return;
    }

    if (!isProUser) {
      router.push('/subscription');
      return;
    }

    try {
      const uri = await exportVetSummaryMutation.mutateAsync(selectedPetId);
      const shareResult = await expenseService.sharePdf(uri, t("expenses.vetSummaryTitle"));
      if (!shareResult.success) {
        showToast({
          type: 'error',
          title: t("expenses.exportError"),
          message: typeof shareResult.error === "string" ? shareResult.error : undefined,
        });
      } else {
        showToast({ type: 'success', title: t("expenses.exportSuccess") });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: t("expenses.exportError"),
        message: error instanceof Error ? error.message : undefined,
      });
    }
  };

  // Load more handler
  const handleLoadMoreExpenses = () => {
    if (useInfinite) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    } else {
      if (!expensesFetching && hasMore) {
        setPage((prev) => prev + 1);
      }
    }
  };

  // Render pet selector
  const renderPetSelector = () => {
    if (petsLoading) {
      return <LoadingSpinner />;
    }

    if (pets.length === 0) {
      return (
        <EmptyState
          title={t("expenses.noPets")}
          description={t("expenses.addPetFirst")}
          icon="dog"
        />
      );
    }

    return (
      <View style={styles.petSelector}>
        <PetPickerBase
          pets={pets}
          selectedPetId={selectedPetId}
          onSelect={(petId) => setSelectedPetId(petId)}
          onSelectAll={() => setSelectedPetId(undefined)}
          showAllOption
          label={t("expenses.selectPet")}
          allLabel={t("common.all")}
        />
      </View>
    );
  };

  const renderExportActions = (containerStyle?: object) => (
    <View style={[styles.exportSection, containerStyle]}>
      <View style={styles.exportRow}>
        <Button
          mode="outlined"
          icon="download"
          loading={exportCsvMutation.isPending}
          onPress={handleExportCsv}
          style={[styles.exportButton, { backgroundColor: theme.colors.surface }]}
          labelStyle={styles.exportButtonLabel}
          textColor={theme.colors.primary}
        >
          {t("expenses.exportCsv", "Export CSV")}
        </Button>
        <Button
          mode="outlined"
          icon="file-pdf-box"
          loading={exportPdfMutation.isPending}
          onPress={handleExportPdf}
          style={[styles.exportButton, { backgroundColor: theme.colors.surface }]}
          labelStyle={styles.exportButtonLabel}
          textColor={theme.colors.primary}
        >
          {t("expenses.exportPdf", "Export PDF")}
        </Button>
      </View>
      <Button
        mode="contained"
        icon="plus"
        loading={exportVetSummaryMutation.isPending}
        onPress={handleVetSummary}
        disabled={!selectedPetId}
        buttonColor={theme.colors.surfaceVariant}
        textColor={theme.colors.onSurfaceVariant}
        style={styles.vetSummaryButton}
        labelStyle={styles.vetSummaryLabel}
      >
        {t("expenses.vetSummary", "Vet summary PDF")}
      </Button>
    </View>
  );

  // Render budget tab content
  const renderBudgetContent = () => {
    if (budgetLoading) {
      return <LoadingSpinner />;
    }

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.budgetContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.budgetSection}>
          {!isProUser ? (
            <Pressable
              style={({ pressed }) => [
                styles.upgradeCard,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.surface,
                },
                pressed && styles.chipPressed,
              ]}
              onPress={() => router.push('/subscription')}
            >
              <View style={[styles.upgradeIconWrap, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
              </View>
              <Text variant="titleMedium" style={[styles.upgradeTitle, { color: theme.colors.onSurface }]}
              >
                {t("limits.budgets.title")}
              </Text>
              <Text variant="bodySmall" style={[styles.upgradeSubtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                {t("limits.budgets.subtitle")}
              </Text>
              <Text variant="labelLarge" style={[styles.upgradeCta, { color: theme.colors.primary }]}
              >
                {t("limits.budgets.cta")}
              </Text>
            </Pressable>
          ) : (
            <>
              {renderExportActions()}

              {/* EmptyState - shown when no budget exists */}
              {(!budget || (typeof budget === 'object' && Object.keys(budget).length === 0)) && (
                <EmptyState
                  title={t("budgets.noBudgetSet", "No Budget Set")}
                  description={t(
                    "budgets.setBudgetDescription",
                    "Set a monthly budget to track your pet expenses"
                  )}
                  icon="wallet"
                  buttonText={t("budgets.setBudget", "Set Budget")}
                  onButtonPress={handleCreateBudget}
                />
              )}

              {/* Budget Card with Actions - shown when budget exists */}
              {budget && budgetStatus && (
                <UserBudgetCard
                  budget={budget}
                  status={budgetStatus}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                />
              )}

              {budgetStatus && (
                <BudgetInsights status={budgetStatus} />
              )}
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  // Render expenses tab content
  const renderExpensesContent = () => {
    if (pets.length === 0) {
      return (
        <View style={styles.content}>
          {renderPetSelector()}
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {renderPetSelector()}
        <ScrollView 
          style={styles.expensesSection}
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: contentBottomPadding }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || expensesFetching}
              onRefresh={async () => {
                setRefreshing(true);
                setPage(1);
  
                if (useInfinite) {
                  await refetchInfinite();
                } else {
                  const queryKey = expenseKeys.list({
                    petId: selectedPetId,
                    page: 1,
                    limit: ENV.DEFAULT_LIMIT
                  });
                  await queryClient.invalidateQueries({ queryKey });
                  await queryClient.refetchQueries({ queryKey });
                }
                setRefreshing(false);
              }}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 100;
            if (isCloseToBottom) {
              handleLoadMoreExpenses();
            }
          }}
          scrollEventThrottle={400}
        >
          {renderExpensesList()}
        </ScrollView>
      </View>
    );
  };

  // Render expenses list with responsive grid
  const renderExpensesList = () => {
    if (expensesLoading && page === 1 && !useInfinite) {
      return <LoadingSpinner />;
    }
    if (expensesLoading && useInfinite && infiniteLoading) {
      return <LoadingSpinner />;
    }

    const hasNoExpenses = useInfinite ? allExpensesFromInfinite.length === 0 : allExpenses.length === 0;
    const isLoadingFirstPage = useInfinite ? infiniteLoading : (regularLoading && page === 1);

    if (hasNoExpenses && !isLoadingFirstPage) {
      return (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title={t("expenses.noExpenses")}
            description={t("expenses.noExpensesMessage")}
            icon="cash"
            buttonText={t("expenses.addExpense")}
            onButtonPress={handleAddExpense}
          />
        </View>
      );
    }

    return (
      <View style={styles.expensesScrollContainer}>
        {expenseStats && (
          <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statsContent}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {t("expenses.totalSpent")}: {formatCurrency(expenseStats.total || 0, baseCurrency)}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("expenses.average")}: {formatCurrency(expenseStats.average || 0, baseCurrency)}
              </Text>
            </View>
          </Card>
        )}


        <Text variant="titleMedium" style={[styles.recentTitle, { color: theme.colors.onSurface }]}>
          {t("expenses.recent", "Recent Expenses")}
        </Text>

        <View style={styles.expensesGrid}>
          {displayExpenses.map((expense) => (
            <ExpenseCard
              key={expense._id}
              expense={expense}
              onEdit={() => handleEditExpense(expense)}
              onDelete={() => handleDeleteExpense(expense)}
            />
          ))}
        </View>

        {expensesFetching && !useInfinite && page > 1 && <LoadingSpinner />}
      </View>
    );
  };


  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']} // Remove bottom to handle manually
    >
      <View style={styles.header}>
        <LargeTitle title={t('finance.title')} actions={<HeaderActions />} />
      </View>
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => {
            const nextTab = value as FinanceTabValue;
            setActiveTab(nextTab);
          }}
          buttons={[
            {
              value: 'budget',
              label: t('finance.budget', 'Budget'),
              icon: 'wallet'
            },
            {
              value: 'expenses',
              label: t('finance.expenses', 'Expenses'),
              icon: 'cash'
            }
          ]}
          density="small"
          style={StyleSheet.flatten([
            styles.segmentedButtons,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceVariant },
          ])}
        />
      </View>

      {activeTab === 'budget' ? renderBudgetContent() : renderExpensesContent()}

      {/* Conditional FABs */}
      {activeTab === 'budget' && (
        budget && (typeof budget === 'object' && Object.keys(budget).length > 0) ? (
          <FAB
            icon="pencil"
            style={{ ...styles.fab, backgroundColor: theme.colors.primary, bottom: 0 }}
            onPress={handleEditBudget}
          />
        ) : (
          <FAB
            icon="add"
            style={{ ...styles.fab, backgroundColor: theme.colors.primary, bottom: 0 }}
            onPress={handleCreateBudget}
          />
        )
      )}
      {activeTab === 'expenses' && pets.length > 0 && (
        <FAB
          icon="add"
          style={{ ...styles.fab, backgroundColor: theme.colors.primary, bottom: 0 }}
          onPress={handleAddExpense}
        />
      )}


      {/* Modals */}
      <ExpenseFormModal
        visible={expenseModalVisible}
        expense={editingExpense}
        petId={editingExpense?.petId}
        onDismiss={() => {
          setExpenseModalVisible(false);
          setEditingExpense(undefined);
        }}
        onSubmit={handleExpenseFormSubmit}
      />

      <UserBudgetFormModal
        visible={budgetModalVisible}
        budget={editingBudget}
        onDismiss={() => {
          setBudgetModalVisible(false);
          setEditingBudget(undefined);
        }}
        onSubmit={handleBudgetFormSubmit}
        isSubmitting={setBudgetMutation.isPending || isRequestingPermission}
      />

      <NotificationPermissionPrompt
        visible={showPermissionModal}
        onDismiss={() => {
          setShowPermissionModal(false);
          setPendingBudgetData(null);
        }}
        onPermissionGranted={async () => {
          if (pendingBudgetData) {
            void registerPushTokenWithBackend();
            await setBudgetMutation.mutateAsync(pendingBudgetData);
            setBudgetModalVisible(false);
            setEditingBudget(undefined);
            showToast({ type: 'success', title: t("budgets.budgetSetSuccess") });
            setPendingBudgetData(null);
          }
        }}
        onPermissionDenied={() => {
          setPendingBudgetData(null);
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  petSelector: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    flex: 1,
  },
  budgetSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  budgetContent: {
    flexGrow: 1,
  },
  expensesSection: {
    flex: 1,
  },
  expensesScroll: {
    flex: 1,
  },
  expensesScrollContainer: {
    paddingBottom: 12,
  },
  expensesGrid: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: "600",
  },
  setBudgetButton: {
    marginTop: 8,
  },
  listContainer: {
    paddingTop: 12,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
  },
  statsContent: {
    padding: 18,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
  },
  exportSection: {
    marginBottom: 16,
  },
  exportSectionInset: {
    paddingHorizontal: 16,
  },
  exportRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  exportButton: {
    flex: 1,
    borderRadius: 14,
  },
  exportButtonLabel: {
    fontWeight: "600",
  },
  vetSummaryButton: {
    borderRadius: 14,
  },
  vetSummaryLabel: {
    fontWeight: "600",
  },
  recentTitle: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontWeight: "700",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  upgradeCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
    opacity: 0.9,
    marginBottom: 16,
  },
  upgradeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  upgradeSubtitle: {
    textAlign: "center",
  },
  upgradeCta: {
    fontWeight: "700",
  },
  chipPressed: {
    transform: [{ scale: 0.98 }],
  }
});

import React from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { FormSection } from "./forms/FormSection";
import { SmartCurrencyInput } from "./forms/SmartCurrencyInput";
import { SmartSwitch } from "./forms/SmartSwitch";
import { Button, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import {
  SetUserBudgetSchema,
  SetUserBudgetInput,
} from "@/lib/schemas/userBudgetSchema";
import { UserBudget } from "@/lib/types";
import { useUserSettingsStore } from "@/stores/userSettingsStore";
import { StepHeader } from "./forms/StepHeader";

interface UserBudgetFormProps {
  initialData?: UserBudget;
  onSubmit: (data: SetUserBudgetInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const UserBudgetForm: React.FC<UserBudgetFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency ?? "TRY";
  const [currentStep, setCurrentStep] = React.useState(0);
  const [showStepError, setShowStepError] = React.useState(false);

  const form = useForm<SetUserBudgetInput>({
    resolver: zodResolver(SetUserBudgetSchema()),
    defaultValues: {
      amount: initialData?.amount || 0,
      currency: initialData?.currency || baseCurrency,
      alertThreshold: initialData?.alertThreshold ?? 0.8,
      isActive: initialData?.isActive ?? true,
    },
    mode: "onChange",
  });

  const { control, handleSubmit, formState: { isValid }, trigger, setValue } = form;

  React.useEffect(() => {
    setValue("currency", baseCurrency, { shouldValidate: true });
  }, [baseCurrency, setValue]);

  const handleFormSubmit = React.useCallback(
    (data: SetUserBudgetInput) => {
      onSubmit({ ...data, currency: baseCurrency });
    },
    [onSubmit, baseCurrency]
  );

  const steps = React.useMemo(
    () => [
      {
        key: "amount",
        title: t("budgets.steps.amount"),
        fields: ["amount"] as (keyof SetUserBudgetInput)[],
      },
      {
        key: "alerts",
        title: t("budgets.steps.alerts"),
        fields: ["alertThreshold", "isActive"] as (keyof SetUserBudgetInput)[],
      },
    ],
    [t]
  );

  const totalSteps = steps.length;
  const isFinalStep = currentStep === totalSteps - 1;

  const handleNextStep = React.useCallback(async () => {
    const isStepValid = await trigger(steps[currentStep].fields);
    if (!isStepValid) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [trigger, steps, currentStep, totalSteps]);

  const handleBackStep = React.useCallback(() => {
    setShowStepError(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFinalSubmit = React.useCallback(async () => {
    const isFormValid = await trigger();
    if (!isFormValid) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);
    handleSubmit(handleFormSubmit)();
  }, [trigger, handleSubmit, handleFormSubmit]);

  return (
    <FormProvider {...form}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="always"
      >
        <StepHeader
          title={steps[currentStep].title}
          counterLabel={t("budgets.stepIndicator", { current: currentStep + 1, total: totalSteps })}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {currentStep === 0 && (
          <FormSection title={t("budgets.budgetDetails", "Budget Details")}>
            {/* Amount Input */}
            <SmartCurrencyInput
              name="amount"
              label={t("budgets.monthlyAmount", "Monthly Amount")}
              placeholder={t("budgets.enterAmount", "Enter amount")}
              testID="budget-amount-input"
              currency={baseCurrency}
            />
          </FormSection>
        )}

        {currentStep === 1 && (
          <FormSection title={t("budgets.budgetDetails", "Budget Details")}>
            {/* Alert Threshold Selector */}
            <Controller
              control={control}
              name="alertThreshold"
              render={({ field: { onChange, value } }) => (
                <View style={styles.thresholdContainer}>
                  <Text
                    variant="labelLarge"
                    style={[styles.label, { color: theme.colors.onSurface }]}
                  >
                    {t("budgets.alertThreshold", "Alert Threshold")}
                  </Text>

                  <View style={styles.thresholdButtons}>
                    {[0.5, 0.7, 0.8, 0.9].map((threshold) => (
                      <TouchableOpacity
                        key={threshold}
                        style={[
                          styles.thresholdButton,
                          {
                            backgroundColor:
                              value === threshold
                                ? theme.colors.primary
                                : theme.colors.surfaceVariant,
                            borderColor: theme.colors.outline,
                          },
                        ]}
                        onPress={() => onChange(threshold)}
                      >
                        <Text
                          variant="bodyMedium"
                          style={{
                            color:
                              value === threshold
                                ? theme.colors.onPrimary
                                : theme.colors.onSurfaceVariant,
                            fontWeight: value === threshold ? "bold" : "normal",
                          }}
                        >
                          {Math.round(threshold * 100)}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text
                    variant="bodySmall"
                    style={[
                      styles.thresholdDescription,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t(
                      "budgets.alertThresholdDescription",
                      "Get notified when spending reaches this percentage of your budget"
                    )}
                  </Text>
                </View>
              )}
            />

            {/* Active Switch */}
            <SmartSwitch
              name="isActive"
              label={t("budgets.activeBudget", "Active Budget")}
              description={t(
                "budgets.activeBudgetDescription",
                "Enable budget tracking and alerts"
              )}
              testID="budget-active-switch"
            />
          </FormSection>
        )}

        <View style={styles.actionRow}>
          {currentStep === 0 ? (
            <Button
              mode="outlined"
              onPress={onCancel}
              disabled={isSubmitting}
              style={styles.actionButton}
            >
              {t("common.cancel", "Cancel")}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleBackStep}
              disabled={isSubmitting}
              style={styles.actionButton}
            >
              {t("common.back", "Back")}
            </Button>
          )}
          {isFinalStep ? (
            <Button
              mode="contained"
              onPress={handleFinalSubmit}
              disabled={isSubmitting || !isValid}
              style={styles.actionButton}
            >
              {t("common.save", "Save")}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextStep}
              disabled={isSubmitting}
              style={styles.actionButton}
            >
              {t("common.next", "Next")}
            </Button>
          )}
        </View>

        {!showStepError ? null : (
          <View style={[styles.statusContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={[styles.statusText, { color: theme.colors.onErrorContainer }]}>
              {t("pets.pleaseFillRequiredFields")}
            </Text>
          </View>
        )}
      </ScrollView>
    </FormProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  thresholdContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 12,
    fontWeight: "500",
  },
  thresholdButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  thresholdDescription: {
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "System",
  },
});

export default UserBudgetForm;

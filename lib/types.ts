// ============================================================================
// IMPORTLAR - Tüm importları en üste taşı
// ============================================================================
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TFunction } from "i18next";
import { NetInfoState } from "@react-native-community/netinfo";
import { ApiResponse } from "./api/client";
import {
  Currency,
  Expense,
  ExpenseCategory,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  PaymentMethod,
} from "./schemas/expenseSchema";
import {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from "./schemas/eventSchema";
import {
  CreateFeedingScheduleInput,
  FeedingSchedule,
  UpdateFeedingScheduleInput,
} from "./schemas/feedingScheduleSchema";
import {
  HealthRecord,
  HealthRecordCreateInput,
  HealthRecordUpdateInput,
} from "./schemas/healthRecordSchema";
import { Pet, PetCreateInput, PetUpdateInput } from "./schemas/petSchema";
import type { ThemeMode } from "./theme/types";

// ============================================================================
// SCHEMA TYPE RE-EXPORTLERİ
// ============================================================================
export type {
  CreateEventInput,
  ExpenseCreateInput as CreateExpenseInput,
  CreateFeedingScheduleInput,
  HealthRecordCreateInput as CreateHealthRecordInput,
  PetCreateInput as CreatePetInput,
  Currency,
  Event,
  Expense,
  ExpenseCategory,
  FeedingSchedule,
  HealthRecord,
  PaymentMethod,
  Pet,
  UpdateEventInput,
  ExpenseUpdateInput as UpdateExpenseInput,
  UpdateFeedingScheduleInput,
  HealthRecordUpdateInput as UpdateHealthRecordInput,
  PetUpdateInput as UpdatePetInput,
};

export type {
  ExpenseCreateInput,
  ExpenseUpdateInput,
  HealthRecordCreateInput,
  HealthRecordUpdateInput,
  PetCreateInput,
  PetUpdateInput,
};

// ============================================================================
// ENUM & UNION TYPES
// ============================================================================
export type PetType =
  | "dog"
  | "cat"
  | "bird"
  | "rabbit"
  | "hamster"
  | "fish"
  | "reptile"
  | "other";
export type PetGender = "male" | "female" | "other";
export type FoodType =
  | "dry_food"
  | "wet_food"
  | "raw_food"
  | "homemade"
  | "treats"
  | "supplements"
  | "other";

// ============================================================================
// EXTENDED TYPES
// ============================================================================
export type PetWithRelations = Pet & {
  healthRecords?: HealthRecord[];
  events?: Event[];
  feedingSchedules?: FeedingSchedule[];
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// ============================================================================
// FINANCIAL TYPES
// ============================================================================
export interface ExpenseStats {
  total: number;
  count: number;
  average: number;
  byCategory: {
    category: ExpenseCategory;
    total: number;
    count: number;
  }[];
  byCurrency: {
    currency: Currency;
    total: number;
  }[];
}

// ============================================================================
// USER BUDGET TYPES (NEW SIMPLIFIED SYSTEM)
// ============================================================================

export interface UserBudget {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  alertThreshold: number; // 0.1 - 1.0 range
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PetBreakdown {
  petId: string;
  petName: string;
  spending: number;
  percentage: number;
}

export interface UserBudgetStatus {
  budget: UserBudget;
  currentSpending: number;
  percentage: number;
  remainingAmount: number;
  isAlert: boolean;
  petBreakdown: PetBreakdown[];
  monthOverMonth?: {
    current: number;
    previous: number;
    changePct: number;
  };
  categoryBreakdown?: {
    category: string;
    total: number;
    percentage: number;
  }[];
}

export interface SetUserBudgetInput {
  amount: number;
  currency: Currency;
  alertThreshold?: number; // Optional, defaults to 0.8
  isActive?: boolean; // Optional, defaults to true
}

export interface BudgetAlert {
  budget?: UserBudget;
  currentSpending?: number;
  percentage?: number;
  remainingAmount?: number;
  isExceeded?: boolean;
  isAlert?: boolean;
  notificationPayload?: {
    title: string;
    body: string;
    severity: "warning" | "critical";
  };
}

// ============================================================================
// USER SETTINGS TYPES
// ============================================================================
export type SupportedLanguage = "tr" | "en" | "it" | "de" | "fr" | "es" | "pt" | "ja" | "ko" | "ru" | "ar";
export type SupportedCurrency = "TRY" | "USD" | "EUR" | "GBP";

export interface UserSettings {
  id: string;
  userId: string;
  baseCurrency: SupportedCurrency;
  timezone: string;
  language: SupportedLanguage;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  budgetNotificationsEnabled: boolean;
  feedingRemindersEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHours: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type UserSettingsUpdate = Partial<
  Omit<UserSettings, "id" | "userId" | "createdAt" | "updatedAt">
>;

export type PetWithFinances = Pet & {
  expenses?: Expense[];
  userBudget?: UserBudget;
  userBudgetStatus?: UserBudgetStatus;
};

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface ErrorDetails {
  [key: string]: unknown;
  field?: string;
  value?: unknown;
  constraint?: string;
}

export interface QueryFilters {
  [key: string]: unknown;
}

export interface DateRangeFilter {
  start?: Date | string;
  end?: Date | string;
}

export interface PetFilter extends QueryFilters {
  type?: string;
  gender?: string;
  isActive?: boolean;
}

export interface ExpenseFilter extends QueryFilters {
  petId?: string;
  category?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  dateRange?: DateRangeFilter;
  minAmount?: number;
  maxAmount?: number;
}

export interface HealthRecordFilter extends QueryFilters {
  petId?: string;
  type?: string;
  dateRange?: DateRangeFilter;
}

export interface EventFilter extends QueryFilters {
  petId?: string;
  type?: string;
  dateRange?: DateRangeFilter;
  isCompleted?: boolean;
}

export interface FileInfo {
  exists: boolean;
  uri: string;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
  md5?: string;
}

export interface MonthlyExpense {
  month: string;
  total: number;
  count: number;
  byCategory: {
    category: ExpenseCategory;
    total: number;
  }[];
}

export interface YearlyExpense {
  year: number;
  total: number;
  count: number;
  byMonth: {
    month: number;
    total: number;
  }[];
}

export type TranslationFunction = TFunction;

export type NetworkState = NetInfoState;

export interface FormGetValues<T> {
  (name?: keyof T): T[keyof T] | T;
  (): T;
}

export interface FormWatch<T> {
  (name?: keyof T): T[keyof T] | T;
  (): T;
}

export interface FormHandlerReturn<T> {
  getValues: FormGetValues<T>;
  watch: FormWatch<T>;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  trigger: (name?: keyof T) => Promise<boolean>;
  reset: (values?: T) => void;
  handleSubmit: (
    onSubmit: (data: T) => void | Promise<void>
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export interface SubscriptionOffering {
  identifier: string;
  packageType: string;
  product: SubscriptionProduct;
}

export interface SubscriptionProduct {
  identifier: string;
  price: string;
  title: string;
  description: string;
  currencyCode: string;
  pricePerMonth?: string;
}

export type ApiServiceFn<
  T,
  Args extends readonly unknown[] = readonly unknown[],
> = (...args: Args) => Promise<ApiResponse<T>>;

export interface RequestCache<T = unknown> {
  timestamp: number;
  promise: Promise<T>;
}

export interface AppTheme {
  dark: boolean;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    text: string;
    onSurface: string;
    disabled: string;
    placeholder: string;
    backdrop: string;
    notification: string;
    [key: string]: string;
  };
  fonts: {
    [key: string]: unknown;
  };
  roundness: number;
  animation: {
    scale: number;
  };
}

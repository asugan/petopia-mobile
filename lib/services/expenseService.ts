import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';

import { api, ApiError, ApiResponse, download } from '@/lib/api/client';
import { ENV } from '@/lib/config/env';
import type {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseStats,
  MonthlyExpense,
  YearlyExpense
} from '@/lib/types';

/**
 * Date utility functions for safe date handling
 */
function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

function convertDateToISOString(dateValue: Date | string | null | undefined): string | undefined {
  if (!dateValue) {
    return undefined;
  }

  if (isDate(dateValue)) {
    return dateValue.toISOString();
  }

  if (typeof dateValue === 'string') {
    return dateValue;
  }

  return undefined;
}

/**
 * Expense Service - Manages all expense API operations
 */
export class ExpenseService {
  /**
   * Create a new expense
   */
  async createExpense(data: CreateExpenseInput): Promise<ApiResponse<Expense>> {
    try {
      const cleanedData = {
        ...data,
        date: convertDateToISOString(data.date),
        receiptPhoto: data.receiptPhoto || undefined,
        vendor: data.vendor || undefined,
        notes: data.notes || undefined,
        description: data.description || undefined,
        paymentMethod: data.paymentMethod || undefined
      };
      if (!cleanedData.currency) {
        delete cleanedData.currency;
      }

      const response = await api.post<Expense>('/api/expenses', cleanedData);

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.expense.createSuccess'
      };
    } catch (error) {
      if (error instanceof ApiError) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.expense.createError',
        },
      };
      }
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.expense.createError',
        },
      };
    }
  }

  /**
   * Get expenses for a specific pet
   */
  async getExpensesByPetId(
    petId: string,
    params?: {
      page?: number;
      limit?: number;
      category?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      currency?: string;
      paymentMethod?: string;
    }
  ): Promise<ApiResponse<{ expenses: Expense[]; total: number }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.minAmount) queryParams.append('minAmount', params.minAmount.toString());
      if (params?.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString());
      if (params?.currency) queryParams.append('currency', params.currency);
      if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);

      const url = `/api/pets/${petId}/expenses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<Expense[]>(url);

      // Backend response includes data and meta
      const expenses = response.data || [];
      const meta = response.meta || { total: expenses.length };

      return {
        success: true,
        data: {
          expenses,
          total: meta.total ?? expenses.length
        }
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.expense.fetchError',
        },
      };
    }
  }

  /**
   * Get a single expense by ID
   */
  async getExpenseById(id: string): Promise<ApiResponse<Expense>> {
    try {
      const response = await api.get<Expense>(`/api/expenses/${id}`);

      return {
        success: true,
        data: response.data!
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.expense.notFound',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.expense.fetchError',
        },
      };
    }
  }

  /**
   * Update an expense
   */
  async updateExpense(id: string, data: UpdateExpenseInput): Promise<ApiResponse<Expense>> {
    try {
      const { date, ...rest } = data;
      const cleanedData: UpdateExpenseInput = {
        ...rest,
        ...(date ? { date: convertDateToISOString(date) } : {}),
      };

      const response = await api.put<Expense>(`/api/expenses/${id}`, cleanedData);

      return {
        success: true,
        data: response.data!,
        message: 'serviceResponse.expense.updateSuccess'
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.expense.notFoundUpdate',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'UPDATE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.expense.updateError',
        },
      };
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/api/expenses/${id}`);

      return {
        success: true,
        message: 'serviceResponse.expense.deleteSuccess'
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'serviceResponse.expense.notFoundDelete',
            },
          };
        }
        return {
          success: false,
          error: {
            code: error.code || 'DELETE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.expense.deleteError',
        },
      };
    }
  }

  /**
   * Get expense statistics
   */
  async getExpenseStats(params?: {
    petId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<ApiResponse<ExpenseStats>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.petId) queryParams.append('petId', params.petId);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.category) queryParams.append('category', params.category);

      const url = `/api/expenses/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ExpenseStats>(url);

      return {
        success: true,
        data: response.data!
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_STATS_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_STATS_ERROR',
          message: 'serviceResponse.expense.fetchStatsError',
        },
      };
    }
  }

  /**
   * Get monthly expenses
   */
  async getMonthlyExpenses(params?: {
    petId?: string;
    year?: number;
    month?: number;
  }): Promise<ApiResponse<MonthlyExpense[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.petId) queryParams.append('petId', params.petId);
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.month !== undefined) queryParams.append('month', params.month.toString());

      const url = `/api/expenses/monthly${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<MonthlyExpense[]>(url);

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_MONTHLY_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_MONTHLY_ERROR',
          message: 'serviceResponse.expense.fetchMonthlyError',
        },
      };
    }
  }

  /**
   * Get yearly expenses
   */
  async getYearlyExpenses(params?: {
    petId?: string;
    year?: number;
  }): Promise<ApiResponse<YearlyExpense[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.petId) queryParams.append('petId', params.petId);
      if (params?.year) queryParams.append('year', params.year.toString());

      const url = `/api/expenses/yearly${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<YearlyExpense[]>(url);

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_YEARLY_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_YEARLY_ERROR',
          message: 'serviceResponse.expense.fetchYearlyError',
        },
      };
    }
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(
    category: string,
    petId?: string
  ): Promise<ApiResponse<Expense[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (petId) queryParams.append('petId', petId);

      const url = `/api/expenses/by-category/${category}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<Expense[]>(url);

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_BY_CATEGORY_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_BY_CATEGORY_ERROR',
          message: 'serviceResponse.expense.fetchByCategoryError',
        },
      };
    }
  }

  /**
   * Get expenses by date range
   */
  async getExpensesByDateRange(params: {
    petId?: string;
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<Expense[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.petId) queryParams.append('petId', params.petId);
      queryParams.append('startDate', params.startDate);
      queryParams.append('endDate', params.endDate);

      const url = `/api/expenses/by-date?${queryParams.toString()}`;
      const response = await api.get<Expense[]>(url);

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'FETCH_BY_DATE_RANGE_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_BY_DATE_RANGE_ERROR',
          message: 'serviceResponse.expense.fetchByDateRangeError',
        },
      };
    }
  }

  /**
   * Export expenses as CSV
   */
  async exportExpensesCSV(params?: {
    petId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<string>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.petId) queryParams.append('petId', params.petId);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const url = `${ENV.ENDPOINTS.EXPENSES_EXPORT_CSV}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<string>(url);

      return {
        success: true,
        data: response.data!
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code || 'EXPORT_CSV_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'EXPORT_CSV_ERROR',
          message: 'serviceResponse.expense.exportCSVError',
        },
      };
    }
  }

  /**
   * Export expenses as PDF (general report)
   */
  async exportExpensesPDF(params?: {
    petId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ uri: string }>> {
    try {
      const response = await download(ENV.ENDPOINTS.EXPENSES_EXPORT_PDF, params);
      const base64 = Buffer.from(response.data).toString('base64');
      const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!cacheDir) {
        return {
          success: false,
          error: {
            code: 'FILE_SYSTEM_ERROR',
            message: 'serviceResponse.expense.fileSystemError',
          },
        };
      }
      const uri = `${cacheDir}expenses-report.pdf`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        success: true,
        data: { uri },
        message: 'serviceResponse.expense.exportPDFSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return { 
          success: false, 
          error: {
            code: error.code || 'EXPORT_PDF_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'EXPORT_PDF_ERROR',
          message: 'serviceResponse.expense.exportPDFError',
        },
      };
    }
  }

  /**
   * Export vet summary PDF for a specific pet
   */
  async exportVetSummaryPDF(petId: string): Promise<ApiResponse<{ uri: string }>> {
    try {
      const response = await download(ENV.ENDPOINTS.VET_SUMMARY_PDF(petId));
      const base64 = Buffer.from(response.data).toString('base64');
      const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!cacheDir) {
        return {
          success: false,
          error: {
            code: 'FILE_SYSTEM_ERROR',
            message: 'serviceResponse.expense.fileSystemError',
          },
        };
      }
      const uri = `${cacheDir}vet-summary-${petId}.pdf`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        success: true,
        data: { uri },
        message: 'serviceResponse.expense.exportVetSummaryPDFSuccess',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return { 
          success: false, 
          error: {
            code: error.code || 'EXPORT_VET_SUMMARY_PDF_ERROR',
            message: error.message,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'EXPORT_VET_SUMMARY_PDF_ERROR',
          message: 'serviceResponse.expense.exportVetSummaryPDFError',
        },
      };
    }
  }

  /**
   * Share a generated PDF if supported on platform
   */
  async sharePdf(uri: string, dialogTitle: string): Promise<ApiResponse<void>> {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        return {
          success: false,
          error: {
            code: 'SHARING_UNAVAILABLE',
            message: 'serviceResponse.expense.sharingUnavailable',
          },
        };
      }

      await Sharing.shareAsync(uri, { dialogTitle });
      return { success: true, message: 'serviceResponse.expense.sharePDFSuccess' };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SHARE_PDF_ERROR',
          message: 'serviceResponse.expense.sharePDFError',
        },
      };
    }
  }
}

// Export a singleton instance
export const expenseService = new ExpenseService();

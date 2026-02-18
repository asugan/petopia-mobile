import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { ApiResponse } from '@/lib/contracts/api';
import { expenseRepository } from '@/lib/repositories/expenseRepository';
import type {
  CreateExpenseInput,
  Expense,
  ExpenseStats,
  MonthlyExpense,
  UpdateExpenseInput,
  YearlyExpense,
} from '@/lib/types';

const escapeCsv = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

const toCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const buildExpenseRows = (expenses: Expense[]): string => {
  return expenses
    .map((expense) => {
      const cols = [
        expense._id,
        expense.petId,
        expense.category,
        String(expense.amount),
        expense.currency,
        expense.paymentMethod ?? '',
        String(expense.date),
      ];

      return cols.map((value) => escapeCsv(String(value))).join(',');
    })
    .join('\n');
};

const buildReportHtml = (title: string, expenses: Expense[]): string => {
  const rowsHtml = expenses
    .map(
      (expense) => `
      <tr>
        <td>${expense.petId}</td>
        <td>${expense.category}</td>
        <td>${toCurrency(expense.amount, expense.currency)}</td>
        <td>${new Date(String(expense.date)).toLocaleDateString()}</td>
      </tr>
    `,
    )
    .join('');

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
          h1 { margin: 0 0 8px; }
          p { margin: 0 0 16px; color: #555; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .total { margin-top: 16px; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Pet</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="total">Total: ${total.toFixed(2)}</div>
      </body>
    </html>
  `;
};

export class ExpenseService {
  async createExpense(data: CreateExpenseInput): Promise<ApiResponse<Expense>> {
    try {
      const expense = expenseRepository.createExpense(data);

      return {
        success: true,
        data: expense,
        message: 'serviceResponse.expense.createSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'serviceResponse.expense.createError',
        },
      };
    }
  }

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
    },
  ): Promise<ApiResponse<{ expenses: Expense[]; total: number }>> {
    try {
      const result = expenseRepository.getExpensesByPetId(petId, params);

      return {
        success: true,
        data: result,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.expense.fetchError',
        },
      };
    }
  }

  async getExpenseById(id: string): Promise<ApiResponse<Expense>> {
    try {
      const expense = expenseRepository.getExpenseById(id);

      if (!expense) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.expense.notFound',
          },
        };
      }

      return {
        success: true,
        data: expense,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'serviceResponse.expense.fetchError',
        },
      };
    }
  }

  async updateExpense(id: string, data: UpdateExpenseInput): Promise<ApiResponse<Expense>> {
    try {
      const expense = expenseRepository.updateExpense(id, data);

      if (!expense) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.expense.notFoundUpdate',
          },
        };
      }

      return {
        success: true,
        data: expense,
        message: 'serviceResponse.expense.updateSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'serviceResponse.expense.updateError',
        },
      };
    }
  }

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    try {
      const deleted = expenseRepository.deleteExpense(id);

      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'serviceResponse.expense.notFoundDelete',
          },
        };
      }

      return {
        success: true,
        message: 'serviceResponse.expense.deleteSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'serviceResponse.expense.deleteError',
        },
      };
    }
  }

  async getExpenseStats(params?: {
    petId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<ApiResponse<ExpenseStats>> {
    try {
      const stats = expenseRepository.getExpenseStats(params);

      return {
        success: true,
        data: stats,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_STATS_ERROR',
          message: 'serviceResponse.expense.fetchStatsError',
        },
      };
    }
  }

  async getMonthlyExpenses(params?: {
    petId?: string;
    year?: number;
    month?: number;
  }): Promise<ApiResponse<MonthlyExpense[]>> {
    try {
      const expenses = expenseRepository.getMonthlyExpenses(params);

      return {
        success: true,
        data: expenses,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_MONTHLY_ERROR',
          message: 'serviceResponse.expense.fetchMonthlyError',
        },
      };
    }
  }

  async getYearlyExpenses(params?: {
    petId?: string;
    year?: number;
  }): Promise<ApiResponse<YearlyExpense[]>> {
    try {
      const expenses = expenseRepository.getYearlyExpenses(params);

      return {
        success: true,
        data: expenses,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_YEARLY_ERROR',
          message: 'serviceResponse.expense.fetchYearlyError',
        },
      };
    }
  }

  async getExpensesByCategory(
    category: string,
    petId?: string,
  ): Promise<ApiResponse<Expense[]>> {
    try {
      const expenses = expenseRepository.getExpensesByCategory(category, petId);

      return {
        success: true,
        data: expenses,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_BY_CATEGORY_ERROR',
          message: 'serviceResponse.expense.fetchByCategoryError',
        },
      };
    }
  }

  async getExpensesByDateRange(params: {
    petId?: string;
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<Expense[]>> {
    try {
      const expenses = expenseRepository.getExpensesByDateRange(params);

      return {
        success: true,
        data: expenses,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'FETCH_BY_DATE_RANGE_ERROR',
          message: 'serviceResponse.expense.fetchByDateRangeError',
        },
      };
    }
  }

  async exportExpensesCSV(params?: {
    petId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<string>> {
    try {
      const expenses = params?.petId
        ? expenseRepository.getExpensesByPetId(params.petId, {
          startDate: params.startDate,
          endDate: params.endDate,
        }).expenses
        : expenseRepository.getExpenses({
          startDate: params?.startDate,
          endDate: params?.endDate,
        });

      const header = 'id,petId,category,amount,currency,paymentMethod,date';
      const body = buildExpenseRows(expenses);
      const csv = `${header}\n${body}`;

      const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (cacheDir) {
        const uri = `${cacheDir}expenses-report.csv`;
        await FileSystem.writeAsStringAsync(uri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      return {
        success: true,
        data: csv,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'EXPORT_CSV_ERROR',
          message: 'serviceResponse.expense.exportCSVError',
        },
      };
    }
  }

  async exportExpensesPDF(params?: {
    petId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ uri: string }>> {
    try {
      const expenses = params?.petId
        ? expenseRepository.getExpensesByPetId(params.petId, {
          startDate: params.startDate,
          endDate: params.endDate,
        }).expenses
        : expenseRepository.getExpenses({
          startDate: params?.startDate,
          endDate: params?.endDate,
        });

      const html = buildReportHtml('Expense Report', expenses);
      const file = await Print.printToFileAsync({ html });

      return {
        success: true,
        data: { uri: file.uri },
        message: 'serviceResponse.expense.exportPDFSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'EXPORT_PDF_ERROR',
          message: 'serviceResponse.expense.exportPDFError',
        },
      };
    }
  }

  async exportVetSummaryPDF(petId: string): Promise<ApiResponse<{ uri: string }>> {
    try {
      const expenses = expenseRepository.getExpensesByPetId(petId).expenses;
      const petName = expenseRepository.getPetNameById(petId);
      const html = buildReportHtml(`${petName} - Vet Summary`, expenses);
      const file = await Print.printToFileAsync({ html });

      return {
        success: true,
        data: { uri: file.uri },
        message: 'serviceResponse.expense.exportVetSummaryPDFSuccess',
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'EXPORT_VET_SUMMARY_PDF_ERROR',
          message: 'serviceResponse.expense.exportVetSummaryPDFError',
        },
      };
    }
  }

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

      return {
        success: true,
        message: 'serviceResponse.expense.sharePDFSuccess',
      };
    } catch {
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

export const expenseService = new ExpenseService();

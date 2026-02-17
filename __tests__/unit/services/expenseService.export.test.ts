import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetExpenses,
  mockGetExpensesByPetId,
  mockGetPetNameById,
  mockWriteAsStringAsync,
  mockPrintToFileAsync,
} = vi.hoisted(() => ({
  mockGetExpenses: vi.fn(),
  mockGetExpensesByPetId: vi.fn(),
  mockGetPetNameById: vi.fn(),
  mockWriteAsStringAsync: vi.fn(),
  mockPrintToFileAsync: vi.fn(),
}));

vi.mock('@/lib/repositories/expenseRepository', () => ({
  expenseRepository: {
    getExpenses: mockGetExpenses,
    getExpensesByPetId: mockGetExpensesByPetId,
    getPetNameById: mockGetPetNameById,
  },
}));

vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///tmp/',
  documentDirectory: 'file:///documents/',
  writeAsStringAsync: mockWriteAsStringAsync,
  EncodingType: {
    UTF8: 'utf8',
  },
}));

vi.mock('expo-print', () => ({
  printToFileAsync: mockPrintToFileAsync,
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(async () => true),
  shareAsync: vi.fn(async () => undefined),
}));

import { expenseService } from '@/lib/services/expenseService';

describe('expenseService export generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const expenses = [
      {
        _id: 'exp-1',
        petId: 'pet-1',
        category: 'food',
        amount: 50,
        currency: 'TRY',
        paymentMethod: 'cash',
        date: '2026-02-10T12:00:00.000Z',
        createdAt: '2026-02-10T12:00:00.000Z',
      },
    ];

    mockGetExpenses.mockReturnValue(expenses);
    mockGetExpensesByPetId.mockReturnValue({ expenses, total: 1 });
    mockGetPetNameById.mockReturnValue('Luna');
    mockWriteAsStringAsync.mockResolvedValue(undefined);
    mockPrintToFileAsync.mockResolvedValue({ uri: 'file:///tmp/report.pdf' });
  });

  it('creates CSV output from local expense data', async () => {
    const result = await expenseService.exportExpensesCSV();

    expect(result.success).toBe(true);
    expect(result.data).toContain('id,petId,category,amount,currency,paymentMethod,date');
    expect(result.data).toContain('exp-1,pet-1,food,50,TRY,cash');
    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      'file:///tmp/expenses-report.csv',
      expect.stringContaining('exp-1,pet-1,food,50,TRY,cash'),
      { encoding: 'utf8' }
    );
  });

  it('creates PDF output from local expense data', async () => {
    const result = await expenseService.exportExpensesPDF();

    expect(result.success).toBe(true);
    expect(result.data?.uri).toBe('file:///tmp/report.pdf');
    expect(mockPrintToFileAsync).toHaveBeenCalledWith({
      html: expect.stringContaining('Expense Report'),
    });
  });

  it('creates vet summary PDF with pet name title', async () => {
    const result = await expenseService.exportVetSummaryPDF('pet-1');

    expect(result.success).toBe(true);
    expect(result.data?.uri).toBe('file:///tmp/report.pdf');
    expect(mockPrintToFileAsync).toHaveBeenCalledWith({
      html: expect.stringContaining('Luna - Vet Summary'),
    });
  });
});

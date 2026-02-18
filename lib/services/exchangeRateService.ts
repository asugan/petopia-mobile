import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense } from '@/lib/types';

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';
const CACHE_PREFIX = 'fx-rates:v1:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;
const FETCH_FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

type ExchangeRates = Record<string, number>;

type CachedRates = {
  base: string;
  rates: ExchangeRates;
  fetchedAt: number;
  providerDate?: string;
};

type RateSource = 'cache' | 'network' | 'stale-cache';

export type ExchangeRateSnapshot = CachedRates & {
  source: RateSource;
};

const fetchFailureCooldownByBase = new Map<string, number>();

const normalizeCurrencyCode = (code: string): string => code.trim().toUpperCase();

const isValidRate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const getCacheKey = (base: string): string => `${CACHE_PREFIX}${normalizeCurrencyCode(base)}`;

const parseCachedRates = (raw: string | null): CachedRates | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedRates;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.base !== 'string' ||
      typeof parsed.fetchedAt !== 'number' ||
      !parsed.rates ||
      typeof parsed.rates !== 'object'
    ) {
      return null;
    }

    return {
      base: normalizeCurrencyCode(parsed.base),
      rates: parsed.rates,
      fetchedAt: parsed.fetchedAt,
      providerDate: parsed.providerDate,
    };
  } catch {
    return null;
  }
};

const isFresh = (cached: CachedRates): boolean => Date.now() - cached.fetchedAt < CACHE_TTL_MS;

const toRoundedAmount = (value: number): number => Number(value.toFixed(6));

const convertWithTargetSnapshot = (
  amount: number,
  fromCurrency: string,
  targetCurrency: string,
  targetSnapshot: ExchangeRateSnapshot,
): number | null => {
  if (!Number.isFinite(amount)) {
    return null;
  }

  const from = normalizeCurrencyCode(fromCurrency);
  const target = normalizeCurrencyCode(targetCurrency);

  if (from === target) {
    return amount;
  }

  const sourcePerTarget = targetSnapshot.rates[from];
  if (!isValidRate(sourcePerTarget)) {
    return null;
  }

  return toRoundedAmount(amount / sourcePerTarget);
};

export class ExchangeRateService {
  private async fetchRatesFromNetwork(base: string): Promise<CachedRates> {
    const normalizedBase = normalizeCurrencyCode(base);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${FRANKFURTER_URL}?from=${encodeURIComponent(normalizedBase)}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`FX fetch failed: ${response.status}`);
      }

      const payload = (await response.json()) as {
        base?: string;
        date?: string;
        rates?: Record<string, number>;
      };

      const rates: ExchangeRates = {
        ...(payload.rates ?? {}),
        [normalizedBase]: 1,
      };

      return {
        base: normalizeCurrencyCode(payload.base ?? normalizedBase),
        rates,
        fetchedAt: Date.now(),
        providerDate: payload.date,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async getRates(base: string, options?: { forceRefresh?: boolean }): Promise<ExchangeRateSnapshot> {
    const normalizedBase = normalizeCurrencyCode(base);
    const cacheKey = getCacheKey(normalizedBase);
    const cached = parseCachedRates(await AsyncStorage.getItem(cacheKey));
    const forceRefresh = options?.forceRefresh === true;

    if (cached && !forceRefresh && isFresh(cached)) {
      return {
        ...cached,
        source: 'cache',
      };
    }

    const cooldownUntil = fetchFailureCooldownByBase.get(normalizedBase) ?? 0;
    if (Date.now() < cooldownUntil && cached) {
      return {
        ...cached,
        source: 'stale-cache',
      };
    }

    try {
      const fresh = await this.fetchRatesFromNetwork(normalizedBase);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
      fetchFailureCooldownByBase.delete(normalizedBase);

      return {
        ...fresh,
        source: 'network',
      };
    } catch {
      fetchFailureCooldownByBase.set(normalizedBase, Date.now() + FETCH_FAILURE_COOLDOWN_MS);

      if (cached) {
        return {
          ...cached,
          source: 'stale-cache',
        };
      }

      throw new Error(`FX rates unavailable for ${normalizedBase}`);
    }
  }

  async prefetchRates(base: string): Promise<void> {
    try {
      await this.getRates(base);
    } catch {
      // Ignore prefetch failures; conversion paths handle fallback behavior.
    }
  }

  async getExchangeRate(fromCurrency: string, targetCurrency: string): Promise<number | null> {
    const from = normalizeCurrencyCode(fromCurrency);
    const target = normalizeCurrencyCode(targetCurrency);

    if (from === target) {
      return 1;
    }

    try {
      const targetSnapshot = await this.getRates(target);
      const directAmount = convertWithTargetSnapshot(1, from, target, targetSnapshot);
      if (directAmount !== null) {
        return directAmount;
      }

      const sourceSnapshot = await this.getRates(from);
      const targetPerSource = sourceSnapshot.rates[target];
      if (!isValidRate(targetPerSource)) {
        return null;
      }

      return targetPerSource;
    } catch {
      return null;
    }
  }

  async convertAmount(amount: number, fromCurrency: string, targetCurrency: string): Promise<number | null> {
    if (!Number.isFinite(amount)) {
      return null;
    }

    const from = normalizeCurrencyCode(fromCurrency);
    const target = normalizeCurrencyCode(targetCurrency);

    if (from === target) {
      return amount;
    }

    try {
      const targetSnapshot = await this.getRates(target);
      const direct = convertWithTargetSnapshot(amount, from, target, targetSnapshot);
      if (direct !== null) {
        return direct;
      }

      const sourceSnapshot = await this.getRates(from);
      const targetPerSource = sourceSnapshot.rates[target];
      if (!isValidRate(targetPerSource)) {
        return null;
      }

      return toRoundedAmount(amount * targetPerSource);
    } catch {
      return null;
    }
  }

  async convertExpensesToCurrency(expenses: Expense[], targetCurrency: string): Promise<Expense[]> {
    if (expenses.length === 0) {
      return expenses;
    }

    const target = normalizeCurrencyCode(targetCurrency);
    let targetSnapshot: ExchangeRateSnapshot | null = null;

    try {
      targetSnapshot = await this.getRates(target);
    } catch {
      targetSnapshot = null;
    }

    const fallbackRates = new Map<string, number | null>();

    const resolveAmountBase = async (expense: Expense): Promise<number | undefined> => {
      const source = normalizeCurrencyCode(expense.currency);

      if (source === target) {
        return expense.amount;
      }

      if (targetSnapshot) {
        const converted = convertWithTargetSnapshot(expense.amount, source, target, targetSnapshot);
        if (converted !== null) {
          return converted;
        }
      }

      if (!fallbackRates.has(source)) {
        fallbackRates.set(source, await this.getExchangeRate(source, target));
      }

      const rate = fallbackRates.get(source);
      if (!isValidRate(rate)) {
        return expense.amountBase;
      }

      return toRoundedAmount(expense.amount * rate);
    };

    const converted = await Promise.all(
      expenses.map(async (expense) => {
        const amountBase = await resolveAmountBase(expense);
        return {
          ...expense,
          amountBase,
        };
      }),
    );

    return converted;
  }

  async convertTotalsToCurrency(
    totalsByCurrency: { currency: string; total: number }[],
    targetCurrency: string,
  ): Promise<number | null> {
    const target = normalizeCurrencyCode(targetCurrency);
    if (totalsByCurrency.length === 0) {
      return 0;
    }

    const converted = await Promise.all(
      totalsByCurrency.map(async (entry) => {
        const amount = await this.convertAmount(entry.total, entry.currency, target);
        return amount;
      }),
    );

    if (converted.some((value) => value === null)) {
      return null;
    }

    const normalizedConverted = converted.filter((value): value is number => value !== null);

    return toRoundedAmount(normalizedConverted.reduce((sum, value) => sum + value, 0));
  }
}

export const exchangeRateService = new ExchangeRateService();

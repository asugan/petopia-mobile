import { formatInTimeZone } from '@/lib/utils/date';

type DateLike = Date | string | number;

export const toLocalDateKey = (dateLike: DateLike, timezone: string): string => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
};

export const isSameLocalDate = (
  left: DateLike,
  right: DateLike,
  timezone: string,
): boolean => {
  const leftKey = toLocalDateKey(left, timezone);
  const rightKey = toLocalDateKey(right, timezone);
  return leftKey !== '' && leftKey === rightKey;
};

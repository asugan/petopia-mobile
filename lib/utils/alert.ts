import { showToast } from '@/lib/toast/showToast';
import i18n from '@/lib/i18n';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type AlertArgs = [string, string | undefined];

const resolveVariant = (title?: string): ToastVariant => {
  if (!title) return 'info';
  if (title === i18n.t('common.error')) return 'error';
  if (title === i18n.t('common.warning')) return 'warning';
  return 'info';
};

// Central wrapper for alerts, now mapped to toast.
export const showAlert = (...args: AlertArgs) => {
  const [title, message] = args;
  showToast({
    type: resolveVariant(title),
    title,
    message,
  });
};

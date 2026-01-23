import Toast from 'react-native-toast-message';
import i18n from '@/lib/i18n';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastMessageOptions = {
  type: ToastVariant;
  titleKey: string;
  messageKey?: string;
  titleOptions?: Record<string, unknown>;
  messageOptions?: Record<string, unknown>;
};

type ToastTextOptions = {
  type: ToastVariant;
  title: string;
  message?: string;
};

export const showToast = ({ type, title, message }: ToastTextOptions) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
  });
};

export const showToastByKey = ({
  type,
  titleKey,
  messageKey,
  titleOptions,
  messageOptions,
}: ToastMessageOptions) => {
  showToast({
    type,
    title: i18n.t(titleKey, titleOptions),
    message: messageKey ? i18n.t(messageKey, messageOptions) : undefined,
  });
};

import { toast as hotToast, type ToastOptions } from 'react-hot-toast';

const ACTIVE_TOAST_ID = 'c2c-active-notification';
const MAX_MESSAGE_LENGTH = 140;

const formatMessage = (message: string): string => {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_MESSAGE_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_MESSAGE_LENGTH - 1).trimEnd()}…`;
};

const optionsFor = (options?: ToastOptions): ToastOptions => ({
  ...options,
  id: ACTIVE_TOAST_ID,
});

/**
 * Application notification boundary. The product intentionally shows one
 * concise, current notification rather than an accumulating stack of stale
 * confirmations/errors.
 */
export const toast = {
  success(message: string, options?: ToastOptions) {
    hotToast.dismiss(ACTIVE_TOAST_ID);
    return hotToast.success(formatMessage(message), optionsFor(options));
  },
  error(message: string, options?: ToastOptions) {
    hotToast.dismiss(ACTIVE_TOAST_ID);
    return hotToast.error(formatMessage(message), optionsFor(options));
  },
  dismiss() {
    hotToast.dismiss(ACTIVE_TOAST_ID);
  },
};

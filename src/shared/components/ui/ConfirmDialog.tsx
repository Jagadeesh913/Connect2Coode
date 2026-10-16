import React, { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  submitting?: boolean;
  isLoading?: boolean;
  icon?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmLabel = 'Confirm',
  confirmText,
  cancelLabel = 'Cancel',
  cancelText,
  variant = 'danger',
  submitting = false,
  isLoading = false,
  icon,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const descText = description || message || '';
  const finalConfirmLabel = confirmText || confirmLabel;
  const finalCancelLabel = cancelText || cancelLabel;
  const isBusy = submitting || isLoading;

  // Focus management and ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400',
          defaultIcon: 'fa-triangle-exclamation',
          buttonBg: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
          defaultIcon: 'fa-circle-exclamation',
          buttonBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
          defaultIcon: 'fa-circle-question',
          buttonBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 text-left transform transition-all animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            <i className={`fa-solid ${icon || styles.defaultIcon} text-lg`} aria-hidden="true" />
          </div>

          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-gray-900 dark:text-white leading-snug">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
              {descText}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {finalCancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer ${styles.buttonBg}`}
          >
            {isBusy ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{finalConfirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

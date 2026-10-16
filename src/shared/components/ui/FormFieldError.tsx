import React from 'react';

export interface FormFieldErrorProps {
  id?: string;
  error?: string | null;
  className?: string;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({
  id,
  error,
  className = '',
}) => {
  if (!error) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 transition-opacity duration-150 animate-fade-in ${className}`}
    >
      <i className="fa-solid fa-circle-exclamation text-[11px] shrink-0" aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
};

import React, { forwardRef } from 'react';
import { FormFieldError } from './FormFieldError';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400 font-mono"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-gray-400 dark:text-gray-500 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full bg-white dark:bg-neutral-950 border ${
              error
                ? 'border-rose-500 dark:border-rose-500/80 focus:ring-rose-500/30 dark:focus:ring-rose-500/50 focus:border-rose-500'
                : 'border-gray-300 dark:border-white/10 focus:border-blue-500 dark:focus:border-neutral-600 focus:ring-blue-500/20 dark:focus:ring-neutral-500/30'
            } text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm px-3.5 py-2.5 transition-all outline-none focus:ring-2 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-gray-400 dark:text-gray-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <FormFieldError id={errorId} error={error} />
        ) : helperText ? (
          <span id={helperId} className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

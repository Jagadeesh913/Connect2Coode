import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  icon?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', wrapperClassName = '', options, children, icon, ...props }, ref) => {
    return (
      <div className={`relative inline-flex items-center w-full ${wrapperClassName}`}>
        {icon && (
          <i
            className={`${icon} text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none`}
            aria-hidden="true"
          />
        )}
        <select
          ref={ref}
          className={`w-full appearance-none bg-slate-50 dark:bg-[#111A2E] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 rounded-xl ${
            icon ? 'pl-9' : 'pl-3.5'
          } pr-9 py-2.5 text-xs sm:text-sm font-semibold outline-none hover:border-blue-500/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200 py-1"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <i
          className="fa-solid fa-chevron-down text-[10px] text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform"
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

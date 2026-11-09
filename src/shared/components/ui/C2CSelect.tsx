import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface C2CSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface C2CSelectProps {
  id?: string;
  value: string | number | null | undefined;
  options: C2CSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  busy?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  'aria-label'?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  leading?: React.ReactNode;
}

/**
 * Branded, keyboard-accessible single-select. Native selects cannot style the
 * browser-owned opened menu consistently, so visual selectors should use this
 * component when the option popup must match Connect2Code's UI.
 */
export const C2CSelect: React.FC<C2CSelectProps> = ({
  id,
  value,
  options,
  onChange,
  disabled = false,
  busy = false,
  placeholder = 'Select an option',
  ariaLabel,
  'aria-label': ariaLabelProp,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  leading,
}) => {
  const resolvedAriaLabel = ariaLabelProp || ariaLabel;
  const generatedId = useId();
  const listboxId = `${id || generatedId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => String(option.value) === String(value ?? ''));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const nextIndex = selectedIndex >= 0 ? selectedIndex : options.findIndex((option) => !option.disabled);
    optionRefs.current[nextIndex]?.focus();
  }, [open, options, selectedIndex]);

  const choose = (option: C2CSelectOption) => {
    if (option.disabled) return;
    onChange(String(option.value));
    setOpen(false);
  };

  const focusOption = (from: number, direction: 1 | -1) => {
    if (options.length === 0) return;
    for (let offset = 1; offset <= options.length; offset += 1) {
      const index = (from + direction * offset + options.length) % options.length;
      if (!options[index].disabled) {
        optionRefs.current[index]?.focus();
        return;
      }
    }
  };

  const hasCustomRounding = buttonClassName.includes('rounded-');
  const hasCustomBg = buttonClassName.includes('bg-');
  const hasCustomBorder = buttonClassName.includes('border-');
  const hasCustomPadding = buttonClassName.includes('py-') || buttonClassName.includes('p-');
  const hasCustomWidth = className.includes('min-w-') || className.includes('w-');

  return (
    <div ref={rootRef} className={`relative inline-flex ${hasCustomWidth ? '' : 'min-w-36'} ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled || busy || options.length === 0}
        aria-label={resolvedAriaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-busy={busy || undefined}
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
          if (event.key === 'Escape') setOpen(false);
        }}
        className={`flex w-full items-center gap-2 text-left text-xs font-semibold shadow-2xs transition-colors hover:border-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-blue-500 ${
          hasCustomBorder ? '' : 'border border-slate-200 dark:border-slate-700'
        } ${
          hasCustomPadding ? '' : 'py-1.5 pl-3 pr-3'
        } ${
          hasCustomRounding ? '' : 'rounded-full'
        } ${
          hasCustomBg ? '' : 'bg-white dark:bg-slate-800'
        } text-slate-800 dark:text-slate-200 ${buttonClassName}`}
      >
        {leading ? (
          <span aria-hidden="true" className="shrink-0">{leading}</span>
        ) : selected?.icon ? (
          <span aria-hidden="true" className="shrink-0">{selected.icon}</span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={resolvedAriaLabel || placeholder}
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-[calc(100%+0.5rem)] z-50 max-h-64 min-w-full overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-[#0D1322] dark:ring-black/40 ${menuClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = String(option.value) === String(value ?? '');
            return (
              <button
                key={String(option.value)}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => choose(option)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') { event.preventDefault(); focusOption(index, 1); }
                  if (event.key === 'ArrowUp') { event.preventDefault(); focusOption(index, -1); }
                  if (event.key === 'Home') { event.preventDefault(); optionRefs.current.find((element) => element && !element.disabled)?.focus(); }
                  if (event.key === 'End') { event.preventDefault(); [...optionRefs.current].reverse().find((element) => element && !element.disabled)?.focus(); }
                  if (event.key === 'Escape') { event.preventDefault(); setOpen(false); document.getElementById(id || generatedId)?.focus(); }
                }}
                className={`group flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {option.icon && <span aria-hidden="true" className="shrink-0">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && (
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

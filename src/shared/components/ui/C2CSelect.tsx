import React, { useEffect, useId, useRef, useState } from 'react';

export interface C2CSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
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
  className?: string;
  buttonClassName?: string;
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
  className = '',
  buttonClassName = '',
  leading,
}) => {
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

  return (
    <div ref={rootRef} className={`relative inline-flex min-w-36 ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled || busy || options.length === 0}
        aria-label={ariaLabel}
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
        className={`flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-3 text-left text-xs font-medium text-slate-900 shadow-2xs transition-colors hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-blue-500 ${buttonClassName}`}
      >
        {leading && <span aria-hidden="true" className="shrink-0">{leading}</span>}
        <span className="min-w-0 flex-1 truncate">{selected?.label || placeholder}</span>
        <i aria-hidden="true" className={`fa-solid fa-chevron-down shrink-0 text-[10px] text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel || placeholder}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-64 min-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-[#0D1322] dark:ring-black/30"
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
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <i aria-hidden="true" className="fa-solid fa-check text-xs" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

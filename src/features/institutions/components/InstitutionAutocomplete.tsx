import React, { useState, useEffect, useRef, useCallback } from 'react';
import { institutionService } from '../../../services/institutionService';
import type { InstitutionOptionDTO } from '../../../core/types/domain';

export interface InstitutionAutocompleteProps {
  id?: string;
  name?: string;
  value?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange: (value: string, selectedOption?: InstitutionOptionDTO | null) => void;
  onSelectOption?: (option: InstitutionOptionDTO) => void;
}

export const InstitutionAutocomplete: React.FC<InstitutionAutocompleteProps> = ({
  id = 'institution-autocomplete',
  name = 'institution',
  value = '',
  label,
  placeholder = 'Search college or university (min. 3 characters)...',
  error,
  disabled = false,
  required = false,
  className = '',
  onChange,
  onSelectOption,
}) => {
  const [inputValue, setInputValue] = useState<string>(value);
  const [options, setOptions] = useState<InstitutionOptionDTO[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchInstitutions = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setOptions([]);
      setLoading(false);
      setSearchFeedback('Enter at least 3 characters to search institutions');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setSearchFeedback(null);

    try {
      const res = await institutionService.searchInstitutions(
        trimmed,
        controller.signal
      );
      if (controller.signal.aborted) return;
      const data = res?.data || (Array.isArray(res) ? res : []);
      const results = Array.isArray(data) ? data.slice(0, 15) : [];
      setOptions(results);
      setActiveIndex(-1);

      if (results.length === 0) {
        setSearchFeedback(`No institutions found matching "${trimmed}"`);
      }
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      setOptions([]);
      setSearchFeedback('Unable to load institutions. Try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    abortControllerRef.current?.abort();
    setOptions([]);
    setActiveIndex(-1);
    setLoading(e.target.value.trim().length >= 3);
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue, null);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchInstitutions(newValue);
    }, 300);
  };

  const cleanName = (val: string) => (val ? val.replace(/^"+|"+$/g, '').trim() : '');

  const cancelSearch = () => {
    abortControllerRef.current?.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLoading(false);
  };
  useEffect(() => () => {
    abortControllerRef.current?.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  const handleSelectOption = (option: InstitutionOptionDTO) => {
    cancelSearch();
    const cleaned = cleanName(option.name);
    setInputValue(cleaned);
    onChange(cleaned, { ...option, name: cleaned });
    if (onSelectOption) {
      onSelectOption({ ...option, name: cleaned });
    }
    setIsOpen(false);
    setOptions([]);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    cancelSearch();
    setInputValue('');
    setOptions([]);
    setSearchFeedback(null);
    onChange('', null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        if (inputValue.trim().length >= 3) {
          fetchInstitutions(inputValue);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          handleSelectOption(options[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 font-sans ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {loading && (
            <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-mono">
              <i className="fa-solid fa-circle-notch fa-spin"></i> searching...
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-400">
          <i className="fa-solid fa-graduation-cap text-xs"></i>
        </div>

        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (inputValue.trim().length >= 3 && options.length === 0) {
              fetchInstitutions(inputValue);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-neutral-950 border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {/* Clear / Status Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Clear institution selection"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-2xl divide-y divide-slate-100 dark:divide-white/5 animate-fade-in">
          {loading && options.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <i className="fa-solid fa-spinner fa-spin text-blue-500"></i>
              <span>Searching colleges & universities...</span>
            </div>
          )}

          {!loading && options.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-gray-400">
              <p className="font-medium text-slate-700 dark:text-gray-300">
                {searchFeedback || 'Enter at least 3 characters to find your college'}
              </p>
              {inputValue.trim().length >= 3 && (
                <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-1">
                  You can keep typing to use &quot;{inputValue.trim()}&quot; as your institution.
                </p>
              )}
            </div>
          )}

          {options.length > 0 && (
            <ul role="listbox" className="py-1">
              {options.map((item, idx) => {
                const isSelected = idx === activeIndex;
                const isUniversity = item.institutionType === 'UNIVERSITY';
                const displayName = cleanName(item.name);

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption({ ...item, name: displayName })}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-location-dot text-[10px] text-slate-400"></i>
                          {item.district ? `${item.district}, ` : ''}{item.state}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        isUniversity
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                      }`}
                    >
                      {item.institutionType}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

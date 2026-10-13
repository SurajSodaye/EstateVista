import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  error,
  helperText,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  selectClassName = '',
  ...props
}) {
  const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none rounded-xl bg-white border ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-sage focus:border-forest focus:ring-sage/40'
          } py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} pr-10 text-sm text-charcoal shadow-sm focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-gray-100 disabled:opacity-60 cursor-pointer ${selectClassName}`}
          {...props}
        >
          {options.map((option) => {
            const optVal = typeof option === 'object' ? option.value : option;
            const optLabel = typeof option === 'object' ? option.label : option;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-mutedText">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-mutedText">{helperText}</p>}
    </div>
  );
}

import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  ...props
}) {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full rounded-xl bg-white border ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-sage focus:border-forest focus:ring-sage/40'
          } py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 text-sm text-charcoal placeholder-mutedText/60 shadow-sm focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-gray-100 disabled:opacity-60 ${inputClassName}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-mutedText">{helperText}</p>}
    </div>
  );
}

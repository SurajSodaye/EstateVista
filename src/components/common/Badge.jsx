import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const variants = {
    sale: 'bg-forest text-white border border-forest/30 font-semibold',
    rent: 'bg-gold-light/40 text-forest border border-gold/40 font-semibold',
    featured: 'bg-gold text-forest font-bold shadow-sm',
    type: 'bg-sage-light text-forest border border-sage/60 font-medium',
    status: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium',
    default: 'bg-ivory text-charcoal border border-sage font-medium',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md tracking-wider uppercase',
    md: 'text-xs px-2.5 py-1 rounded-lg',
    lg: 'text-sm px-3.5 py-1.5 rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center justify-center transition-colors ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}

import React from 'react';
import { SearchX } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = SearchX,
  title = 'No properties found',
  description = 'Try adjusting your search criteria, clearing filters, or exploring another location.',
  actionText = 'Clear All Filters',
  onAction,
  className = 'py-16',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center max-w-md mx-auto px-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-sage-light flex items-center justify-center text-forest mb-4 border border-sage">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-mutedText leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

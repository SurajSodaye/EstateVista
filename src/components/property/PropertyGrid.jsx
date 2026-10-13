import React from 'react';
import PropertyCard from './PropertyCard';
import EmptyState from '../common/EmptyState';
import LoadingState from '../common/LoadingState';

export default function PropertyGrid({
  properties = [],
  isLoading = false,
  emptyMessage,
  emptyTitle,
  onResetFilters,
  columns = 3,
}) {
  if (isLoading) {
    return <LoadingState message="Discovering prime properties..." />;
  }

  if (!properties || properties.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'No properties matched your criteria'}
        description={emptyMessage || 'Try modifying your filters or removing budget restrictions.'}
        actionText={onResetFilters ? 'Reset Filters' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridColsClass} gap-6 lg:gap-8`}>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

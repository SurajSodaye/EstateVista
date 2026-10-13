import React from 'react';

export default function LoadingState({
  message = 'Loading properties...',
  className = 'py-20',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="relative w-12 h-12 mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-sage border-t-forest animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gold rounded-full" />
        </div>
      </div>
      <p className="text-sm font-medium text-mutedText animate-pulse">{message}</p>
    </div>
  );
}

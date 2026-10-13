import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

export default function PropertyGallery({ images = [], title = 'Property Image' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-sage-light rounded-2xl flex items-center justify-center text-mutedText">
        No images available
      </div>
    );
  }

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Display */}
      <div className="relative aspect-[16/9] sm:aspect-[21/10] rounded-2xl overflow-hidden bg-sage-light group shadow-soft">
        <img
          src={images[currentIndex]}
          alt={`${title} - view ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500"
        />

        {/* Prev / Next controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-charcoal/60 hover:bg-forest text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-charcoal/60 hover:bg-forest text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Fullscreen Trigger */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-charcoal/70 hover:bg-forest text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>View All ({images.length})</span>
        </button>

        {/* Counter indicator */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-charcoal/70 text-white text-xs font-medium backdrop-blur-md">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative shrink-0 w-20 sm:w-28 aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${
                currentIndex === idx
                  ? 'border-forest ring-2 ring-forest/20 scale-[1.02]'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white pb-4 border-b border-white/10">
            <div>
              <p className="font-serif text-lg font-semibold">{title}</p>
              <p className="text-xs text-white/60">
                Photo {currentIndex + 1} of {images.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Main Image */}
          <div className="relative flex-grow flex items-center justify-center my-4">
            <img
              src={images[currentIndex]}
              alt={`${title} fullscreen`}
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Thumbnails */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === idx ? 'border-gold' : 'border-transparent opacity-50'
                }`}
              >
                <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

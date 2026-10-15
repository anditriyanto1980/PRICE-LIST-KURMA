import React from 'react';
import { X } from 'lucide-react';

interface ImageZoomModalProps {
  imageSrc: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageSrc, title, onClose }) => {
  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[200] no-print bg-black/90 backdrop-blur-md flex items-center justify-center p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/90 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageSrc}
          alt={title || 'Product View'}
          className="max-w-full max-h-[75vh] object-contain rounded-xl mx-auto"
        />
        {title && (
          <p className="text-center font-bold text-white mt-3 mb-1 text-sm">{title}</p>
        )}
      </div>
    </div>
  );
};

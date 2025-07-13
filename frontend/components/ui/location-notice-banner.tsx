"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface LocationNoticeBannerProps {
  onDismiss?: () => void;
}

export function LocationNoticeBanner({ onDismiss }: LocationNoticeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Location Notice:</strong> For best results, please use locations within India. Distance calculations are optimized for Indian locations.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-auto pl-3"
          aria-label="Dismiss notice"
        >
          <X className="h-5 w-5 text-blue-400 hover:text-blue-600" />
        </button>
      </div>
    </div>
  );
} 
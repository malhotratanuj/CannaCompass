import React, { useState, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
  isVisible: boolean;
  onClose: () => void;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'bottom',
  children,
  isVisible,
  onClose,
  step,
  totalSteps,
  onNext,
  onPrevious,
  onSkip
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => {
        setMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'right':
        return 'left-full ml-2';
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      default:
        return 'top-full mt-2';
    }
  };

  if (!mounted) return <>{children}</>;

  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={`absolute z-50 transition-opacity duration-300 ${getPositionClasses()} ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500">Step {step} of {totalSteps}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-3">{content}</p>
          <div className="flex justify-between items-center">
            <div>
              {onSkip && (
                <button 
                  onClick={onSkip} 
                  className="text-xs text-gray-500 hover:text-gray-700 mr-2"
                >
                  Skip tutorial
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              {step > 1 && onPrevious && (
                <button 
                  onClick={onPrevious} 
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Previous
                </button>
              )}
              {step < totalSteps && onNext && (
                <button 
                  onClick={onNext} 
                  className="px-2 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded"
                >
                  Next
                </button>
              )}
              {step === totalSteps && (
                <button 
                  onClick={onClose} 
                  className="px-2 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
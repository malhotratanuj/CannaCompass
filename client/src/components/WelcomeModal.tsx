import React from 'react';
import { X } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { startTutorial } = useTutorial();

  if (!isOpen) return null;

  const handleStartTutorial = () => {
    startTutorial();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4 relative animate-fadeIn">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CannaFind!</h2>
          <p className="text-gray-600">
            Your personal guide to finding the perfect cannabis strain based on your mood and preferences.
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">What you can do with CannaFind:</h3>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>Select your desired mood to get personalized strain recommendations</li>
            <li>View detailed information about each strain</li>
            <li>Find nearby dispensaries that carry your selected strains</li>
            <li>Compare prices and availability</li>
          </ul>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Skip Tutorial
          </button>
          <button
            onClick={handleStartTutorial}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Start Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
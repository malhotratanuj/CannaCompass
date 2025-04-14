import { FC } from 'react';
import { Shield, Check } from 'lucide-react';

interface PrivacyConsentProps {
  onAccept: () => void;
  onCustomize: () => void;
}

const PrivacyConsent: FC<PrivacyConsentProps> = ({ onAccept, onCustomize }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">Your Privacy Matters</h3>
          </div>
          
          <p className="text-gray-600 mb-4">To provide personalized strain recommendations and find nearby stores, we need to collect some information:</p>
          
          <ul className="mb-4 space-y-2">
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span className="text-sm text-gray-600">Your location (only when you request nearby stores)</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span className="text-sm text-gray-600">Your preferences (to personalize recommendations)</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span className="text-sm text-gray-600">Basic browser information (for site functionality)</span>
            </li>
          </ul>
          
          <p className="text-sm text-gray-500 mb-6">We never sell your data or share it with third parties without your consent. Read our full <a href="#" className="text-primary-600 hover:text-primary-800">Privacy Policy</a> for more details.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onAccept}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm transition duration-150 ease-in-out"
            >
              Accept & Continue
            </button>
            <button 
              onClick={onCustomize}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg shadow-sm transition duration-150 ease-in-out"
            >
              Customize Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsent;

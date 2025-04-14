import { FC } from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onRestart?: () => void;
}

const ProgressBar: FC<ProgressBarProps> = ({ 
  currentStep, 
  totalSteps = 4,
  onRestart
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  const steps = [
    { name: 'Mood', isActive: currentStep >= 1 },
    { name: 'Effects', isActive: currentStep >= 2 },
    { name: 'Recommendations', isActive: currentStep >= 3 },
    { name: 'Find Stores', isActive: currentStep >= 4 }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-primary-700">Your Journey</span>
        {onRestart && (
          <button 
            onClick={onRestart}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Restart
          </button>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={step.isActive ? "text-primary-700 font-medium" : ""}
          >
            {step.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;

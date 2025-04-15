import React, { useEffect, useState } from 'react';
import { useTutorial, tutorialSteps } from '@/contexts/TutorialContext';
import Tooltip from './Tooltip';

interface TutorialTooltipProps {
  targetId: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}

const TutorialTooltip: React.FC<TutorialTooltipProps> = ({ 
  targetId, 
  position = 'bottom', 
  children 
}) => {
  const { 
    isTutorialActive, 
    currentStep, 
    nextStep, 
    previousStep, 
    skipTutorial, 
    endTutorial 
  } = useTutorial();
  
  const [isVisible, setIsVisible] = useState(false);
  
  // Check if this tooltip should be shown for the current step
  useEffect(() => {
    if (isTutorialActive) {
      const currentStepData = tutorialSteps[currentStep];
      setIsVisible(currentStepData && currentStepData.targetId === targetId);
    } else {
      setIsVisible(false);
    }
  }, [isTutorialActive, currentStep, targetId]);

  const handleClose = () => {
    endTutorial();
  };

  const content = isTutorialActive && tutorialSteps[currentStep] 
    ? tutorialSteps[currentStep].content 
    : '';

  return (
    <Tooltip
      content={content}
      position={position}
      isVisible={isVisible}
      onClose={handleClose}
      step={currentStep + 1}
      totalSteps={tutorialSteps.length}
      onNext={nextStep}
      onPrevious={previousStep}
      onSkip={skipTutorial}
    >
      {children}
    </Tooltip>
  );
};

export default TutorialTooltip;
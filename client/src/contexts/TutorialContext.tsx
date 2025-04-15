import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface TutorialContextType {
  isTutorialActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  setStepForLocation: (path: string) => void;
  tutorialCompleted: boolean;
}

interface TutorialStep {
  path: string;
  title: string;
  content: string;
  targetId: string;
}

export const tutorialSteps: TutorialStep[] = [
  {
    path: "/",
    title: "Welcome to CannaFind",
    content: "Find your perfect cannabis strain based on your mood and preferences. This quick tutorial will guide you through the app.",
    targetId: "home-intro"
  },
  {
    path: "/mood-selection",
    title: "Select Your Mood",
    content: "Start by selecting the mood you want to experience. Click on one of these mood cards.",
    targetId: "mood-selection"
  },
  {
    path: "/mood-selection",
    title: "Experience Level",
    content: "Let us know your experience level with cannabis to get appropriate recommendations.",
    targetId: "experience-level"
  },
  {
    path: "/effects-preferences",
    title: "Customize Effects",
    content: "Select the specific effects you want. You can choose multiple options.",
    targetId: "effects-selection"
  },
  {
    path: "/effects-preferences",
    title: "Flavor Preferences",
    content: "Choose your preferred flavors to further personalize your recommendations.",
    targetId: "flavor-selection"
  },
  {
    path: "/recommendations",
    title: "Strain Recommendations",
    content: "Here are your personalized strain recommendations. Click on any strain card to select it.",
    targetId: "strain-recommendations"
  },
  {
    path: "/store-finder",
    title: "Find Nearby Stores",
    content: "Enter your location to find dispensaries near you that carry your selected strains.",
    targetId: "store-finder"
  }
];

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [location] = useLocation();

  // Check local storage to see if the tutorial has been completed before
  useEffect(() => {
    const completed = localStorage.getItem('tutorialCompleted') === 'true';
    setTutorialCompleted(completed);
  }, []);

  // Save tutorial completion status to local storage
  useEffect(() => {
    if (tutorialCompleted) {
      localStorage.setItem('tutorialCompleted', 'true');
    }
  }, [tutorialCompleted]);

  // Automatically set the step based on current location
  useEffect(() => {
    if (isTutorialActive) {
      const pathSteps = tutorialSteps.filter(step => step.path === location);
      if (pathSteps.length > 0) {
        const stepIndex = tutorialSteps.findIndex(step => step.path === location);
        if (stepIndex >= 0) {
          setCurrentStep(stepIndex);
        }
      }
    }
  }, [location, isTutorialActive]);

  const startTutorial = () => {
    setIsTutorialActive(true);
    setCurrentStep(0);
  };

  const endTutorial = () => {
    setIsTutorialActive(false);
    setTutorialCompleted(true);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      endTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  const skipTutorial = () => {
    endTutorial();
  };

  const setStepForLocation = (path: string) => {
    const steps = tutorialSteps.filter(step => step.path === path);
    if (steps.length > 0) {
      const stepIndex = tutorialSteps.findIndex(step => step.path === path);
      if (stepIndex >= 0) {
        setCurrentStep(stepIndex);
      }
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        isTutorialActive,
        currentStep,
        startTutorial,
        endTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        setStepForLocation,
        tutorialCompleted
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
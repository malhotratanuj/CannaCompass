import { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import CelebrationMessage from '@/components/CelebrationMessage';

// Define the types of milestones that can trigger celebrations
export type MilestoneType = 
  | 'account_created'
  | 'first_login'
  | 'strain_selected'
  | 'strain_saved' 
  | 'dispensary_found'
  | 'tutorial_completed'
  | 'preferences_saved'
  | 'review_submitted';

export interface CelebrationContextType {
  celebrateMilestone: (milestone: MilestoneType) => void;
  triggerCelebration: (milestone: MilestoneType) => void; // Alias for celebrateMilestone
  clearCelebration: () => void;
  activeMilestone: MilestoneType | null;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [activeMilestone, setActiveMilestone] = useState<MilestoneType | null>(null);
  
  // Get stored milestones from localStorage
  const getCompletedMilestones = useCallback((): MilestoneType[] => {
    if (typeof window === 'undefined') return [];
    
    const storedMilestones = localStorage.getItem('completedMilestones');
    return storedMilestones ? JSON.parse(storedMilestones) : [];
  }, []);
  
  // Save a milestone to localStorage to prevent repeated celebrations
  const saveMilestone = useCallback((milestone: MilestoneType) => {
    if (typeof window === 'undefined') return;
    
    const completedMilestones = getCompletedMilestones();
    if (!completedMilestones.includes(milestone)) {
      completedMilestones.push(milestone);
      localStorage.setItem('completedMilestones', JSON.stringify(completedMilestones));
    }
  }, [getCompletedMilestones]);
  
  // Check if this milestone has already been celebrated
  const hasCelebrated = useCallback((milestone: MilestoneType): boolean => {
    return getCompletedMilestones().includes(milestone);
  }, [getCompletedMilestones]);
  
  // Start a celebration for a specific milestone (if not already celebrated)
  const celebrateMilestone = useCallback((milestone: MilestoneType) => {
    if (!hasCelebrated(milestone)) {
      setActiveMilestone(milestone);
      saveMilestone(milestone);
    }
  }, [hasCelebrated, saveMilestone]);
  
  // Clear the current celebration
  const clearCelebration = useCallback(() => {
    setActiveMilestone(null);
  }, []);
  
  return (
    <CelebrationContext.Provider
      value={{
        celebrateMilestone,
        triggerCelebration: celebrateMilestone, // Alias for backward compatibility
        clearCelebration,
        activeMilestone
      }}
    >
      {children}
      <ConfettiCelebration 
        isActive={!!activeMilestone}
        onComplete={clearCelebration}
      />
      <CelebrationMessage
        milestone={activeMilestone}
        onClose={clearCelebration}
      />
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}
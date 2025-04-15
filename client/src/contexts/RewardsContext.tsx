import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define the reward types and point values
export type RewardType = 
  | 'tutorial_step' 
  | 'tutorial_complete' 
  | 'first_mood_selection' 
  | 'first_strain_selection'
  | 'first_store_view'
  | 'first_recommendation'
  | 'profile_complete';

// Define point values for each reward type
export const REWARD_POINTS: Record<RewardType, number> = {
  tutorial_step: 5,              // For each tutorial step completed
  tutorial_complete: 25,         // Bonus for completing the full tutorial
  first_mood_selection: 10,      // First time selecting a mood
  first_strain_selection: 15,    // First time selecting a strain
  first_store_view: 15,          // First time viewing a store
  first_recommendation: 10,      // First time getting recommendations
  profile_complete: 20,          // Completing profile settings
};

// Achievement milestones
export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointThreshold: number;
  unlocked: boolean;
  icon: string;
}

// Initial achievements
const initialAchievements: Achievement[] = [
  {
    id: 'beginner',
    name: 'Cannabis Curious',
    description: 'Earned your first 10 points',
    pointThreshold: 10,
    unlocked: false,
    icon: '🌱',
  },
  {
    id: 'intermediate',
    name: 'Budding Explorer',
    description: 'Earned 50 points by exploring the app',
    pointThreshold: 50,
    unlocked: false,
    icon: '🌿',
  },
  {
    id: 'advanced',
    name: 'Cannabis Connoisseur',
    description: 'Reached 100 points and completed the tutorial',
    pointThreshold: 100,
    unlocked: false,
    icon: '🍁',
  },
  {
    id: 'master',
    name: 'Strain Aficionado',
    description: 'Power user with 200+ points',
    pointThreshold: 200,
    unlocked: false,
    icon: '⭐',
  },
];

// Define the context type
interface RewardsContextType {
  points: number;
  achievements: Achievement[];
  earnedRewards: RewardType[];
  addPoints: (type: RewardType) => void;
  hasEarnedReward: (type: RewardType) => boolean;
}

// Create the context
const RewardsContext = createContext<RewardsContextType | null>(null);

// Create the provider component
export const RewardsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  
  // Initialize state from localStorage if available
  const [points, setPoints] = useState<number>(() => {
    const savedPoints = localStorage.getItem('rewards_points');
    return savedPoints ? parseInt(savedPoints, 10) : 0;
  });
  
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const savedAchievements = localStorage.getItem('rewards_achievements');
    return savedAchievements ? JSON.parse(savedAchievements) : initialAchievements;
  });
  
  const [earnedRewards, setEarnedRewards] = useState<RewardType[]>(() => {
    const savedRewards = localStorage.getItem('earned_rewards');
    return savedRewards ? JSON.parse(savedRewards) : [];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('rewards_points', points.toString());
    localStorage.setItem('rewards_achievements', JSON.stringify(achievements));
    localStorage.setItem('earned_rewards', JSON.stringify(earnedRewards));
  }, [points, achievements, earnedRewards]);

  // Add points for a particular action
  const addPoints = (type: RewardType) => {
    // Check if this reward has already been earned
    if (earnedRewards.includes(type)) {
      if (type !== 'tutorial_step') {
        // If it's not a tutorial step (which can be earned multiple times),
        // return early since we don't want to award points again
        return;
      }
    }
    
    const pointsToAdd = REWARD_POINTS[type];
    const newTotal = points + pointsToAdd;
    
    // Check if any achievements are newly unlocked
    const updatedAchievements = achievements.map(achievement => {
      if (!achievement.unlocked && newTotal >= achievement.pointThreshold) {
        // Show toast notification for new achievements
        toast({
          title: `Achievement Unlocked: ${achievement.name}`,
          description: `${achievement.icon} ${achievement.description}`,
          variant: "success",
        });
        return { ...achievement, unlocked: true };
      }
      return achievement;
    });
    
    // Show toast notification for points earned
    toast({
      title: "Points Earned!",
      description: `+${pointsToAdd} points for ${formatRewardType(type)}`,
    });
    
    // Update states
    setPoints(newTotal);
    setAchievements(updatedAchievements);
    
    // If this is not already in earnedRewards, add it
    if (!earnedRewards.includes(type)) {
      setEarnedRewards([...earnedRewards, type]);
    }
  };
  
  // Helper to check if a reward has been earned
  const hasEarnedReward = (type: RewardType): boolean => {
    return earnedRewards.includes(type);
  };
  
  // Format reward type for display
  const formatRewardType = (type: RewardType): string => {
    switch (type) {
      case 'tutorial_step':
        return 'Tutorial Step Completed';
      case 'tutorial_complete':
        return 'Tutorial Completed';
      case 'first_mood_selection':
        return 'First Mood Selection';
      case 'first_strain_selection':
        return 'First Strain Selection';
      case 'first_store_view':
        return 'First Store View';
      case 'first_recommendation':
        return 'First Strain Recommendation';
      case 'profile_complete':
        return 'Profile Completed';
      default:
        return type.replace('_', ' ');
    }
  };

  return (
    <RewardsContext.Provider value={{ 
      points, 
      achievements, 
      earnedRewards, 
      addPoints, 
      hasEarnedReward 
    }}>
      {children}
    </RewardsContext.Provider>
  );
};

// Create a custom hook for accessing the rewards context
export const useRewards = (): RewardsContextType => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};
import { FC, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import ProgressBar from '@/components/ProgressBar';
import MoodCard from '@/components/MoodCard';
import { Button } from '@/components/ui/button';
import { RecommendationRequest } from '@shared/schema';
import { MoodType, MOODS, ExperienceLevel } from '@/types';
import TutorialTooltip from '@/components/TutorialTooltip';
import { useTutorial } from '@/contexts/TutorialContext';

interface MoodSelectionProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  preferences: RecommendationRequest;
  updatePreferences: (preferences: Partial<RecommendationRequest>) => void;
}

const MoodSelection: FC<MoodSelectionProps> = ({ 
  currentStep, 
  onStepChange, 
  preferences, 
  updatePreferences 
}) => {
  const [_, setLocation] = useLocation();
  const [selectedMood, setSelectedMood] = useState<MoodType | ''>('');
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel>('beginner');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  useEffect(() => {
    // If we already have preferences, pre-select them
    if (preferences.mood) {
      setSelectedMood(preferences.mood as MoodType);
    }
    
    if (preferences.experienceLevel) {
      setSelectedExperience(preferences.experienceLevel as ExperienceLevel);
    }
    
    onStepChange(1);
  }, [preferences, onStepChange]);

  useEffect(() => {
    // Enable button if mood is selected
    setIsButtonEnabled(!!selectedMood);
  }, [selectedMood]);

  const handleMoodSelect = (mood: MoodType) => {
    console.log('Mood selected:', mood);
    
    // Toggle selection if clicking the same mood again
    if (selectedMood === mood) {
      setSelectedMood('');
    } else {
      setSelectedMood(mood);
      
      // Pre-load the next page data if needed
      updatePreferences({
        mood: mood,
        experienceLevel: selectedExperience
      });
    }
    
    // Visual feedback through console
    console.log('Updated selectedMood to:', selectedMood === mood ? '' : mood);
  };

  const handleExperienceChange = (experience: ExperienceLevel) => {
    setSelectedExperience(experience);
  };

  const handleNextStep = () => {
    updatePreferences({
      mood: selectedMood,
      experienceLevel: selectedExperience
    });
    
    setLocation('/effects-preferences');
  };

  const handleRestart = () => {
    setSelectedMood('');
    setSelectedExperience('beginner');
    updatePreferences({
      mood: '',
      experienceLevel: 'beginner',
      effects: [],
      flavors: [],
      consumptionMethod: []
    });
  };

  // Create an array of all mood types
  const moodTypes: MoodType[] = ['relaxed', 'energetic', 'creative', 'focused', 'sleepy', 'happy'];

  return (
    <div>
      <ProgressBar 
        currentStep={currentStep} 
        onRestart={handleRestart}
      />
      
      <div className="relative mb-8">
        <div className="absolute top-1 left-1">
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            size="sm"
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            title="Go back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How would you like to feel today?</h2>
        <p className="text-gray-600 mb-6">Select your desired mood or experience to get personalized strain recommendations.</p>
        
        <div id="mood-selection" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <TutorialTooltip targetId="mood-selection" position="right">
            {moodTypes.map((mood) => (
              <MoodCard 
                key={mood}
                mood={mood}
                selected={selectedMood === mood}
                onClick={handleMoodSelect}
              />
            ))}
          </TutorialTooltip>
        </div>
        
        <div id="experience-level">
          <TutorialTooltip targetId="experience-level" position="bottom">
            <h3 className="text-lg font-semibold mb-3">Experience Level</h3>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <input 
                  id="beginner" 
                  name="experience" 
                  type="radio" 
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={selectedExperience === 'beginner'}
                  onChange={() => handleExperienceChange('beginner')}
                />
                <label htmlFor="beginner" className="ml-2 block text-sm font-medium text-gray-700">Beginner</label>
              </div>
              <div className="flex items-center mb-2">
                <input 
                  id="intermediate" 
                  name="experience" 
                  type="radio" 
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={selectedExperience === 'intermediate'}
                  onChange={() => handleExperienceChange('intermediate')}
                />
                <label htmlFor="intermediate" className="ml-2 block text-sm font-medium text-gray-700">Intermediate</label>
              </div>
              <div className="flex items-center">
                <input 
                  id="experienced" 
                  name="experience" 
                  type="radio" 
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={selectedExperience === 'experienced'}
                  onChange={() => handleExperienceChange('experienced')}
                />
                <label htmlFor="experienced" className="ml-2 block text-sm font-medium text-gray-700">Experienced</label>
              </div>
            </div>
          </TutorialTooltip>
        </div>
        
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleNextStep}
            disabled={!isButtonEnabled}
            className={`px-6 py-3 font-medium rounded-lg shadow-sm transition duration-150 ease-in-out ${
              isButtonEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white transform hover:-translate-y-1 hover:shadow-md border-2 border-green-700' 
                : 'bg-gray-200 text-gray-600 border border-gray-300 cursor-not-allowed'
            }`}
            style={{
              boxShadow: isButtonEnabled ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
              minWidth: '200px'
            }}
          >
            {isButtonEnabled 
              ? 'Continue With ' + selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1) 
              : 'Select a Mood First'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoodSelection;

import { FC, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import ProgressBar from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { RecommendationRequest } from '@shared/schema';
import { EFFECTS, FLAVORS, CONSUMPTION_METHODS, MoodType } from '@/types';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import TutorialTooltip from '@/components/TutorialTooltip';
import { useTutorial } from '@/contexts/TutorialContext';
import { getEffectsByMood, isEffectCompatibleWithMood } from '@/lib/moodEffectMapping';

interface EffectsPreferencesProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  preferences: RecommendationRequest;
  updatePreferences: (preferences: Partial<RecommendationRequest>) => void;
}

const EffectsPreferences: FC<EffectsPreferencesProps> = ({ 
  currentStep, 
  onStepChange, 
  preferences, 
  updatePreferences 
}) => {
  const [_, setLocation] = useLocation();
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedConsumptionMethods, setSelectedConsumptionMethods] = useState<string[]>([]);
  const [compatibleEffects, setCompatibleEffects] = useState<string[]>(EFFECTS);

  // Initialize preferred effects when component mounts
  useEffect(() => {
    // If we already have preferences, pre-select them
    if (preferences.effects) {
      setSelectedEffects(preferences.effects);
    }
    
    if (preferences.flavors) {
      setSelectedFlavors(preferences.flavors);
    }
    
    if (preferences.consumptionMethod) {
      setSelectedConsumptionMethods(preferences.consumptionMethod);
    }
    
    onStepChange(2);
  }, [preferences.effects, preferences.flavors, preferences.consumptionMethod, onStepChange]);

  // Filter effects based on mood separately to avoid dependency loop
  useEffect(() => {
    // If we have a mood selected, filter effects based on the mood
    if (preferences.mood) {
      const mood = preferences.mood as MoodType;
      setCompatibleEffects(getEffectsByMood(mood));
      
      // Also filter out incompatible effects from currently selected effects
      // Only run this once when the component mounts or mood changes
      if (preferences.effects) {
        const newSelectedEffects = preferences.effects.filter(effect => 
          isEffectCompatibleWithMood(effect, mood)
        );
        
        if (JSON.stringify(newSelectedEffects) !== JSON.stringify(preferences.effects)) {
          setSelectedEffects(newSelectedEffects);
          
          // Update the preferences object to reflect the filtered effects
          updatePreferences({
            effects: newSelectedEffects
          });
        }
      }
    } else {
      setCompatibleEffects(EFFECTS);
    }
  }, [preferences.mood]);

  const toggleEffect = (effect: string) => {
    if (selectedEffects.includes(effect)) {
      setSelectedEffects(selectedEffects.filter(e => e !== effect));
    } else {
      setSelectedEffects([...selectedEffects, effect]);
    }
  };

  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      setSelectedFlavors([...selectedFlavors, flavor]);
    }
  };

  const toggleConsumptionMethod = (method: string) => {
    if (selectedConsumptionMethods.includes(method)) {
      setSelectedConsumptionMethods(selectedConsumptionMethods.filter(m => m !== method));
    } else {
      setSelectedConsumptionMethods([...selectedConsumptionMethods, method]);
    }
  };

  const handlePrevStep = () => {
    // Save current preferences before going back
    updatePreferences({
      effects: selectedEffects,
      flavors: selectedFlavors,
      consumptionMethod: selectedConsumptionMethods
    });
    
    setLocation('/mood-selection');
  };

  const handleNextStep = () => {
    // Save preferences and go to recommendations
    updatePreferences({
      effects: selectedEffects,
      flavors: selectedFlavors,
      consumptionMethod: selectedConsumptionMethods
    });
    
    setLocation('/recommendations');
  };

  const handleRestart = () => {
    setSelectedEffects([]);
    setSelectedFlavors([]);
    setSelectedConsumptionMethods([]);
    updatePreferences({
      mood: '',
      experienceLevel: 'beginner',
      effects: [],
      flavors: [],
      consumptionMethod: []
    });
    setLocation('/mood-selection');
  };

  return (
    <div>
      <ProgressBar 
        currentStep={currentStep} 
        onRestart={handleRestart}
      />
      
      <div className="relative">
        <div className="absolute top-1 left-1">
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            size="sm"
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            title="Go back to home"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Fine-tune your experience</h2>
        <p className="text-gray-600 mb-6">Adjust your preferences to get more personalized recommendations.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div id="effects-selection" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <TutorialTooltip targetId="effects-selection" position="right">
              <h3 className="text-lg font-semibold mb-4">
                Desired Effects
                {preferences.mood && (
                  <span className="ml-2 text-sm text-gray-500 font-normal">
                    (Filtered for {preferences.mood} mood)
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {EFFECTS.map((effect) => {
                  const isCompatible = preferences.mood ? 
                    isEffectCompatibleWithMood(effect, preferences.mood as MoodType) : 
                    true;
                  
                  if (!isCompatible && !selectedEffects.includes(effect)) {
                    return null; // Don't show incompatible effects unless already selected
                  }
                  
                  return (
                    <div key={effect} className="flex items-center">
                      <button 
                        onClick={() => toggleEffect(effect)}
                        className={`flex items-center focus:outline-none ${!isCompatible ? 'opacity-50' : ''}`}
                        title={!isCompatible ? `This effect may not be ideal for a ${preferences.mood} mood` : ''}
                      >
                        {selectedEffects.includes(effect) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                        <span className="ml-2 text-sm text-gray-700">{effect}</span>
                        {!isCompatible && selectedEffects.includes(effect) && (
                          <span className="ml-2 text-xs text-amber-600">
                            (not ideal for {preferences.mood} mood)
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </TutorialTooltip>
          </div>
          
          <div id="flavor-selection" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <TutorialTooltip targetId="flavor-selection" position="left">
              <h3 className="text-lg font-semibold mb-4">Preferred Flavors</h3>
              <div className="space-y-2">
                {FLAVORS.map((flavor) => (
                  <div key={flavor} className="flex items-center">
                    <button 
                      onClick={() => toggleFlavor(flavor)}
                      className="flex items-center focus:outline-none"
                    >
                      {selectedFlavors.includes(flavor) ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className="ml-2 text-sm text-gray-700">{flavor}</span>
                    </button>
                  </div>
                ))}
              </div>
            </TutorialTooltip>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Consumption Preference</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CONSUMPTION_METHODS.map((method) => (
              <div key={method} className="flex items-center">
                <button 
                  onClick={() => toggleConsumptionMethod(method)}
                  className="flex items-center focus:outline-none"
                >
                  {selectedConsumptionMethods.includes(method) ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                  <span className="ml-2 text-sm text-gray-700">{method}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePrevStep}
            variant="outline"
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg shadow-sm transition duration-150 ease-in-out"
          >
            Back
          </Button>
          <Button
            onClick={handleNextStep}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition duration-150 ease-in-out animate-pulse-green"
          >
            View Recommendations
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EffectsPreferences;

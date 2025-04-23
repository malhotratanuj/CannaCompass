import { MoodType, EFFECTS } from '@/types';

// Map each mood to its compatible effects
export const MOOD_EFFECT_MAPPING: Record<MoodType, string[]> = {
  // Relaxed mood aligns with calming effects
  relaxed: [
    'Relaxation',
    'Pain Relief',
    'Stress Relief',
    'Appetite Stimulation'
  ],
  
  // Energetic mood aligns with uplifting effects
  energetic: [
    'Energy',
    'Focus',
    'Social Uplift',
    'Creativity'
  ],
  
  // Creative mood aligns with inspiring effects
  creative: [
    'Creativity',
    'Euphoria',
    'Social Uplift',
    'Focus'
  ],
  
  // Focused mood aligns with concentration effects
  focused: [
    'Focus',
    'Energy',
    'Stress Relief',
    'Pain Relief'
  ],
  
  // Sleepy mood aligns with sedative effects
  sleepy: [
    'Sleep Aid',
    'Relaxation',
    'Pain Relief',
    'Stress Relief'
  ],
  
  // Happy mood aligns with uplifting effects
  happy: [
    'Euphoria',
    'Social Uplift',
    'Creativity',
    'Stress Relief',
    'Appetite Stimulation'
  ]
};

// Helper function to get effects compatible with a selected mood
export function getEffectsByMood(mood: MoodType | ''): string[] {
  if (!mood) {
    // If no mood is selected, return all effects
    return EFFECTS;
  }
  
  return MOOD_EFFECT_MAPPING[mood] || EFFECTS;
}

// Function to check if an effect is compatible with a mood
export function isEffectCompatibleWithMood(effect: string, mood: MoodType | ''): boolean {
  if (!mood) return true;
  return MOOD_EFFECT_MAPPING[mood]?.includes(effect) || false;
}
export type MoodType = 'relaxed' | 'energetic' | 'creative' | 'focused' | 'sleepy' | 'happy';

export interface MoodInfo {
  name: string;
  color: string;
  icon: string;
  description: string;
}

export const MOODS: Record<MoodType, MoodInfo> = {
  relaxed: {
    name: 'Relaxed',
    color: 'bg-mood-relaxed',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm10 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-5 4.62c2.49 0 4.5-2.01 4.5-4.5h-9c0 2.49 2.01 4.5 4.5 4.5z',
    description: 'Calm & chill'
  },
  energetic: {
    name: 'Energetic',
    color: 'bg-mood-energetic',
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    description: 'Active & uplifted'
  },
  creative: {
    name: 'Creative',
    color: 'bg-mood-creative',
    icon: 'M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 16.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm1-4.25h-2V8h2z',
    description: 'Inspired & imaginative'
  },
  focused: {
    name: 'Focused',
    color: 'bg-mood-focused',
    icon: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z',
    description: 'Clear & concentrated'
  },
  sleepy: {
    name: 'Sleepy',
    color: 'bg-mood-sleepy',
    icon: 'M17 18a5 5 0 0 0-10 0M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1M12 2L8 6h8l-4-4z',
    description: 'Relaxed & drowsy'
  },
  happy: {
    name: 'Happy',
    color: 'bg-mood-happy',
    icon: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
    description: 'Euphoric & blissful'
  }
};

export type ExperienceLevel = 'beginner' | 'intermediate' | 'experienced';

export const EFFECTS = [
  'Relaxation',
  'Sleep Aid',
  'Pain Relief',
  'Appetite Stimulation',
  'Social Uplift',
  'Creativity',
  'Energy',
  'Focus',
  'Euphoria',
  'Stress Relief'
];

export const FLAVORS = [
  'Earthy',
  'Sweet',
  'Citrus',
  'Pine',
  'Berry',
  'Grape',
  'Diesel',
  'Spicy',
  'Woody',
  'Herbal'
];

export const CONSUMPTION_METHODS = [
  'Flower',
  'Vape',
  'Edibles',
  'Tinctures',
  'Concentrates',
  'Topicals'
];

export type DeliveryOption = 'pickup' | 'delivery' | 'both';

export interface StoreFinderFilters {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  useCurrentLocation: boolean;
  deliveryOption: DeliveryOption;
  maxDistance: number;
}

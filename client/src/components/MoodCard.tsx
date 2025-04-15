import { FC } from 'react';
import { MoodType, MOODS } from '@/types';

interface MoodCardProps {
  mood: MoodType;
  selected: boolean;
  onClick: (mood: MoodType) => void;
}

const MoodCard: FC<MoodCardProps> = ({ mood, selected, onClick }) => {
  const moodInfo = MOODS[mood];
  const borderColor = selected ? 'border-primary-600' : 'border-gray-200';
  const bgColor = selected ? 'bg-primary-50' : 'bg-white';

  // Map mood colors to text colors for the icons
  const colorMap: Record<string, string> = {
    'bg-blue-100': 'text-blue-600',
    'bg-red-100': 'text-red-600',
    'bg-purple-100': 'text-purple-600',
    'bg-yellow-100': 'text-yellow-600',
    'bg-indigo-100': 'text-indigo-600',
    'bg-green-100': 'text-green-600',
  };
  
  const iconColor = colorMap[moodInfo.color] || 'text-primary-600';
  
  // Simple icons for each mood type
  const getMoodIcon = (moodType: MoodType) => {
    switch(moodType) {
      case 'relaxed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'energetic':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'creative':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'focused':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'sleepy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'happy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <div 
      className={`mood-card cursor-pointer ${bgColor} rounded-xl shadow-sm border ${borderColor} p-4 flex flex-col items-center transition-all duration-200 hover:-translate-y-1 ${selected ? 'selected' : ''}`}
      onClick={() => onClick(mood)}
      data-mood={mood}
    >
      <div className={`w-16 h-16 rounded-full ${moodInfo.color} flex items-center justify-center mb-3`}>
        {getMoodIcon(mood)}
      </div>
      <span className="font-medium">{moodInfo.name}</span>
      <span className="text-xs text-gray-500 mt-1">{moodInfo.description}</span>
    </div>
  );
};

export default MoodCard;

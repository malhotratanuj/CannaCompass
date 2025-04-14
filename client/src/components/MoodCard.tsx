import { FC } from 'react';
import { MoodType, MOODS } from '@/types';

interface MoodCardProps {
  mood: MoodType;
  selected: boolean;
  onClick: (mood: MoodType) => void;
}

const MoodCard: FC<MoodCardProps> = ({ mood, selected, onClick }) => {
  const moodInfo = MOODS[mood];
  const bgOpacity = selected ? 'bg-opacity-10' : 'bg-opacity-20';
  const borderColor = selected ? 'border-primary-600' : 'border-gray-200';
  const bgColor = selected ? 'bg-primary-50' : 'bg-white';
  
  return (
    <div 
      className={`mood-card cursor-pointer ${bgColor} rounded-xl shadow-sm border ${borderColor} p-4 flex flex-col items-center transition-all duration-200 hover:-translate-y-1 ${selected ? 'selected' : ''}`}
      onClick={() => onClick(mood)}
      data-mood={mood}
    >
      <div className={`w-16 h-16 rounded-full ${moodInfo.color} ${bgOpacity} flex items-center justify-center mb-3`}>
        <svg
          className={`w-8 h-8 text-${moodInfo.color.split('-')[1]}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={moodInfo.icon} />
        </svg>
      </div>
      <span className="font-medium">{moodInfo.name}</span>
      <span className="text-xs text-gray-500 mt-1">{moodInfo.description}</span>
    </div>
  );
};

export default MoodCard;

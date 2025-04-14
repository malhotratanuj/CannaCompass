import { FC } from 'react';
import { Strain } from '@shared/schema';
import { Star } from 'lucide-react';

interface StrainCardProps {
  strain: Strain;
  selected?: boolean;
  onSelect?: (strain: Strain) => void;
  onViewDetails?: (strain: Strain) => void;
}

const StrainCard: FC<StrainCardProps> = ({ 
  strain, 
  selected = false,
  onSelect,
  onViewDetails
}) => {
  const { 
    name, 
    breeder, 
    type, 
    thcContent, 
    cbdContent, 
    terpenes, 
    effects, 
    flavors, 
    rating, 
    reviewCount, 
    imageUrl 
  } = strain;

  // Determine badge color based on strain type
  const typeBadgeColor = type === 'Indica' 
    ? 'bg-primary-100 text-primary-800' 
    : type === 'Sativa' 
      ? 'bg-amber-100 text-amber-800' 
      : 'bg-blue-100 text-blue-800';
  
  // Map effects to mood colors
  const effectColorMap: Record<string, string> = {
    'Relaxing': 'bg-mood-relaxed bg-opacity-10 text-mood-relaxed',
    'Sleepy': 'bg-mood-sleepy bg-opacity-10 text-mood-sleepy',
    'Happy': 'bg-mood-happy bg-opacity-10 text-mood-happy',
    'Creative': 'bg-mood-creative bg-opacity-10 text-mood-creative',
    'Energetic': 'bg-mood-energetic bg-opacity-10 text-mood-energetic',
    'Focused': 'bg-mood-focused bg-opacity-10 text-mood-focused',
    'Uplifting': 'bg-mood-energetic bg-opacity-10 text-mood-energetic',
    'Euphoric': 'bg-mood-happy bg-opacity-10 text-mood-happy',
  };

  // Generate rating stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4l2.45 5.5L20 10.5l-4 3.5 1 5.5-5-3-5 3 1-5.5-4-3.5 5.55-1L12 4z" />
            <path fill="none" d="M12 4v12l-5 3 1-5.5-4-3.5 5.55-1L12 4z" />
          </svg>
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(strain);
    }
  };
  
  return (
    <div className={`strain-card bg-white rounded-xl shadow-sm border ${selected ? 'border-primary-600' : 'border-gray-200'} overflow-hidden transition-all duration-200 hover:-translate-y-1`}>
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={`${name} cannabis strain`} 
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-0 right-0 p-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeColor}`}>
            {type}
          </span>
        </div>
        {onSelect && (
          <div className="absolute top-0 left-0 p-2">
            <button 
              onClick={() => onSelect(strain)}
              className={`p-1 rounded-full ${selected ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
            >
              {selected ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-3">by {breeder}</p>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {renderStars()}
          </div>
          <span className="text-sm text-gray-500 ml-2">{rating.toFixed(1)} ({reviewCount} reviews)</span>
        </div>
        
        <div className="flex justify-between mb-4">
          <div>
            <span className="text-xs font-medium text-gray-500">THC</span>
            <p className="font-semibold">{thcContent}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">CBD</span>
            <p className="font-semibold">{cbdContent}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Terpenes</span>
            <p className="font-semibold">{terpenes.join(', ')}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Effects</h4>
          <div className="flex flex-wrap gap-1">
            {effects.slice(0, 3).map((effect, index) => (
              <span 
                key={index} 
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${effectColorMap[effect] || 'bg-gray-100 text-gray-800'}`}
              >
                {effect}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Flavors</h4>
          <div className="flex flex-wrap gap-1">
            {flavors.slice(0, 3).map((flavor, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {flavor}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          onClick={handleViewDetails}
          className="w-full py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 font-medium rounded-lg transition duration-150 ease-in-out"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default StrainCard;

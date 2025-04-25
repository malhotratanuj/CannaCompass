
import React from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import StrainCard from '@/components/StrainCard';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Heart } from 'lucide-react';

const Favorites: React.FC = () => {
  const { favorites, isLoading } = useFavorites();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Your Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No favorites yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Discover strains and save your favorites for quick access later.
          </p>
          <Button onClick={() => setLocation('/mood-selection')}>
            Find Strains
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(strain => (
            <StrainCard
              key={strain.id}
              strain={strain}
              onSelect={() => setLocation(`/strains/${strain.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;

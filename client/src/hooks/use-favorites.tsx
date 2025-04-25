
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Strain } from '@shared/schema';
import { useAuth } from './use-auth';
import { api } from '@/lib/api';

interface FavoritesContextType {
  favorites: Strain[];
  addFavorite: (strain: Strain) => Promise<void>;
  removeFavorite: (strainId: string) => Promise<void>;
  isFavorite: (strainId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on component mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // For now, store in localStorage, but this could be an API call
        const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  // Helper to save favorites to storage
  const saveFavorites = async (updatedFavorites: Strain[]) => {
    if (!user) return;
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));
  };

  const addFavorite = async (strain: Strain) => {
    if (!user) return;
    
    // Check if already in favorites
    if (favorites.some(f => f.id === strain.id)) return;
    
    const updatedFavorites = [...favorites, strain];
    setFavorites(updatedFavorites);
    await saveFavorites(updatedFavorites);
  };

  const removeFavorite = async (strainId: string) => {
    if (!user) return;
    
    const updatedFavorites = favorites.filter(f => f.id !== strainId);
    setFavorites(updatedFavorites);
    await saveFavorites(updatedFavorites);
  };

  const isFavorite = (strainId: string) => {
    return favorites.some(f => f.id === strainId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};


import React, { createContext, useState, useContext, useEffect } from 'react';
import { Strain } from '@shared/schema';

interface FavoritesContextType {
  favorites: Strain[];
  addFavorite: (strain: Strain) => void;
  removeFavorite: (strainId: string) => void;
  isFavorite: (strainId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Strain[]>([]);

  useEffect(() => {
    // Load favorites from localStorage on mount
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error('Error parsing favorites:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save to localStorage whenever favorites change
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (strain: Strain) => {
    setFavorites(prev => {
      if (prev.some(item => item.id === strain.id)) {
        return prev;
      }
      return [...prev, strain];
    });
  };

  const removeFavorite = (strainId: string) => {
    setFavorites(prev => prev.filter(strain => strain.id !== strainId));
  };

  const isFavorite = (strainId: string) => {
    return favorites.some(strain => strain.id === strainId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;

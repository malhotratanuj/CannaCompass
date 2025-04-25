
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="relative"
    >
      <Sun className={`h-5 w-5 transition-all ${theme === 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <Moon className={`absolute h-5 w-5 transition-all ${theme === 'light' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
    </Button>
  );
};

export default ThemeToggle;


import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Search, Heart, Compass, User } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/mood-selection', icon: Heart, label: 'Mood' },
    { path: '/recommendations', icon: Search, label: 'Strains' },
    { path: '/store-finder', icon: Compass, label: 'Stores' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors ${
              isActive(item.path) 
                ? 'text-green-600' 
                : 'text-gray-600 hover:text-green-500'
            }`}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;

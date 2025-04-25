
import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'wouter';
import { Strain } from '@shared/schema';

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ['strainSearch', searchTerm],
    queryFn: () => api.get<Strain[]>(`/api/strains/search?q=${encodeURIComponent(searchTerm)}`),
    enabled: searchTerm.length > 2,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsExpanded(false);
  };

  const handleStrainSelect = (strain: Strain) => {
    navigate(`/strain/${strain.id}`);
    setIsExpanded(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className={`flex items-center border ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'} px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 transition-all duration-200 ${isExpanded ? 'w-full md:w-72' : 'w-10 md:w-48'}`}>
        <Search size={18} className="text-gray-500 dark:text-gray-400 min-w-[18px]" />
        <input
          type="text"
          placeholder={isExpanded ? "Search strains..." : ""}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsExpanded(true)}
          className="ml-2 outline-none bg-transparent w-full placeholder-gray-500 dark:placeholder-gray-400 dark:text-white"
        />
        {searchTerm && (
          <button onClick={clearSearch} className="text-gray-500 dark:text-gray-400">
            <X size={16} />
          </button>
        )}
      </div>

      {isExpanded && searchTerm.length > 2 && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-t-0 border-gray-300 dark:border-gray-700 rounded-b-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          )}
          
          {!isLoading && results?.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No strains found
            </div>
          )}
          
          {!isLoading && results?.length > 0 && (
            <ul>
              {results.map((strain) => (
                <li 
                  key={strain.id}
                  onClick={() => handleStrainSelect(strain)}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="font-medium text-gray-800 dark:text-gray-200">{strain.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{strain.type}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

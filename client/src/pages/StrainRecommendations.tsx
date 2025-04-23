import { FC, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ProgressBar from '@/components/ProgressBar';
import StrainCard from '@/components/StrainCard';
import { Button } from '@/components/ui/button';
import TutorialTooltip from '@/components/TutorialTooltip';
import { useTutorial } from '@/contexts/TutorialContext';
import { useCelebration } from '@/contexts/CelebrationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { RecommendationRequest, Strain } from '@shared/schema';
import { MOODS } from '@/types';
import { getStrainRecommendations } from '@/lib/api';

interface StrainRecommendationsProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  preferences: RecommendationRequest;
  recommendedStrains: Strain[];
  setRecommendedStrains: (strains: Strain[]) => void;
  selectedStrains: Strain[];
  onStrainSelect: (strain: Strain) => void;
}

const StrainRecommendations: FC<StrainRecommendationsProps> = ({
  currentStep,
  onStepChange,
  preferences,
  recommendedStrains,
  setRecommendedStrains,
  selectedStrains,
  onStrainSelect,
}) => {
  const [_, setLocation] = useLocation();
  const [sortOption, setSortOption] = useState<string>('relevance');
  const [showDetailDialog, setShowDetailDialog] = useState<boolean>(false);
  const [selectedStrainDetail, setSelectedStrainDetail] = useState<Strain | null>(null);
  const { celebrateMilestone } = useCelebration();
  
  // Custom handler to wrap the original strain select function and add celebration
  const handleStrainSelect = (strain: Strain) => {
    // If this is the first strain selection (adding, not removing)
    if (!selectedStrains.some(s => s.id === strain.id) && selectedStrains.length === 0) {
      // Trigger celebration for first strain selection
      celebrateMilestone('strain_selected');
    }
    
    // Call the original function
    onStrainSelect(strain);
  };

  // Mark this step as active only once when the component mounts
  useEffect(() => {
    onStepChange(3);
  }, [onStepChange]);
  
  // Query to get strain recommendations
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/recommendations', preferences],
    queryFn: () => getStrainRecommendations(preferences),
    enabled: !!preferences.mood, // Only run if we have a mood selected
    retry: 2, // Retry twice if the API call fails
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when the window regains focus
  });

  // Only update recommendations when data changes, to prevent infinite re-renders
  useEffect(() => {
    if (data && Array.isArray(data)) {
      console.log("Setting strain recommendations:", data.length);
      setRecommendedStrains(data);
    }
  }, [data, setRecommendedStrains]);
  
  // If no data is available after loading completes, set an empty array
  useEffect(() => {
    if (!isLoading && !data && !isError) {
      console.log("No data available after loading completed, using empty array");
      setRecommendedStrains([]);
    }
  }, [isLoading, data, isError, setRecommendedStrains]);

  const handlePrevStep = () => {
    setLocation('/effects-preferences');
  };

  const handleNextStep = () => {
    setLocation('/store-finder');
  };

  const handleRestart = () => {
    setLocation('/mood-selection');
  };

  const handleViewDetails = (strain: Strain) => {
    // Navigate to the strain detail page instead of showing a dialog
    setLocation(`/strains/${strain.id}`);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    
    // Sort the strains based on the selected option
    let sortedStrains = [...recommendedStrains];
    
    switch (value) {
      case 'rating':
        sortedStrains.sort((a, b) => b.rating - a.rating);
        break;
      case 'thc-high':
        sortedStrains.sort((a, b) => {
          const getMaxTHC = (thcStr: string) => {
            const match = thcStr.match(/(\d+)-(\d+)/);
            if (!match) return 0;
            return parseInt(match[2]);
          };
          return getMaxTHC(b.thcContent) - getMaxTHC(a.thcContent);
        });
        break;
      case 'thc-low':
        sortedStrains.sort((a, b) => {
          const getMinTHC = (thcStr: string) => {
            const match = thcStr.match(/(\d+)-(\d+)/);
            if (!match) return 0;
            return parseInt(match[1]);
          };
          return getMinTHC(a.thcContent) - getMinTHC(b.thcContent);
        });
        break;
      case 'cbd':
        sortedStrains.sort((a, b) => {
          const getMaxCBD = (cbdStr: string) => {
            const match = cbdStr.match(/(\d+\.?\d*)-?(\d+\.?\d*)?/);
            if (!match) return 0;
            return match[2] ? parseFloat(match[2]) : parseFloat(match[1]);
          };
          return getMaxCBD(b.cbdContent) - getMaxCBD(a.cbdContent);
        });
        break;
      default: // 'relevance' - use default order from API
        // No sorting needed, this is the default order from the API
        break;
    }
    
    setRecommendedStrains(sortedStrains);
  };

  return (
    <div>
      <ProgressBar 
        currentStep={currentStep} 
        onRestart={handleRestart}
      />
      
      <div className="relative">
        <div className="absolute top-1 left-1">
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            size="sm"
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            title="Go back to home"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>
        
        <div className="flex justify-between items-center mb-6 pt-1">
          <h2 className="text-2xl font-bold text-gray-900">Your Recommended Strains</h2>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-600">Sort by:</span>
            <Select defaultValue="relevance" onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="thc-high">THC (High to Low)</SelectItem>
                <SelectItem value="thc-low">THC (Low to High)</SelectItem>
                <SelectItem value="cbd">CBD Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {preferences.mood && (
        <p className="text-gray-600 mb-6">
          Based on your selection of{' '}
          <span className="font-medium text-primary-700">
            {MOODS[preferences.mood as keyof typeof MOODS]?.name || preferences.mood}
          </span>
          , we've found these strains that might be perfect for you.
        </p>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-600">Finding your perfect strains...</p>
        </div>
      ) : isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We couldn't load strain recommendations. Please try again.
            {error instanceof Error && ` Error: ${error.message}`}
          </AlertDescription>
        </Alert>
      ) : recommendedStrains.length === 0 ? (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We couldn't find any strains matching your preferences. Try adjusting your criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <div id="strain-recommendations" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <TutorialTooltip targetId="strain-recommendations" position="top">
            {recommendedStrains.map((strain) => (
              <StrainCard 
                key={strain.id} 
                strain={strain} 
                selected={selectedStrains.some(s => s.id === strain.id)}
                onSelect={handleStrainSelect}
                onViewDetails={handleViewDetails}
              />
            ))}
          </TutorialTooltip>
        </div>
      )}
      
      <div className="flex justify-between mt-8">
        <Button
          onClick={handlePrevStep}
          variant="outline"
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg shadow-sm transition duration-150 ease-in-out"
        >
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition duration-150 ease-in-out animate-pulse-green"
        >
          Find Nearby Stores
        </Button>
      </div>
      
      {/* Strain Detail Dialog */}
      {selectedStrainDetail && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedStrainDetail.name}</DialogTitle>
              <DialogDescription>
                by {selectedStrainDetail.breeder} • {selectedStrainDetail.type}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img 
                  src={selectedStrainDetail.imageUrl} 
                  alt={selectedStrainDetail.name}
                  className="w-full h-auto object-cover rounded-lg mb-4"
                />
                
                <div className="flex items-center mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(selectedStrainDetail.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{selectedStrainDetail.rating.toFixed(1)} ({selectedStrainDetail.reviewCount} reviews)</span>
                </div>
              </div>
              
              <div>
                <p className="text-gray-700 mb-4">{selectedStrainDetail.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">THC Content</h4>
                    <p>{selectedStrainDetail.thcContent}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">CBD Content</h4>
                    <p>{selectedStrainDetail.cbdContent}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">Effects</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedStrainDetail.effects.map((effect, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">Flavors</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedStrainDetail.flavors.map((flavor, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {flavor}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Terpenes</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedStrainDetail.terpenes.map((terpene, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {terpene}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => handleStrainSelect(selectedStrainDetail)}
                className="w-full sm:w-auto"
              >
                {selectedStrains.some(s => s.id === selectedStrainDetail.id) 
                  ? 'Remove from Selection' 
                  : 'Add to Selection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StrainRecommendations;

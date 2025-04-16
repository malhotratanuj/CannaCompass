import { FC, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ProgressBar from '@/components/ProgressBar';
import StoreCard from '@/components/StoreCard';
import { Button } from '@/components/ui/button';
import TutorialTooltip from '@/components/TutorialTooltip';
import { useTutorial } from '@/contexts/TutorialContext';
import { useCelebration } from '@/contexts/CelebrationContext';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Strain, Dispensary, UserLocation } from '@shared/schema';
import { StoreFinderFilters, DeliveryOption } from '@/types';
import { findNearbyDispensaries, getCurrentLocation } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StoreFinderProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  selectedStrains: Strain[];
}

const StoreFinder: FC<StoreFinderProps> = ({
  currentStep,
  onStepChange,
  selectedStrains,
}) => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { setStepForLocation } = useTutorial();
  const { celebrateMilestone } = useCelebration();
  
  const [filters, setFilters] = useState<StoreFinderFilters>({
    useCurrentLocation: false,
    deliveryOption: 'both',
    maxDistance: 10,
  });
  
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [sortOption, setSortOption] = useState<string>('distance');
  
  // Query to get nearby dispensaries
  const { 
    data: dispensaries, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/dispensaries/nearby', userLocation, filters.maxDistance, selectedStrains.map(s => s.id)],
    queryFn: async () => {
      if (!userLocation) {
        console.log('No userLocation provided, returning empty array');
        return Promise.resolve([]);
      }
      
      // Get strain IDs to include in search
      const strainIds = selectedStrains.map(strain => strain.id);
      console.log('Making API request with:', { userLocation, maxDistance: filters.maxDistance, strainIds });
      
      try {
        // Use the enhanced store finder with dynamic data
        const result = await findNearbyDispensaries(
          userLocation, 
          filters.maxDistance,
          strainIds
        );
        console.log('API returned dispensaries:', result);
        return result;
      } catch (err) {
        console.error('Error fetching dispensaries:', err);
        throw err;
      }
    },
    enabled: !!userLocation, // Only run if we have location
  });
  
  useEffect(() => {
    onStepChange(4);
    setStepForLocation('/store-finder');
  }, [onStepChange, setStepForLocation]);
  
  const handlePrevStep = () => {
    setLocation('/recommendations');
  };
  
  const handleSavePreferences = () => {
    toast({
      title: "Preferences Saved",
      description: "Your strain preferences have been saved successfully.",
    });
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };
  
  const handleDeliveryOptionChange = (value: string) => {
    setFilters({
      ...filters,
      deliveryOption: value as DeliveryOption,
    });
  };
  
  const handleDistanceChange = (value: string) => {
    setFilters({
      ...filters,
      maxDistance: parseInt(value),
    });
  };
  
  const handleUseCurrentLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      useCurrentLocation: e.target.checked,
    });
    
    if (e.target.checked) {
      fetchCurrentLocation();
    }
  };
  
  const fetchCurrentLocation = async () => {
    try {
      setIsSearching(true);
      const location = await getCurrentLocation();
      setUserLocation(location);
      setIsSearching(false);
    } catch (error) {
      setIsSearching(false);
      toast({
        title: "Location Error",
        description: "Could not access your location. Please allow location access or enter an address manually.",
        variant: "destructive",
      });
    }
  };
  
  const handleFindStores = () => {
    if (filters.useCurrentLocation) {
      fetchCurrentLocation();
    } else if (address) {
      toast({
        title: "Searching for Stores",
        description: "Using your entered address to find nearby dispensaries with your selected strains.",
      });
      
      // Use the entered address for store lookup
      // We'll use the address for geocoding on the server side
      setUserLocation({
        latitude: 0, // The coordinates don't matter - the server will use the address
        longitude: 0,
        address: address, // Providing the address is the key for store finding
      });
    } else {
      toast({
        title: "Location Required",
        description: "Please enter an address or use your current location.",
        variant: "destructive",
      });
    }
  };
  
  const handleSortChange = (value: string) => {
    setSortOption(value);
    
    if (!dispensaries) return;
    
    // We'll apply client-side sorting since we already have the data
    // In a real app, you might want to fetch new data with the sorting parameter
  };
  
  // Log dispensaries data to console for debugging
  console.log('Dispensaries data received by component:', dispensaries);
  
  // Filter dispensaries based on delivery options
  const filteredDispensaries = dispensaries ? dispensaries.filter(dispensary => {
    if (!dispensary || !dispensary.amenities) {
      console.error('Invalid dispensary object encountered:', dispensary);
      return false;
    }
    
    if (filters.deliveryOption === 'both') return true;
    
    try {
      const hasPickup = dispensary.amenities.some(a => a.includes('Pickup'));
      const hasDelivery = dispensary.amenities.some(a => a.includes('Delivery'));
      
      if (filters.deliveryOption === 'pickup' && hasPickup) return true;
      if (filters.deliveryOption === 'delivery' && hasDelivery) return true;
    } catch (err) {
      console.error('Error filtering dispensary:', err, dispensary);
      return false;
    }
    
    return false;
  }) : [];
  
  console.log('Filtered dispensaries:', filteredDispensaries);
  
  // Sort dispensaries based on selected option
  const sortedDispensaries = [...(filteredDispensaries || [])].sort((a, b) => {
    try {
      switch (sortOption) {
        case 'rating':
          return b.rating - a.rating;
        case 'price-low':
          // For simplicity, sort by the first product's price
          const aPrice = a.inventory[0]?.price || 0;
          const bPrice = b.inventory[0]?.price || 0;
          return aPrice - bPrice;
        case 'price-high':
          const aPriceHigh = a.inventory[0]?.price || 0;
          const bPriceHigh = b.inventory[0]?.price || 0;
          return bPriceHigh - aPriceHigh;
        default: // 'distance'
          return a.distance - b.distance;
      }
    } catch (err) {
      console.error('Error sorting dispensaries:', err);
      return 0;
    }
  });
  
  console.log('Sorted dispensaries:', sortedDispensaries);
  
  // Determine if we're showing results
  const isShowingResults = !isLoading && !isError && userLocation && sortedDispensaries.length > 0;
  
  // Effect to trigger celebration when dispensaries are found
  useEffect(() => {
    if (isShowingResults && sortedDispensaries.length > 0) {
      // We found dispensaries! Celebrate!
      celebrateMilestone('dispensary_found');
    }
  }, [isShowingResults, sortedDispensaries.length, celebrateMilestone]);
  
  return (
    <div>
      <ProgressBar 
        currentStep={currentStep} 
        onRestart={() => setLocation('/mood-selection')}
      />
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Your Strain Nearby</h2>
      <p className="text-gray-600 mb-6">We'll help you locate dispensaries that carry these strains in your area.</p>
      
      <div id="location-form" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <TutorialTooltip targetId="location-form" position="top">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4">Your Location</h3>
              
              <div className="mb-4">
                <Label htmlFor="location-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your address or zip code
                </Label>
                <div className="flex">
                  <Input
                    id="location-input"
                    value={address}
                    onChange={handleAddressChange}
                    className="flex-1 rounded-r-none"
                    placeholder="e.g., 123 Main St, Denver, CO 80202"
                    disabled={filters.useCurrentLocation || isSearching}
                  />
                  <Button
                    className="rounded-l-none bg-primary-600 hover:bg-primary-700"
                    onClick={handleFindStores}
                    disabled={(!address && !filters.useCurrentLocation) || isSearching}
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input 
                    id="use-current-location" 
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={filters.useCurrentLocation}
                    onChange={handleUseCurrentLocationChange}
                    disabled={isSearching}
                  />
                  <Label 
                    htmlFor="use-current-location" 
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Use my current location
                  </Label>
                </div>
                <p className="mt-1 text-xs text-gray-500">We'll only use your location to find nearby stores.</p>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4">Delivery Options</h3>
              
              <RadioGroup 
                defaultValue="both" 
                value={filters.deliveryOption}
                onValueChange={handleDeliveryOptionChange}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="option-pickup" />
                  <Label htmlFor="option-pickup">In-Store Pickup</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="option-delivery" />
                  <Label htmlFor="option-delivery">Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="option-both" />
                  <Label htmlFor="option-both">Show Both</Label>
                </div>
              </RadioGroup>
              
              <div className="mt-4">
                <Label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Distance
                </Label>
                <Select defaultValue="10" onValueChange={handleDistanceChange}>
                  <SelectTrigger id="distance" className="w-full">
                    <SelectValue placeholder="10 miles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="15">15 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={handleFindStores}
              id="find-stores-btn"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition duration-150 ease-in-out animate-pulse-green"
              disabled={(!address && !filters.useCurrentLocation) || isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Stores...
                </>
              ) : (
                'Find Stores'
              )}
            </Button>
          </div>
        </TutorialTooltip>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mr-2" />
          <p>Searching for nearby dispensaries...</p>
        </div>
      )}
      
      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We couldn't find dispensaries in your area. Please try again.
            {error instanceof Error && ` Error: ${error.message}`}
          </AlertDescription>
        </Alert>
      )}
      
      {userLocation && !isLoading && !isError && sortedDispensaries.length === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No dispensaries found within {filters.maxDistance} miles of your location. Try increasing the distance or changing your delivery preferences.
          </AlertDescription>
        </Alert>
      )}
      
      {isShowingResults && (
        <div id="store-results" className="mb-8">
          <TutorialTooltip targetId="store-results" position="bottom">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Nearby Dispensaries ({sortedDispensaries.length})
              </h3>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">Sort by:</span>
                <Select defaultValue="distance" onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              {sortedDispensaries.slice(0, 3).map((dispensary) => (
                <StoreCard 
                  key={dispensary.id} 
                  dispensary={dispensary}
                  selectedStrains={selectedStrains}
                />
              ))}
              
              {sortedDispensaries.length > 3 && (
                <div className="text-center mt-6">
                  <Button 
                    variant="outline" 
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition duration-150 ease-in-out"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Viewing more stores will be available in a future update.",
                      });
                    }}
                  >
                    View {sortedDispensaries.length - 3} More Stores
                  </Button>
                </div>
              )}
            </div>
          </TutorialTooltip>
        </div>
      )}
      
      <div className="flex justify-between mt-8">
        <Button
          onClick={handlePrevStep}
          variant="outline"
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg shadow-sm transition duration-150 ease-in-out"
        >
          Back to Strains
        </Button>
        <Button
          onClick={handleSavePreferences}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition duration-150 ease-in-out"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default StoreFinder;
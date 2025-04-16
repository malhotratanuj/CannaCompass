import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Strain } from '@shared/schema';
import StrainReviews from '@/components/StrainReviews';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, CheckCircle, Info, XCircle, Leaf, ArrowLeft } from 'lucide-react';
import { useCelebration } from '@/contexts/CelebrationContext';

const StrainDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { triggerCelebration } = useCelebration();
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const { data, isLoading, error } = useQuery<{ strain: Strain }>({
    queryKey: [`/api/strains/${id}`],
    onSuccess: (data) => {
      // Check if this strain is saved
      checkIfSaved(data.strain.id);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (strainId: string) => {
      const res = await apiRequest('POST', '/api/strains/save', { strainId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains/saved'] });
      setIsSaved(true);
      toast({
        title: 'Strain saved',
        description: 'This strain has been added to your saved strains.',
      });
      triggerCelebration('strainSaved');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save strain',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const removeSavedMutation = useMutation({
    mutationFn: async (strainId: string) => {
      const res = await apiRequest('DELETE', `/api/strains/save/${strainId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains/saved'] });
      setIsSaved(false);
      toast({
        title: 'Strain removed',
        description: 'This strain has been removed from your saved strains.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove strain',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const checkIfSaved = async (strainId: string) => {
    try {
      const res = await apiRequest('GET', '/api/strains/saved');
      const data = await res.json();
      const saved = data.savedStrains.some((strain: any) => strain.strainId === strainId);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const toggleSave = (strainId: string) => {
    if (isSaved) {
      removeSavedMutation.mutate(strainId);
    } else {
      saveMutation.mutate(strainId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !data?.strain) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                Error loading strain details: {(error as Error)?.message || 'Strain not found'}
              </p>
              <button
                onClick={() => navigate('/strains')}
                className="mt-2 text-sm text-orange-700 underline hover:text-orange-900"
              >
                Go back to strains
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const strain = data.strain;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="aspect-square relative rounded-lg overflow-hidden shadow-md">
                <img
                  src={strain.imageUrl}
                  alt={strain.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-0 right-0 m-2">
                  <button
                    onClick={() => toggleSave(strain.id)}
                    className={`p-2 rounded-full transition-colors ${
                      isSaved
                        ? 'bg-primary/90 text-primary-foreground'
                        : 'bg-background/80 text-foreground hover:bg-primary/20'
                    }`}
                    aria-label={isSaved ? 'Remove from saved strains' : 'Save strain'}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full md:w-2/3 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold">{strain.name}</h1>
                  <p className="text-muted-foreground">By {strain.breeder}</p>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    strain.type === 'Indica'
                      ? 'bg-indigo-100 text-indigo-800'
                      : strain.type === 'Sativa'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {strain.type}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${
                        i < Math.floor(strain.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-muted-foreground">
                  ({strain.rating.toFixed(1)}) • {strain.reviewCount} reviews
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="font-medium mb-1">THC Content</div>
                  <div className="text-base">{strain.thcContent}</div>
                </div>
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="font-medium mb-1">CBD Content</div>
                  <div className="text-base">{strain.cbdContent}</div>
                </div>
              </div>

              <p className="text-muted-foreground">{strain.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="font-semibold text-lg mb-3 flex items-center">
                <Leaf className="h-5 w-5 mr-2 text-green-600" />
                Effects
              </h2>
              <div className="flex flex-wrap gap-2">
                {strain.effects.map((effect) => (
                  <span
                    key={effect}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {effect}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="font-semibold text-lg mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Flavors
              </h2>
              <div className="flex flex-wrap gap-2">
                {strain.flavors.map((flavor) => (
                  <span
                    key={flavor}
                    className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full"
                  >
                    {flavor}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
            <h2 className="font-semibold text-lg mb-3 flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-600" />
              Terpenes
            </h2>
            <div className="flex flex-wrap gap-2">
              {strain.terpenes.map((terpene) => (
                <span
                  key={terpene}
                  className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                >
                  {terpene}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 mb-4">
            <StrainReviews strain={strain} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card p-5 rounded-lg shadow-sm border border-border sticky top-6">
            <h2 className="font-semibold text-lg mb-4">Find This Strain</h2>
            
            <button
              onClick={() => navigate(`/store-finder?strain=${strain.id}`)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
            >
              Find Nearby Dispensaries
            </button>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm">See local prices and availability</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm">Find dispensaries with delivery options</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm">Compare strain prices from multiple stores</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrainDetail;
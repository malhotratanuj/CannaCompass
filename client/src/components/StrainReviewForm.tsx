import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Strain } from '@shared/schema';

// Form schema
const reviewSchema = z.object({
  strainId: z.string().min(1, "Strain ID is required"),
  rating: z.number().min(1, "Rating is required").max(5, "Rating must be between 1 and 5"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Review must be at least 10 characters").max(2000, "Review must be less than 2000 characters"),
  effects: z.array(z.string()).optional(),
  flavors: z.array(z.string()).optional(),
  wouldRecommend: z.boolean().default(true),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface StrainReviewFormProps {
  strain: Strain;
  onSuccess?: () => void;
}

const StrainReviewForm: React.FC<StrainReviewFormProps> = ({ strain, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      strainId: strain.id,
      rating: 5,
      title: '',
      content: '',
      effects: [],
      flavors: [],
      wouldRecommend: true,
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      const res = await apiRequest('POST', '/api/reviews', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Review submitted',
        description: 'Thank you for sharing your experience with this strain!',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/strains/${strain.id}/reviews`] });
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit review',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: ReviewFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to submit a review',
        variant: 'destructive',
      });
      return;
    }
    
    createReviewMutation.mutate(data);
  };

  const ratingValue = watch('rating');
  
  // Common effect options for cannabis strains
  const effectOptions = [
    'Relaxing', 
    'Energetic', 
    'Creative', 
    'Focused', 
    'Sleepy', 
    'Happy', 
    'Euphoric', 
    'Uplifted', 
    'Hungry', 
    'Talkative',
    'Pain Relief',
    'Stress Relief',
    'Anxiety Relief'
  ];
  
  // Common flavor options for cannabis strains
  const flavorOptions = [
    'Earthy', 
    'Woody', 
    'Citrus', 
    'Sweet', 
    'Spicy', 
    'Berry', 
    'Pine', 
    'Floral', 
    'Diesel', 
    'Cheese',
    'Grape',
    'Tropical',
    'Lemon',
    'Mint',
    'Pungent'
  ];

  const handleEffectToggle = (effect: string) => {
    const currentEffects = watch('effects') || [];
    if (currentEffects.includes(effect)) {
      setValue('effects', currentEffects.filter(e => e !== effect));
    } else {
      setValue('effects', [...currentEffects, effect]);
    }
  };

  const handleFlavorToggle = (flavor: string) => {
    const currentFlavors = watch('flavors') || [];
    if (currentFlavors.includes(flavor)) {
      setValue('flavors', currentFlavors.filter(f => f !== flavor));
    } else {
      setValue('flavors', [...currentFlavors, flavor]);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Write a Review for {strain.name}</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('strainId')} />
        
        {/* Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setValue('rating', star)}
                className={`text-2xl ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          {errors.rating && (
            <p className="text-red-500 text-sm">{errors.rating.message}</p>
          )}
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <input
            id="title"
            type="text"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Give your review a title"
            {...register('title')}
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium">Review</label>
          <textarea
            id="content"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
            placeholder="Share your experience with this strain"
            {...register('content')}
          />
          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content.message}</p>
          )}
        </div>
        
        {/* Effects */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Effects You Experienced</label>
          <div className="flex flex-wrap gap-2">
            {effectOptions.map((effect) => (
              <button
                key={effect}
                type="button"
                onClick={() => handleEffectToggle(effect)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  watch('effects')?.includes(effect)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border-input hover:bg-accent'
                }`}
              >
                {effect}
              </button>
            ))}
          </div>
        </div>
        
        {/* Flavors */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Flavors You Detected</label>
          <div className="flex flex-wrap gap-2">
            {flavorOptions.map((flavor) => (
              <button
                key={flavor}
                type="button"
                onClick={() => handleFlavorToggle(flavor)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  watch('flavors')?.includes(flavor)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border-input hover:bg-accent'
                }`}
              >
                {flavor}
              </button>
            ))}
          </div>
        </div>
        
        {/* Would Recommend */}
        <div className="flex items-center gap-2">
          <input
            id="wouldRecommend"
            type="checkbox"
            className="rounded text-primary focus:ring-primary"
            {...register('wouldRecommend')}
          />
          <label htmlFor="wouldRecommend" className="text-sm font-medium">
            I would recommend this strain to others
          </label>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default StrainReviewForm;
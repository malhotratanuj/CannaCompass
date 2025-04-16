import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReviewWithUser, Strain } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import StrainReviewForm from './StrainReviewForm';
import { User, MessageSquare, ThumbsUp, Calendar, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StrainReviewsProps {
  strain: Strain;
}

const StrainReviews: React.FC<StrainReviewsProps> = ({ strain }) => {
  const { toast } = useToast();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const {
    data: reviews,
    isLoading,
    isError,
    error,
  } = useQuery<{ reviews: ReviewWithUser[] }>({
    queryKey: [`/api/strains/${strain.id}/reviews`],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-orange-700">
              Error loading reviews: {(error as Error)?.message || 'Please try again later'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    toast({
      title: 'Review submitted',
      description: 'Thank you for sharing your experience!',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reviews</h2>
        
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {showReviewForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {showReviewForm && (
        <StrainReviewForm strain={strain} onSuccess={handleReviewSuccess} />
      )}

      {!reviews?.reviews?.length ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-lg font-medium mb-1">No reviews yet</h3>
          <p className="text-muted-foreground">Be the first to share your experience with this strain.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{review.username}</span>
                </div>
                
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <h4 className="text-lg font-semibold mb-2">{review.title}</h4>
              <p className="text-muted-foreground mb-4">{review.content}</p>
              
              {review.effects && review.effects.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium mb-1">Effects</h5>
                  <div className="flex flex-wrap gap-1">
                    {review.effects.map((effect) => (
                      <span
                        key={effect}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {review.flavors && review.flavors.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium mb-1">Flavors</h5>
                  <div className="flex flex-wrap gap-1">
                    {review.flavors.map((flavor) => (
                      <span
                        key={flavor}
                        className="px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full"
                      >
                        {flavor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {review.createdAt
                      ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                      : 'Recently'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  {review.wouldRecommend && (
                    <div className="flex items-center gap-1 text-green-600">
                      <ThumbsUp className="h-4 w-4" />
                      <span>Recommends</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrainReviews;
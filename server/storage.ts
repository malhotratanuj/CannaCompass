import { 
  users, User, InsertUser, 
  userPreferences, UserPreferences, InsertUserPreferences,
  savedStrains, SavedStrain, InsertSavedStrain,
  strainReviews, StrainReview, InsertStrainReview, ReviewWithUser,
  communityDiscussions, CommunityDiscussion, InsertCommunityDiscussion, DiscussionWithUser,
  discussionComments, DiscussionComment, InsertDiscussionComment, CommentWithUser,
  Strain, Dispensary, UserLocation, RecommendationRequest
} from "@shared/schema";
import { strains } from "./strainData";
import { enhancedStrains } from "./enhancedStrainData";
import { dispensaries } from "./dispensaryData";
import { vectorDb } from "./vectorDb";
import { aiRecommender } from "./aiRecommender";

import session from "express-session";

// Interface for storage operations
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  saveUserPreferences(userId: number, preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Saved strains
  getSavedStrains(userId: number): Promise<SavedStrain[]>;
  saveStrain(userId: number, strainId: string): Promise<SavedStrain>;
  removeSavedStrain(userId: number, strainId: string): Promise<void>;
  
  // Recommendations
  getStrainRecommendations(preferences: RecommendationRequest): Promise<Strain[]>;
  getStrainById(strainId: string): Promise<Strain | undefined>;
  getAllStrains(): Promise<Strain[]>;
  
  // Dispensary finder
  findNearbyDispensaries(location: UserLocation, radius: number): Promise<Dispensary[]>;
  getDispensaryById(dispensaryId: string): Promise<Dispensary | undefined>;
  
  // Strain reviews
  getStrainReviews(strainId: string): Promise<ReviewWithUser[]>;
  getUserReviews(userId: number): Promise<StrainReview[]>;
  getReviewById(reviewId: number): Promise<StrainReview | undefined>;
  createReview(userId: number, review: InsertStrainReview): Promise<StrainReview>;
  updateReview(reviewId: number, userId: number, review: Partial<InsertStrainReview>): Promise<StrainReview | undefined>;
  deleteReview(reviewId: number, userId: number): Promise<boolean>;
  
  // Community discussions
  getDiscussions(page?: number, limit?: number, tag?: string): Promise<DiscussionWithUser[]>;
  getDiscussionById(discussionId: number): Promise<CommunityDiscussion | undefined>;
  getUserDiscussions(userId: number): Promise<CommunityDiscussion[]>;
  createDiscussion(userId: number, discussion: InsertCommunityDiscussion): Promise<CommunityDiscussion>;
  updateDiscussion(discussionId: number, userId: number, discussion: Partial<InsertCommunityDiscussion>): Promise<CommunityDiscussion | undefined>;
  deleteDiscussion(discussionId: number, userId: number): Promise<boolean>;
  likeDiscussion(discussionId: number, userId: number): Promise<boolean>;
  
  // Discussion comments
  getCommentsByDiscussion(discussionId: number): Promise<CommentWithUser[]>;
  createComment(userId: number, comment: InsertDiscussionComment): Promise<DiscussionComment>;
  updateComment(commentId: number, userId: number, content: string): Promise<DiscussionComment | undefined>;
  deleteComment(commentId: number, userId: number): Promise<boolean>;
  likeComment(commentId: number, userId: number): Promise<boolean>;
  
  // Password reset functionality
  setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<boolean>;
  verifyPasswordResetToken(token: string): Promise<boolean>;
  resetPasswordWithToken(token: string, newPasswordHash: string): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferencesMap: Map<number, UserPreferences>;
  private savedStrainsMap: Map<number, SavedStrain[]>;
  private strainReviewsMap: Map<string, StrainReview[]>; // Key is strainId
  private reviewsMap: Map<number, StrainReview>; // Key is reviewId
  private discussionsMap: Map<number, CommunityDiscussion>; // Key is discussionId
  private discussionCommentsMap: Map<number, DiscussionComment[]>; // Key is discussionId
  currentId: number;
  sessionStore: session.Store;

  private resetTokensMap: Map<string, { userId: number, expiry: Date }>;
  
  constructor() {
    this.users = new Map();
    this.userPreferencesMap = new Map();
    this.savedStrainsMap = new Map();
    this.strainReviewsMap = new Map();
    this.reviewsMap = new Map();
    this.discussionsMap = new Map();
    this.discussionCommentsMap = new Map();
    this.resetTokensMap = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // User preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return this.userPreferencesMap.get(userId);
  }

  async saveUserPreferences(userId: number, preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.currentId++;
    // Ensure all fields have appropriate values to match UserPreferences type
    const userPreference: UserPreferences = {
      id,
      userId,
      mood: preferences.mood || null,
      experienceLevel: preferences.experienceLevel || null,
      effects: preferences.effects || null,
      flavors: preferences.flavors || null,
      consumptionMethod: preferences.consumptionMethod || null
    };
    this.userPreferencesMap.set(userId, userPreference);
    return userPreference;
  }

  // Saved strains
  async getSavedStrains(userId: number): Promise<SavedStrain[]> {
    return this.savedStrainsMap.get(userId) || [];
  }

  async saveStrain(userId: number, strainId: string): Promise<SavedStrain> {
    const id = this.currentId++;
    const savedStrain: SavedStrain = { 
      id, 
      userId, 
      strainId, 
      savedAt: new Date().toISOString() 
    };
    
    const userSavedStrains = this.savedStrainsMap.get(userId) || [];
    userSavedStrains.push(savedStrain);
    this.savedStrainsMap.set(userId, userSavedStrains);
    
    return savedStrain;
  }

  async removeSavedStrain(userId: number, strainId: string): Promise<void> {
    const userSavedStrains = this.savedStrainsMap.get(userId) || [];
    const updatedStrains = userSavedStrains.filter(strain => strain.strainId !== strainId);
    this.savedStrainsMap.set(userId, updatedStrains);
  }

  // Strain recommendations using AI
  async getStrainRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    try {
      console.log("Using AI-enhanced recommendation system...");
      // Initialize vector database if needed
      await vectorDb.initialize();
      
      // Use the AI recommender to get personalized strain recommendations
      const recommendations = await aiRecommender.getRecommendations(preferences);
      
      console.log(`AI recommender returned ${recommendations.length} strains`);
      
      if (recommendations.length > 0) {
        return recommendations;
      }
      
      // If AI recommender fails or returns no results, fall back to traditional method
      console.log("Falling back to traditional recommendation method");
      return this.getTraditionalRecommendations(preferences);
    } catch (error) {
      console.error("Error in AI recommendation:", error);
      // Fall back to traditional method if there's an error
      return this.getTraditionalRecommendations(preferences);
    }
  }
  
  // Traditional recommendation algorithm as fallback
  private async getTraditionalRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    console.log("Using traditional recommendation algorithm");
    let filteredStrains = enhancedStrains; // Use the expanded dataset
    
    // Define our effect mapping to handle variations of the same effect
    const effectMapping: Record<string, string[]> = {
      'Relaxation': ['Relaxing', 'Relaxation', 'Calming', 'Peaceful', 'Stress Relief'],
      'Energy': ['Energetic', 'Energy', 'Active', 'Uplifting'],
      'Focus': ['Focused', 'Focus', 'Clear-headed', 'Productive', 'Clear'],
      'Creativity': ['Creative', 'Creativity', 'Inspired'],
      'Euphoria': ['Euphoric', 'Euphoria', 'Happy', 'Giggly'],
      'Pain Relief': ['Pain Relief', 'Analgesic']
    };
    
    // Create a generic function to match effects with their variations
    const matchEffectWithVariations = (targetEffect: string, actualEffect: string): boolean => {
      // Try exact match first
      if (targetEffect.toLowerCase() === actualEffect.toLowerCase()) {
        return true;
      }
      
      // Check if this is a known effect with variations
      for (const [effect, variations] of Object.entries(effectMapping)) {
        if (
          (effect.toLowerCase() === targetEffect.toLowerCase() &&
           variations.some(v => v.toLowerCase() === actualEffect.toLowerCase())) ||
          (variations.some(v => v.toLowerCase() === targetEffect.toLowerCase()) &&
           (effect.toLowerCase() === actualEffect.toLowerCase() || 
            variations.some(v => v.toLowerCase() === actualEffect.toLowerCase())))
        ) {
          return true;
        }
      }
      
      // Try substring match as a fallback
      return actualEffect.toLowerCase().includes(targetEffect.toLowerCase()) ||
             targetEffect.toLowerCase().includes(actualEffect.toLowerCase());
    };
    
    // Filter by mood with expanded effect mappings
    if (preferences.mood && preferences.mood.toLowerCase() !== '') {
      const moodEffectMap: Record<string, string[]> = {
        'relaxed': ['Relaxing', 'Calming', 'Peaceful', 'Relaxation', 'Stress Relief', 'Pain Relief'],
        'energetic': ['Energetic', 'Uplifting', 'Active', 'Energy', 'Social Uplift'],
        'creative': ['Creative', 'Inspired', 'Creativity', 'Euphoric'],
        'focused': ['Focused', 'Clear-headed', 'Productive', 'Focus', 'Clear'],
        'sleepy': ['Sleepy', 'Sedative', 'Restful', 'Sleep Aid', 'Relaxing'],
        'happy': ['Happy', 'Euphoric', 'Giggly', 'Euphoria', 'Uplifting']
      };
      
      const desiredEffects = moodEffectMap[preferences.mood.toLowerCase()] || [];
      
      if (desiredEffects.length > 0) {
        filteredStrains = filteredStrains.filter(strain => 
          strain.effects.some(effect => 
            desiredEffects.some(desiredEffect => 
              matchEffectWithVariations(desiredEffect, effect)
            )
          )
        );
      }
    }
    
    // Filter by additional effects if specified
    if (preferences.effects && preferences.effects.length > 0) {
      const matchedStrains = filteredStrains.filter(strain => 
        preferences.effects!.some(requestedEffect => 
          strain.effects.some(strainEffect => 
            matchEffectWithVariations(requestedEffect, strainEffect)
          )
        )
      );
      
      if (matchedStrains.length > 0) {
        filteredStrains = matchedStrains;
      }
    }
    
    // Filter by flavors if specified
    if (preferences.flavors && preferences.flavors.length > 0) {
      const flavorMatches = filteredStrains.filter(strain => 
        preferences.flavors!.some(flavor => 
          strain.flavors.some(strainFlavor => 
            strainFlavor.toLowerCase().includes(flavor.toLowerCase())
          )
        )
      );
      
      if (flavorMatches.length > 0) {
        filteredStrains = flavorMatches;
      }
    }
    
    // Adjust based on experience level
    if (preferences.experienceLevel === 'beginner') {
      // For beginners, filter strains with moderate THC content
      filteredStrains = filteredStrains.filter(strain => {
        const thcMatch = strain.thcContent.match(/(\d+)-(\d+)/);
        if (thcMatch) {
          const maxThc = parseInt(thcMatch[2]);
          return maxThc < 18; // Lower THC for beginners
        }
        return true;
      });
    }
    
    // If no strains were found after all filtering, return some default ones
    if (filteredStrains.length === 0) {
      console.log("No matching strains found, using default set");
      return enhancedStrains
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
    }
    
    // Return top results, sorted by relevance (for now, just by rating)
    return filteredStrains
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6); // Return top 6 recommendations
  }

  async getStrainById(strainId: string): Promise<Strain | undefined> {
    // Look in enhanced strains first
    const enhancedStrain = enhancedStrains.find(strain => strain.id === strainId);
    if (enhancedStrain) {
      return enhancedStrain;
    }
    
    // Fall back to original strains if not found
    return strains.find(strain => strain.id === strainId);
  }

  async getAllStrains(): Promise<Strain[]> {
    // Use the expanded dataset for better recommendations
    return enhancedStrains;
  }

  // Dispensary finder
  async findNearbyDispensaries(location: UserLocation, radius: number): Promise<Dispensary[]> {
    // Simple implementation that calculates distances between user location and dispensaries
    // In a real app, this would use a more sophisticated geospatial search
    
    const nearbyDispensaries = dispensaries.map(dispensary => {
      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(
        location.latitude, 
        location.longitude,
        dispensary.coordinates.lat,
        dispensary.coordinates.lng
      );
      
      return {
        ...dispensary,
        distance: parseFloat(distance.toFixed(1))
      };
    });
    
    // Filter by radius and sort by distance
    return nearbyDispensaries
      .filter(dispensary => dispensary.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  async getDispensaryById(dispensaryId: string): Promise<Dispensary | undefined> {
    return dispensaries.find(dispensary => dispensary.id === dispensaryId);
  }

  // Helper method to calculate distance between two coordinates in miles
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  // Strain reviews
  async getStrainReviews(strainId: string): Promise<ReviewWithUser[]> {
    const reviews = this.strainReviewsMap.get(strainId) || [];
    
    // Join with usernames
    const reviewsWithUsers: ReviewWithUser[] = await Promise.all(
      reviews.map(async (review) => {
        const user = await this.getUser(review.userId);
        return {
          ...review,
          username: user?.username || 'Unknown User'
        };
      })
    );
    
    return reviewsWithUsers;
  }
  
  async getUserReviews(userId: number): Promise<StrainReview[]> {
    // Collect all reviews from all strains
    const allReviews: StrainReview[] = [];
    for (const reviews of Array.from(this.strainReviewsMap.values())) {
      allReviews.push(...reviews.filter((review: StrainReview) => review.userId === userId));
    }
    return allReviews;
  }
  
  async getReviewById(reviewId: number): Promise<StrainReview | undefined> {
    return this.reviewsMap.get(reviewId);
  }
  
  async createReview(userId: number, review: InsertStrainReview): Promise<StrainReview> {
    const id = this.currentId++;
    const now = new Date();
    
    const newReview: StrainReview = {
      id,
      userId,
      strainId: review.strainId,
      rating: review.rating,
      title: review.title,
      content: review.content,
      effects: review.effects || [],
      flavors: review.flavors || [],
      wouldRecommend: review.wouldRecommend ?? true,
      createdAt: now,
      updatedAt: now
    };
    
    // Add to strain reviews map
    const strainReviews = this.strainReviewsMap.get(review.strainId) || [];
    strainReviews.push(newReview);
    this.strainReviewsMap.set(review.strainId, strainReviews);
    
    // Add to reviews map
    this.reviewsMap.set(id, newReview);
    
    return newReview;
  }
  
  async updateReview(reviewId: number, userId: number, reviewUpdates: Partial<InsertStrainReview>): Promise<StrainReview | undefined> {
    const existingReview = this.reviewsMap.get(reviewId);
    
    // Check if review exists and belongs to the user
    if (!existingReview || existingReview.userId !== userId) {
      return undefined;
    }
    
    // Update the review
    const updatedReview: StrainReview = {
      ...existingReview,
      ...reviewUpdates,
      updatedAt: new Date()
    };
    

  // Password reset functionality implementation
  async setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<boolean> {
    try {
      this.resetTokensMap.set(token, { userId, expiry });
      return true;
    } catch (error) {
      console.error("Error setting password reset token:", error);
      return false;
    }
  }

  async verifyPasswordResetToken(token: string): Promise<boolean> {
    try {
      const tokenData = this.resetTokensMap.get(token);
      if (!tokenData) return false;
      
      // Check if token is expired
      if (tokenData.expiry < new Date()) {
        this.resetTokensMap.delete(token); // Clean up expired token
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error verifying password reset token:", error);
      return false;
    }
  }

  async resetPasswordWithToken(token: string, newPasswordHash: string): Promise<boolean> {
    try {
      const tokenData = this.resetTokensMap.get(token);
      if (!tokenData || tokenData.expiry < new Date()) {
        return false;
      }
      
      const user = this.users.get(tokenData.userId);
      if (!user) return false;
      
      // Update the user's password
      user.password = newPasswordHash;
      this.users.set(user.id, user);
      
      // Remove the used token
      this.resetTokensMap.delete(token);
      
      return true;
    } catch (error) {
      console.error("Error resetting password with token:", error);
      return false;
    }
  }

  // Update in reviews map
  async updateReview(reviewId: number, userId: number, reviewUpdates: Partial<InsertStrainReview>): Promise<StrainReview | undefined> {
    const existingReview = this.reviewsMap.get(reviewId);
    
    // Check if review exists and belongs to the user
    if (!existingReview || existingReview.userId !== userId) {
      return undefined;
    }
    
    // Update the review
    const updatedReview: StrainReview = {
      ...existingReview,
      ...reviewUpdates,
      updatedAt: new Date()
    };
    
    // Update in reviews map
    this.reviewsMap.set(reviewId, updatedReview);
    
    // Update in strain reviews map
    const strainReviews = this.strainReviewsMap.get(existingReview.strainId) || [];
    const updatedStrainReviews = strainReviews.map(review => 
      review.id === reviewId ? updatedReview : review
    );
    this.strainReviewsMap.set(existingReview.strainId, updatedStrainReviews);
    
    return updatedReview;
  }
  
  async deleteReview(reviewId: number, userId: number): Promise<boolean> {
    const existingReview = this.reviewsMap.get(reviewId);
    
    // Check if review exists and belongs to the user
    if (!existingReview || existingReview.userId !== userId) {
      return false;
    }
    
    // Remove from reviews map
    this.reviewsMap.delete(reviewId);
    
    // Remove from strain reviews map
    const strainReviews = this.strainReviewsMap.get(existingReview.strainId) || [];
    const updatedStrainReviews = strainReviews.filter(review => review.id !== reviewId);
    this.strainReviewsMap.set(existingReview.strainId, updatedStrainReviews);
    
    return true;
  }
  
  // Community discussions
  async getDiscussions(page = 1, limit = 10, tag?: string): Promise<DiscussionWithUser[]> {
    let discussions = Array.from(this.discussionsMap.values());
    
    // Filter by tag if provided
    if (tag) {
      discussions = discussions.filter(discussion => 
        discussion.tags && discussion.tags.includes(tag)
      );
    }
    
    // Sort by most recent
    discussions.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedDiscussions = discussions.slice(startIndex, startIndex + limit);
    
    // Join with username and comment count
    const discussionsWithUsers: DiscussionWithUser[] = await Promise.all(
      paginatedDiscussions.map(async (discussion) => {
        const user = await this.getUser(discussion.userId);
        const comments = this.discussionCommentsMap.get(discussion.id) || [];
        
        return {
          ...discussion,
          username: user?.username || 'Unknown User',
          commentCount: comments.length
        };
      })
    );
    
    return discussionsWithUsers;
  }
  
  async getDiscussionById(discussionId: number): Promise<CommunityDiscussion | undefined> {
    return this.discussionsMap.get(discussionId);
  }
  
  async getUserDiscussions(userId: number): Promise<CommunityDiscussion[]> {
    return Array.from(this.discussionsMap.values())
      .filter(discussion => discussion.userId === userId);
  }
  
  async createDiscussion(userId: number, discussion: InsertCommunityDiscussion): Promise<CommunityDiscussion> {
    const id = this.currentId++;
    const now = new Date();
    
    const newDiscussion: CommunityDiscussion = {
      id,
      userId,
      title: discussion.title,
      content: discussion.content,
      tags: discussion.tags || [],
      likes: 0,
      createdAt: now,
      updatedAt: now
    };
    
    this.discussionsMap.set(id, newDiscussion);
    
    return newDiscussion;
  }
  
  async updateDiscussion(discussionId: number, userId: number, discussionUpdates: Partial<InsertCommunityDiscussion>): Promise<CommunityDiscussion | undefined> {
    const existingDiscussion = this.discussionsMap.get(discussionId);
    
    // Check if discussion exists and belongs to the user
    if (!existingDiscussion || existingDiscussion.userId !== userId) {
      return undefined;
    }
    
    // Update the discussion
    const updatedDiscussion: CommunityDiscussion = {
      ...existingDiscussion,
      ...discussionUpdates,
      updatedAt: new Date()
    };
    
    this.discussionsMap.set(discussionId, updatedDiscussion);
    
    return updatedDiscussion;
  }
  
  async deleteDiscussion(discussionId: number, userId: number): Promise<boolean> {
    const existingDiscussion = this.discussionsMap.get(discussionId);
    
    // Check if discussion exists and belongs to the user
    if (!existingDiscussion || existingDiscussion.userId !== userId) {
      return false;
    }
    
    // Remove the discussion
    this.discussionsMap.delete(discussionId);
    
    // Remove associated comments
    this.discussionCommentsMap.delete(discussionId);
    
    return true;
  }
  
  async likeDiscussion(discussionId: number, userId: number): Promise<boolean> {
    const existingDiscussion = this.discussionsMap.get(discussionId);
    
    if (!existingDiscussion) {
      return false;
    }
    
    // In a real implementation, we would check if the user has already liked the discussion
    // and toggle accordingly. For simplicity in this in-memory version, we'll just increment.
    
    const updatedDiscussion: CommunityDiscussion = {
      ...existingDiscussion,
      likes: existingDiscussion.likes + 1
    };
    
    this.discussionsMap.set(discussionId, updatedDiscussion);
    
    return true;
  }
  
  // Discussion comments
  async getCommentsByDiscussion(discussionId: number): Promise<CommentWithUser[]> {
    const comments = this.discussionCommentsMap.get(discussionId) || [];
    
    // Join with username
    const commentsWithUsers: CommentWithUser[] = await Promise.all(
      comments.map(async (comment) => {
        const user = await this.getUser(comment.userId);
        return {
          ...comment,
          username: user?.username || 'Unknown User'
        };
      })
    );
    
    // Sort by creation date (oldest first)
    commentsWithUsers.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    return commentsWithUsers;
  }
  
  async createComment(userId: number, comment: InsertDiscussionComment): Promise<DiscussionComment> {
    const id = this.currentId++;
    const now = new Date();
    
    const newComment: DiscussionComment = {
      id,
      discussionId: comment.discussionId,
      userId,
      content: comment.content,
      likes: 0,
      createdAt: now,
      updatedAt: now
    };
    
    // Add to comments map
    const discussionComments = this.discussionCommentsMap.get(comment.discussionId) || [];
    discussionComments.push(newComment);
    this.discussionCommentsMap.set(comment.discussionId, discussionComments);
    
    return newComment;
  }
  
  async updateComment(commentId: number, userId: number, content: string): Promise<DiscussionComment | undefined> {
    // Find the comment in all discussions
    for (const [discussionId, comments] of this.discussionCommentsMap.entries()) {
      const commentIndex = comments.findIndex(c => c.id === commentId);
      
      if (commentIndex !== -1) {
        const comment = comments[commentIndex];
        
        // Check if comment belongs to the user
        if (comment.userId !== userId) {
          return undefined;
        }
        
        // Update the comment
        const updatedComment: DiscussionComment = {
          ...comment,
          content,
          updatedAt: new Date()
        };
        
        // Update in the array
        comments[commentIndex] = updatedComment;
        this.discussionCommentsMap.set(discussionId, comments);
        
        return updatedComment;
      }
    }
    
    return undefined;
  }
  
  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    // Find the comment in all discussions
    for (const [discussionId, comments] of this.discussionCommentsMap.entries()) {
      const comment = comments.find(c => c.id === commentId);
      
      if (comment) {
        // Check if comment belongs to the user
        if (comment.userId !== userId) {
          return false;
        }
        
        // Remove the comment
        const updatedComments = comments.filter(c => c.id !== commentId);
        this.discussionCommentsMap.set(discussionId, updatedComments);
        
        return true;
      }
    }
    
    return false;
  }
  
  async likeComment(commentId: number, userId: number): Promise<boolean> {
    // Find the comment in all discussions
    for (const [discussionId, comments] of this.discussionCommentsMap.entries()) {
      const commentIndex = comments.findIndex(c => c.id === commentId);
      
      if (commentIndex !== -1) {
        const comment = comments[commentIndex];
        
        // In a real implementation, we would check if the user has already liked the comment
        // and toggle accordingly. For simplicity in this in-memory version, we'll just increment.
        
        // Update the comment
        const updatedComment: DiscussionComment = {
          ...comment,
          likes: comment.likes + 1
        };
        
        // Update in the array
        comments[commentIndex] = updatedComment;
        this.discussionCommentsMap.set(discussionId, comments);
        
        return true;
      }
    }
    
    return false;
  }
}

// We'll set this to DatabaseStorage in a separate import to avoid circular dependencies
export let storage: IStorage;

// This will be called after DatabaseStorage is defined
export function setStorage(storageImplementation: IStorage) {
  storage = storageImplementation;
}

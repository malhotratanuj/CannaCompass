import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  userPreferencesSchema, 
  savedStrainSchema, 
  strainReviewSchema, 
  communityDiscussionSchema, 
  discussionCommentSchema,
  UserLocation 
} from "@shared/schema";
import { findNearbyDispensaries, startStoreFinderService } from "./storeFinder";
import { setupAuth } from "./auth";
import { vectorDb } from "./vectorDb";
import { aiRecommender } from "./aiRecommender";
import { enhancedStrains } from "./enhancedStrainData";
import { googlePlacesAdapter } from "./googlePlacesAdapter";
import { googlePlacesService } from "./googlePlacesService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  // prefix all routes with /api
  
  // Health check for the RAG system
  app.get("/api/system/status", async (_req: Request, res: Response) => {
    try {
      // Initialize vector database if not already done
      await vectorDb.initialize();
      
      const enhancedStrainCount = enhancedStrains.length;
      const vectorDbInitialized = true; // We've just initialized it above
      
      // Check the current strain arrays
      console.log(`Enhanced strains: ${enhancedStrainCount}`);
      console.log(`First enhanced strain: ${enhancedStrains[0]?.name}`);
      
      // Check AI services
      const openAiAvailable = !!process.env.OPENAI_API_KEY;
      const anthropicAvailable = !!process.env.ANTHROPIC_API_KEY;
      
      res.json({
        status: "healthy",
        aiRecommenderReady: true,
        vectorDbInitialized,
        enhancedStrainCount,
        aiServices: {
          openai: openAiAvailable,
          anthropic: anthropicAvailable,
          primaryService: openAiAvailable ? "openai" : (anthropicAvailable ? "anthropic" : "fallback")
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error checking system status:", error);
      res.status(500).json({
        status: "unhealthy",
        error: "Failed to verify AI system status",
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Special diagnostic endpoint to get strain counts
  app.get("/api/debug/strains", async (_req: Request, res: Response) => {
    try {
      const allStrains = await storage.getAllStrains();
      const firstStrain = allStrains.length > 0 ? allStrains[0] : null;
      
      res.json({
        enhancedStrainCount: enhancedStrains.length,
        returnedStrainCount: allStrains.length,
        firstStrain: firstStrain ? {
          id: firstStrain.id,
          name: firstStrain.name,
          type: firstStrain.type
        } : null
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      res.status(500).json({ error: "Failed to fetch debug info" });
    }
  });
  
  // Get strain recommendations based on user preferences
  app.post("/api/recommendations", async (req: Request, res: Response) => {
    try {
      console.log("Received recommendation request:", JSON.stringify(req.body));
      const { mood, experienceLevel, effects, flavors, consumptionMethod } = req.body;
      
      if (!mood || !experienceLevel) {
        console.log("Missing required fields: mood or experienceLevel");
        return res.status(400).json({ message: "Mood and experience level are required" });
      }
      
      console.log("Calling storage.getStrainRecommendations...");
      console.log("Request parameters:", { mood, experienceLevel, effects, flavors, consumptionMethod });
      
      try {
        // Make a clean request object with no undefined values
        const requestParams = {
          mood,
          experienceLevel,
          effects: effects || [],
          flavors: flavors || [],
          consumptionMethod: consumptionMethod || []
        };
        
        // Try to get recommendations
        let recommendations = await storage.getStrainRecommendations(requestParams);
        
        // Ensure we have a valid array (defensive programming)
        if (!recommendations || !Array.isArray(recommendations)) {
          console.warn("Storage returned a non-array result:", recommendations);
          recommendations = [];
        }
        
        // Log successful recommendations
        console.log(`Got ${recommendations.length} recommendations`);
        if (recommendations.length > 0) {
          console.log(`Enhanced recommendation data is present. Match score: ${recommendations[0].matchScore || 'N/A'}`);
          return res.json(recommendations);
        } else {
          console.log("No recommendations found, using fallback recommendations");
          
          // If no recommendations found, use fallback
          throw new Error("No recommendations found for the given criteria");
        }
      } catch (error) {
        console.error("Error in recommendations:", error);
        
        try {
          // Return default recommendations on error
          const allStrains = await storage.getAllStrains();
          
          // Make sure we have strains to work with
          if (!allStrains || !Array.isArray(allStrains) || allStrains.length === 0) {
            console.error("Error retrieving strains for fallback recommendations");
            return res.json([]); // Return empty array as last resort
          }
          
          // Create fallback recommendations with basic enhancement
          const defaultRecommendations = allStrains
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5)
            .map(strain => ({
              ...strain,
              matchScore: 50,
              matchReason: `${strain.name} is a popular ${strain.type.toLowerCase()} strain`,
              usageTips: `Start with a small amount and adjust based on your experience.`,
              effectsExplanation: `Known for ${strain.effects.join(', ')} effects.`
            }));
          
          console.log(`Returning ${defaultRecommendations.length} fallback recommendations after error`);
          return res.json(defaultRecommendations);
        } catch (fallbackError) {
          console.error("Critical error in fallback recommendations:", fallbackError);
          
          // Absolute last resort - return empty array but not undefined/null
          return res.json([]);
        }
      }
    } catch (error) {
      console.error("Unexpected error in recommendation route:", error);
      
      try {
        // Ultimate fallback - return some basic strains if anything fails
        const fallbackStrains = await storage.getAllStrains();
        const defaultRecommendations = fallbackStrains
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
          .map(strain => ({
            ...strain,
            matchScore: 50,
            matchReason: `${strain.name} is a popular ${strain.type.toLowerCase()} strain`,
            usageTips: `Start with a small amount and adjust based on your experience.`,
            effectsExplanation: `Known for ${strain.effects.join(', ')} effects.`
          }));
        
        console.log(`Returning ${defaultRecommendations.length} emergency fallback recommendations`);
        return res.json(defaultRecommendations);
      } catch (finalError) {
        // If even the fallback fails, return an empty array to avoid undefined errors
        console.error("Critical error in recommendation fallback:", finalError);
        return res.json([]);
      }
    }
  });
  
  // Get strain by ID
  app.get("/api/strains/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const strain = await storage.getStrainById(id);
      
      if (!strain) {
        return res.status(404).json({ message: "Strain not found" });
      }
      
      return res.json({ strain });
    } catch (error) {
      console.error("Error getting strain:", error);
      return res.status(500).json({ message: "Failed to get strain details" });
    }
  });
  
  // Get all available strains
  app.get("/api/strains", async (_req: Request, res: Response) => {
    try {
      const strains = await storage.getAllStrains();
      console.log(`Returning ${strains.length} strains from getAllStrains`);
      return res.json({ strains });
    } catch (error) {
      console.error("Error getting strains:", error);
      return res.status(500).json({ message: "Failed to get strains" });
    }
  });
  
  // Find nearby dispensaries (using static data from storage)
  app.post("/api/dispensaries/static", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius = 10 } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Location coordinates are required" });
      }
      
      const dispensaries = await storage.findNearbyDispensaries(
        { latitude, longitude },
        radius
      );
      
      return res.json({ dispensaries });
    } catch (error) {
      console.error("Error finding dispensaries:", error);
      return res.status(500).json({ message: "Failed to find nearby dispensaries" });
    }
  });
  
  // Find nearby dispensaries (using dynamic store finder to search for dispensaries)
  app.post("/api/dispensaries/nearby", async (req: Request, res: Response) => {
    try {
      const { location, strainIds = [] } = req.body;
      
      if (!location) {
        return res.status(400).json({ message: "Location information is required" });
      }
      
      const { latitude, longitude, address } = location;
      
      // For Canadian addresses, we can proceed with just the address
      const isCanadianAddress = address && 
        ((/^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i.test(address.trim())) || // Postal code format
         (/\b(BC|AB|SK|MB|ON|QC|NB|NS|PE|NL|YT|NT|NU)\b/i.test(address))); // Province code format
      
      // If it's not a Canadian address, we require coordinates
      if (!isCanadianAddress && (!latitude || !longitude)) {
        return res.status(400).json({ message: "Location coordinates are required for non-Canadian addresses" });
      }
      
      console.log("Finding nearby dispensaries using dynamic store finder...");
      if (address) console.log(`Finding dispensaries near ${address}`);
      if (latitude && longitude) console.log(`Location: ${latitude}, ${longitude}`);
      console.log(`Selected strains: ${strainIds.join(', ')}`);
      
      // Get the user's location
      const userLocation: UserLocation = {
        latitude: latitude || 0, // Default to 0 for Canadian addresses without coordinates
        longitude: longitude || 0,
        address
      };
      
      // Default radius is 10 miles
      const radius = req.body.radius || 10;
      
      // Use our enhanced store finder to get dynamic results
      const dispensaries = await findNearbyDispensaries(
        userLocation,
        radius,
        strainIds
      );
      
      return res.json({ dispensaries });
    } catch (error) {
      console.error("Error finding dispensaries:", error);
      
      // Fallback to static data if store finder fails
      try {
        console.log("Falling back to static dispensary data...");
        const radius = req.body.radius || 10;
        // Get location data from location object
        const { latitude, longitude } = req.body.location || { latitude: 0, longitude: 0 };
        
        // Default to Vancouver coordinates if we don't have valid ones
        const fallbackLat = latitude || 49.2827;
        const fallbackLng = longitude || -123.1207;
        
        const dispensaries = await storage.findNearbyDispensaries(
          { latitude: fallbackLat, longitude: fallbackLng },
          radius
        );
        return res.json({ 
          dispensaries,
          note: "Using fallback static data because store finder failed"
        });
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        return res.status(500).json({ message: "Failed to find nearby dispensaries" });
      }
    }
  });
  
  // Get dispensary by ID
  app.get("/api/dispensaries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dispensary = await storage.getDispensaryById(id);
      
      if (!dispensary) {
        return res.status(404).json({ message: "Dispensary not found" });
      }
      
      return res.json({ dispensary });
    } catch (error) {
      console.error("Error getting dispensary:", error);
      return res.status(500).json({ message: "Failed to get dispensary details" });
    }
  });
  
  // Save user preferences
  app.post("/api/preferences", async (req: Request, res: Response) => {
    try {
      // In a real app, this would use the user's ID from the session
      // For now, we'll use a default user ID
      const userId = 1;
      
      // Validate request body
      const validatedData = userPreferencesSchema.parse(req.body);
      
      const preferences = await storage.saveUserPreferences(userId, validatedData);
      return res.json({ preferences });
    } catch (error) {
      console.error("Error saving preferences:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preferences data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to save preferences" });
    }
  });
  
  // Get user preferences
  app.get("/api/preferences", async (_req: Request, res: Response) => {
    try {
      // In a real app, this would use the user's ID from the session
      const userId = 1;
      
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: "No preferences found" });
      }
      
      return res.json({ preferences });
    } catch (error) {
      console.error("Error getting preferences:", error);
      return res.status(500).json({ message: "Failed to get preferences" });
    }
  });
  
  // Save a strain to user's favorites
  app.post("/api/strains/save", async (req: Request, res: Response) => {
    try {
      // In a real app, this would use the user's ID from the session
      const userId = 1;
      
      const { strainId } = req.body;
      
      if (!strainId) {
        return res.status(400).json({ message: "Strain ID is required" });
      }
      
      const savedStrain = await storage.saveStrain(userId, strainId);
      return res.json({ savedStrain });
    } catch (error) {
      console.error("Error saving strain:", error);
      return res.status(500).json({ message: "Failed to save strain" });
    }
  });
  
  // Remove a strain from user's favorites
  app.delete("/api/strains/save/:strainId", async (req: Request, res: Response) => {
    try {
      // In a real app, this would use the user's ID from the session
      const userId = 1;
      
      const { strainId } = req.params;
      
      await storage.removeSavedStrain(userId, strainId);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error removing saved strain:", error);
      return res.status(500).json({ message: "Failed to remove saved strain" });
    }
  });
  
  // Get user's saved strains
  app.get("/api/strains/saved", async (_req: Request, res: Response) => {
    try {
      // In a real app, this would use the user's ID from the session
      const userId = 1;
      
      const savedStrains = await storage.getSavedStrains(userId);
      return res.json({ savedStrains });
    } catch (error) {
      console.error("Error getting saved strains:", error);
      return res.status(500).json({ message: "Failed to get saved strains" });
    }
  });

  // ==================== STRAIN REVIEWS ROUTES ====================
  
  // Get reviews for a specific strain
  app.get("/api/strains/:strainId/reviews", async (req: Request, res: Response) => {
    try {
      const { strainId } = req.params;
      const reviews = await storage.getStrainReviews(strainId);
      return res.json({ reviews });
    } catch (error) {
      console.error("Error getting strain reviews:", error);
      return res.status(500).json({ message: "Failed to get strain reviews" });
    }
  });
  
  // Get a specific review by ID
  app.get("/api/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const review = await storage.getReviewById(parseInt(reviewId));
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      return res.json({ review });
    } catch (error) {
      console.error("Error getting review:", error);
      return res.status(500).json({ message: "Failed to get review" });
    }
  });
  
  // Create a new review
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      // Validate the request body using Zod
      const validatedData = strainReviewSchema.parse(req.body);
      
      const review = await storage.createReview(userId, validatedData);
      return res.status(201).json({ review });
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create review" });
    }
  });
  
  // Update a review
  app.put("/api/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      // Validate the request body using Zod
      const validatedData = strainReviewSchema.partial().parse(req.body);
      
      const updatedReview = await storage.updateReview(parseInt(reviewId), userId, validatedData);
      
      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found or you don't have permission to update it" });
      }
      
      return res.json({ review: updatedReview });
    } catch (error) {
      console.error("Error updating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update review" });
    }
  });
  
  // Delete a review
  app.delete("/api/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      const success = await storage.deleteReview(parseInt(reviewId), userId);
      
      if (!success) {
        return res.status(404).json({ message: "Review not found or you don't have permission to delete it" });
      }
      
      return res.json({ success });
    } catch (error) {
      console.error("Error deleting review:", error);
      return res.status(500).json({ message: "Failed to delete review" });
    }
  });
  
  // Get all reviews by a user
  app.get("/api/users/:userId/reviews", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const reviews = await storage.getUserReviews(parseInt(userId));
      return res.json({ reviews });
    } catch (error) {
      console.error("Error getting user reviews:", error);
      return res.status(500).json({ message: "Failed to get user reviews" });
    }
  });
  
  // Get current user's reviews
  app.get("/api/user/reviews", async (req: Request, res: Response) => {
    try {
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      const reviews = await storage.getUserReviews(userId);
      return res.json({ reviews });
    } catch (error) {
      console.error("Error getting user reviews:", error);
      return res.status(500).json({ message: "Failed to get user reviews" });
    }
  });
  
  // ================== COMMUNITY DISCUSSION ROUTES =================
  
  // Get all community discussions with pagination
  app.get("/api/discussions", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const tag = req.query.tag as string;
      
      const discussions = await storage.getDiscussions(page, limit, tag);
      return res.json({ discussions });
    } catch (error) {
      console.error("Error getting discussions:", error);
      return res.status(500).json({ message: "Failed to get discussions" });
    }
  });
  
  // Get a specific discussion by ID
  app.get("/api/discussions/:discussionId", async (req: Request, res: Response) => {
    try {
      const { discussionId } = req.params;
      const discussion = await storage.getDiscussionById(parseInt(discussionId));
      
      if (!discussion) {
        return res.status(404).json({ message: "Discussion not found" });
      }
      
      // Get comments for this discussion
      const comments = await storage.getCommentsByDiscussion(parseInt(discussionId));
      
      return res.json({ discussion, comments });
    } catch (error) {
      console.error("Error getting discussion:", error);
      return res.status(500).json({ message: "Failed to get discussion" });
    }
  });
  
  // Create a new discussion
  app.post("/api/discussions", async (req: Request, res: Response) => {
    try {
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      // Validate the request body using Zod
      const validatedData = communityDiscussionSchema.parse(req.body);
      
      const discussion = await storage.createDiscussion(userId, validatedData);
      return res.status(201).json({ discussion });
    } catch (error) {
      console.error("Error creating discussion:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid discussion data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create discussion" });
    }
  });
  
  // Update a discussion
  app.put("/api/discussions/:discussionId", async (req: Request, res: Response) => {
    try {
      const { discussionId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      // Validate the request body using Zod
      const validatedData = communityDiscussionSchema.partial().parse(req.body);
      
      const updatedDiscussion = await storage.updateDiscussion(parseInt(discussionId), userId, validatedData);
      
      if (!updatedDiscussion) {
        return res.status(404).json({ message: "Discussion not found or you don't have permission to update it" });
      }
      
      return res.json({ discussion: updatedDiscussion });
    } catch (error) {
      console.error("Error updating discussion:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid discussion data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update discussion" });
    }
  });
  
  // Delete a discussion
  app.delete("/api/discussions/:discussionId", async (req: Request, res: Response) => {
    try {
      const { discussionId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      const success = await storage.deleteDiscussion(parseInt(discussionId), userId);
      
      if (!success) {
        return res.status(404).json({ message: "Discussion not found or you don't have permission to delete it" });
      }
      
      return res.json({ success });
    } catch (error) {
      console.error("Error deleting discussion:", error);
      return res.status(500).json({ message: "Failed to delete discussion" });
    }
  });
  
  // Like a discussion
  app.post("/api/discussions/:discussionId/like", async (req: Request, res: Response) => {
    try {
      const { discussionId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      const success = await storage.likeDiscussion(parseInt(discussionId), userId);
      
      if (!success) {
        return res.status(404).json({ message: "Discussion not found" });
      }
      
      return res.json({ success });
    } catch (error) {
      console.error("Error liking discussion:", error);
      return res.status(500).json({ message: "Failed to like discussion" });
    }
  });
  
  // ================== DISCUSSION COMMENTS ROUTES =================
  
  // Get comments for a discussion
  app.get("/api/discussions/:discussionId/comments", async (req: Request, res: Response) => {
    try {
      const { discussionId } = req.params;
      const comments = await storage.getCommentsByDiscussion(parseInt(discussionId));
      return res.json({ comments });
    } catch (error) {
      console.error("Error getting comments:", error);
      return res.status(500).json({ message: "Failed to get comments" });
    }
  });
  
  // Add a comment to a discussion
  app.post("/api/discussions/:discussionId/comments", async (req: Request, res: Response) => {
    try {
      const { discussionId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      // Validate the request body using Zod
      const validatedData = discussionCommentSchema.parse({
        ...req.body,
        discussionId: parseInt(discussionId)
      });
      
      const comment = await storage.createComment(userId, validatedData);
      return res.status(201).json({ comment });
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  // Update a comment
  app.put("/api/comments/:commentId", async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      const updatedComment = await storage.updateComment(parseInt(commentId), userId, content);
      
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found or you don't have permission to update it" });
      }
      
      return res.json({ comment: updatedComment });
    } catch (error) {
      console.error("Error updating comment:", error);
      return res.status(500).json({ message: "Failed to update comment" });
    }
  });
  
  // Delete a comment
  app.delete("/api/comments/:commentId", async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      const success = await storage.deleteComment(parseInt(commentId), userId);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found or you don't have permission to delete it" });
      }
      
      return res.json({ success });
    } catch (error) {
      console.error("Error deleting comment:", error);
      return res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  
  // Like a comment
  app.post("/api/comments/:commentId/like", async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      // In a real app, this would use the authenticated user's ID
      const userId = req.user?.id || 1;
      
      const success = await storage.likeComment(parseInt(commentId), userId);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      return res.json({ success });
    } catch (error) {
      console.error("Error liking comment:", error);
      return res.status(500).json({ message: "Failed to like comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { userPreferencesSchema, savedStrainSchema, UserLocation } from "@shared/schema";
import { findNearbyDispensaries, startStoreFinderService } from "./storeFinder";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  // prefix all routes with /api
  
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
      const recommendations = await storage.getStrainRecommendations({
        mood,
        experienceLevel,
        effects,
        flavors,
        consumptionMethod
      });
      
      console.log(`Got ${recommendations.length} recommendations`);
      // Debug: log the first recommendation if available
      if (recommendations.length > 0) {
        console.log("First recommendation:", recommendations[0].name);
      }
      
      return res.json({ recommendations });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return res.status(500).json({ message: "Failed to get strain recommendations" });
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

  const httpServer = createServer(app);
  return httpServer;
}

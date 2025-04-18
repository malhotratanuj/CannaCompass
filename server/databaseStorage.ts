import { 
  users, User, InsertUser, 
  userPreferences, UserPreferences, InsertUserPreferences,
  savedStrains, SavedStrain, InsertSavedStrain,
  Strain, Dispensary, UserLocation, RecommendationRequest
} from "@shared/schema";
import { strains } from "./strainData";
import { enhancedStrains } from "./enhancedStrainData";
import { dispensaries } from "./dispensaryData";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";
import { aiRecommender } from "./aiRecommender";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // User preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async saveUserPreferences(userId: number, preferences: InsertUserPreferences): Promise<UserPreferences> {
    // Check if preferences already exist for this user
    const existingPreferences = await this.getUserPreferences(userId);

    if (existingPreferences) {
      // Update existing preferences
      const [updated] = await db
        .update(userPreferences)
        .set({
          mood: preferences.mood,
          experienceLevel: preferences.experienceLevel,
          effects: preferences.effects,
          flavors: preferences.flavors,
          consumptionMethod: preferences.consumptionMethod
        })
        .where(eq(userPreferences.id, existingPreferences.id))
        .returning();
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(userPreferences)
        .values({
          userId,
          ...preferences
        })
        .returning();
      return created;
    }
  }

  // Saved strains
  async getSavedStrains(userId: number): Promise<SavedStrain[]> {
    return db
      .select()
      .from(savedStrains)
      .where(eq(savedStrains.userId, userId));
  }

  async saveStrain(userId: number, strainId: string): Promise<SavedStrain> {
    // Check if already saved
    const [existing] = await db
      .select()
      .from(savedStrains)
      .where(and(
        eq(savedStrains.userId, userId),
        eq(savedStrains.strainId, strainId)
      ));

    if (existing) {
      return existing;
    }

    const [savedStrain] = await db
      .insert(savedStrains)
      .values({
        userId,
        strainId,
        savedAt: new Date().toISOString()
      })
      .returning();

    return savedStrain;
  }

  async removeSavedStrain(userId: number, strainId: string): Promise<void> {
    await db
      .delete(savedStrains)
      .where(and(
        eq(savedStrains.userId, userId),
        eq(savedStrains.strainId, strainId)
      ));
  }

  // For now, we'll keep the strain and dispensary data in memory for simplicity
  // In a production app, these would also be stored in the database
  
  // Strain recommendations
  async getStrainRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    try {
      // Use the AI recommender for more advanced recommendations
      console.log("Using AI Recommender for strain recommendations");
      
      // The aiRecommender now handles both AI-generated and fallback recommendations
      // and adds the enhanced strain information in both cases
      const recommendations = await aiRecommender.getRecommendations(preferences);
      
      console.log(`Got ${recommendations.length} recommendations`);
      
      // Debug: Check if our recommendations have the enhanced attributes
      if (recommendations.length > 0) {
        if (recommendations[0].matchScore !== undefined) {
          console.log("Enhanced recommendation data is present. Match score:", recommendations[0].matchScore);
        } else {
          console.log("Enhanced recommendation data is missing! Check the implementation.");
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error("Error getting recommendations:", error);
      
      // In case of a complete failure, use basic strain data
      return enhancedStrains.slice(0, 5);
    }
  }
  
  // Traditional recommendation algorithm as a fallback
  private async getTraditionalRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    // Enhanced recommendation algorithm based on mood and filters
    let filteredStrains = enhancedStrains;
    
    // Filter by mood with expanded effect mappings to catch more strains
    const moodEffectMap: Record<string, string[]> = {
      'relaxed': ['Relaxing', 'Calming', 'Peaceful', 'Relaxation', 'Stress Relief', 'Pain Relief'],
      'energetic': ['Energetic', 'Uplifting', 'Active', 'Energy', 'Social Uplift'],
      'creative': ['Creative', 'Inspired', 'Creativity', 'Euphoric'],
      'focused': ['Focused', 'Clear-headed', 'Productive', 'Focus', 'Clear'],
      'sleepy': ['Sleepy', 'Sedative', 'Restful', 'Sleep Aid', 'Relaxing'],
      'happy': ['Happy', 'Euphoric', 'Giggly', 'Euphoria', 'Uplifting']
    };
    
    // Add secondary effect mappings (strains with these effects may partially satisfy the mood)
    const secondaryMoodEffects: Record<string, string[]> = {
      'relaxed': ['Happy', 'Pain Relief'],
      'energetic': ['Happy', 'Euphoric', 'Focus'],
      'creative': ['Happy', 'Uplifting', 'Energetic'],
      'focused': ['Uplifting', 'Energy', 'Creativity'],
      'sleepy': ['Pain Relief', 'Calming'],
      'happy': ['Relaxing', 'Creative', 'Social Uplift']
    };
    
    // Only filter by mood if a mood is selected
    if (preferences.mood && preferences.mood.toLowerCase() !== '') {
      const primaryDesiredEffects = moodEffectMap[preferences.mood.toLowerCase()] || [];
      const secondaryDesiredEffects = secondaryMoodEffects[preferences.mood.toLowerCase()] || [];
      
      // First, try to match with primary effects
      let primaryMatches = filteredStrains.filter(strain => 
        strain.effects.some(effect => 
          primaryDesiredEffects.some(desiredEffect => 
            effect.toLowerCase().includes(desiredEffect.toLowerCase())
          )
        )
      );
      
      // If we have enough primary matches, use those
      if (primaryMatches.length >= 3) {
        filteredStrains = primaryMatches;
      } 
      // Otherwise, include secondary matches as well
      else {
        filteredStrains = filteredStrains.filter(strain => 
          strain.effects.some(effect => 
            primaryDesiredEffects.concat(secondaryDesiredEffects).some(desiredEffect => 
              effect.toLowerCase().includes(desiredEffect.toLowerCase())
            )
          )
        );
      }
      
      // If still no matches, return a few default strains instead of nothing
      if (filteredStrains.length === 0) {
        console.log(`No strains match the mood: ${preferences.mood}. Using a default selection.`);
        filteredStrains = enhancedStrains.slice(0, 4);
      }
    }
    
    // Filter by additional effects if specified
    if (preferences.effects && preferences.effects.length > 0) {
      filteredStrains = filteredStrains.filter(strain => 
        preferences.effects!.some(effect => 
          strain.effects.some(strainEffect => 
            strainEffect.toLowerCase().includes(effect.toLowerCase())
          )
        )
      );
    }
    
    // Filter by flavors if specified
    if (preferences.flavors && preferences.flavors.length > 0) {
      filteredStrains = filteredStrains.filter(strain => 
        preferences.flavors!.some(flavor => 
          strain.flavors.some(strainFlavor => 
            strainFlavor.toLowerCase().includes(flavor.toLowerCase())
          )
        )
      );
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
    
    // Return top results, sorted by relevance (for now, just by rating)
    return filteredStrains
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6); // Return top 6 recommendations
  }

  async getStrainById(strainId: string): Promise<Strain | undefined> {
    // First check enhanced strains
    const enhancedStrain = enhancedStrains.find(strain => strain.id === strainId);
    if (enhancedStrain) {
      return enhancedStrain;
    }
    
    // Fallback to original strains
    return strains.find(strain => strain.id === strainId);
  }

  async getAllStrains(): Promise<Strain[]> {
    // Return enhanced strains dataset instead of original strains
    console.log(`Returning ${enhancedStrains.length} strains from getAllStrains`);
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
}
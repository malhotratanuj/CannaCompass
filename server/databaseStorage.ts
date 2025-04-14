import { and, eq } from 'drizzle-orm';
import { 
  User, InsertUser, 
  UserPreferences, InsertUserPreferences, 
  SavedStrain, Strain, Dispensary, UserLocation, RecommendationRequest,
  users, userPreferences, savedStrains
} from '@shared/schema';
import { db } from './db';
import { strains } from './strainData';
import { dispensaries } from './dispensaryData';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
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
    const [user] = await db.insert(users).values(insertUser).returning();
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
    // First check if user already has preferences
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const [updated] = await db
        .update(userPreferences)
        .set({
          mood: preferences.mood || null,
          experienceLevel: preferences.experienceLevel || null,
          effects: preferences.effects || null,
          flavors: preferences.flavors || null,
          consumptionMethod: preferences.consumptionMethod || null
        })
        .where(eq(userPreferences.id, existingPrefs.id))
        .returning();
      
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(userPreferences)
        .values({
          userId,
          mood: preferences.mood || null,
          experienceLevel: preferences.experienceLevel || null,
          effects: preferences.effects || null,
          flavors: preferences.flavors || null,
          consumptionMethod: preferences.consumptionMethod || null
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
    const [existingSaved] = await db
      .select()
      .from(savedStrains)
      .where(and(
        eq(savedStrains.userId, userId),
        eq(savedStrains.strainId, strainId)
      ));
    
    if (existingSaved) {
      return existingSaved;
    }
    
    const [saved] = await db
      .insert(savedStrains)
      .values({
        userId,
        strainId,
        savedAt: new Date().toISOString()
      })
      .returning();
    
    return saved;
  }
  
  async removeSavedStrain(userId: number, strainId: string): Promise<void> {
    await db
      .delete(savedStrains)
      .where(and(
        eq(savedStrains.userId, userId),
        eq(savedStrains.strainId, strainId)
      ));
  }
  
  // Strain recommendations - using the same algorithm from MemStorage
  async getStrainRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    try {
      // Enhanced recommendation algorithm based on mood and filters
      console.log("Strain data length:", strains.length);
      console.log("Preferences received:", JSON.stringify(preferences));
      
      // Start with a copy of the strains array to avoid modifying the original
      let filteredStrains = [...strains];
      
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
      }
      
      // If we got no matches after mood filtering or if there was an issue, use all strains
      if (filteredStrains.length === 0) {
        console.log("No matches after mood filtering, using all strains");
        filteredStrains = [...strains];
      }
      
      // Filter by additional effects if specified
      if (preferences.effects && preferences.effects.length > 0) {
        const beforeCount = filteredStrains.length;
        filteredStrains = filteredStrains.filter(strain => 
          preferences.effects!.some(effect => 
            strain.effects.some(strainEffect => 
              strainEffect.toLowerCase().includes(effect.toLowerCase())
            )
          )
        );
        console.log(`Effects filtering: ${beforeCount} -> ${filteredStrains.length}`);
        
        // If filter removed all options, revert to previous set
        if (filteredStrains.length === 0) {
          console.log("Effects filtering removed all strains, reverting");
          filteredStrains = [...strains];
        }
      }
      
      // Filter by flavors if specified
      if (preferences.flavors && preferences.flavors.length > 0) {
        const beforeCount = filteredStrains.length;
        filteredStrains = filteredStrains.filter(strain => 
          preferences.flavors!.some(flavor => 
            strain.flavors.some(strainFlavor => 
              strainFlavor.toLowerCase().includes(flavor.toLowerCase())
            )
          )
        );
        console.log(`Flavors filtering: ${beforeCount} -> ${filteredStrains.length}`);
        
        // If filter removed all options, revert to previous set
        if (filteredStrains.length === 0) {
          console.log("Flavors filtering removed all strains, reverting");
          filteredStrains = [...strains];
        }
      }
      
      // Return top results, sorted by relevance (for now, just by rating)
      return filteredStrains
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6); // Return top 6 recommendations
    } catch (error) {
      console.error("Error in getStrainRecommendations:", error);
      // Return a default selection if there was an error
      return strains.slice(0, 6);
    }
  }
  
  async getStrainById(strainId: string): Promise<Strain | undefined> {
    return strains.find(strain => strain.id === strainId);
  }
  
  async getAllStrains(): Promise<Strain[]> {
    return strains;
  }
  
  // Dispensary finder - using the same algorithm from MemStorage
  async findNearbyDispensaries(location: UserLocation, radius: number): Promise<Dispensary[]> {
    // Simple implementation that calculates distances between user location and dispensaries
    const nearbyDispensaries = dispensaries.map((dispensary: Dispensary) => {
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
      .filter((dispensary: Dispensary) => dispensary.distance <= radius)
      .sort((a: Dispensary, b: Dispensary) => a.distance - b.distance);
  }
  
  async getDispensaryById(dispensaryId: string): Promise<Dispensary | undefined> {
    return dispensaries.find((dispensary: Dispensary) => dispensary.id === dispensaryId);
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
import { 
  users, User, InsertUser, 
  userPreferences, UserPreferences, InsertUserPreferences,
  savedStrains, SavedStrain, InsertSavedStrain,
  Strain, Dispensary, UserLocation, RecommendationRequest
} from "@shared/schema";
import { strains } from "./strainData";
import { dispensaries } from "./dispensaryData";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferencesMap: Map<number, UserPreferences>;
  private savedStrainsMap: Map<number, SavedStrain[]>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.userPreferencesMap = new Map();
    this.savedStrainsMap = new Map();
    this.currentId = 1;
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

  // Strain recommendations
  async getStrainRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    // Simple recommendation algorithm based on mood and filters
    let filteredStrains = strains;
    
    // Filter by mood
    const moodEffectMap: Record<string, string[]> = {
      'relaxed': ['Relaxing', 'Calming', 'Peaceful'],
      'energetic': ['Energetic', 'Uplifting', 'Active'],
      'creative': ['Creative', 'Focused', 'Inspired'],
      'focused': ['Focused', 'Clear-headed', 'Productive'],
      'sleepy': ['Sleepy', 'Sedative', 'Restful'],
      'happy': ['Happy', 'Euphoric', 'Giggly']
    };
    
    const desiredEffects = moodEffectMap[preferences.mood.toLowerCase()] || [];
    
    if (desiredEffects.length > 0) {
      filteredStrains = filteredStrains.filter(strain => 
        strain.effects.some(effect => 
          desiredEffects.some(desiredEffect => 
            effect.toLowerCase().includes(desiredEffect.toLowerCase())
          )
        )
      );
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
    return strains.find(strain => strain.id === strainId);
  }

  async getAllStrains(): Promise<Strain[]> {
    return strains;
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

export const storage = new MemStorage();

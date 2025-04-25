import { enhancedStrains, strainVectors, initializeVectors } from './enhancedStrainData';
import OpenAI from 'openai';
import { Strain, RecommendationRequest } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// This is our in-memory vector database
interface VectorEntry {
  id: string;
  vector: number[];
  strain: Strain;
}

class VectorDatabase {
  private vectors: VectorEntry[] = [];
  private initialized: boolean = false;

  constructor() {
    console.log("Vector database initialized");
  }

  // Initialize the database with strain data
  async initialize() {
    if (this.initialized) return;
    console.log("Starting vector database initialization...");

    try {
      // Initialize placeholder vectors first
      initializeVectors();

      // In a production environment, we would generate real embeddings here
      // But for this demo, we'll use our placeholders from strainVectors
      this.vectors = enhancedStrains.map(strain => ({
        id: strain.id,
        vector: strainVectors[strain.id] || [0, 0, 0],
        strain
      }));

      this.initialized = true;
      console.log(`Vector database initialized with ${this.vectors.length} entries`);
    } catch (error) {
      console.error("Error initializing vector database:", error);
      throw error;
    }
  }

  // In a real implementation, this would create embeddings using OpenAI API
  async createEmbedding(text: string): Promise<number[]> {
    try {
      // In production, we'd use OpenAI's embedding API:
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      // Return a placeholder vector for demonstration
      return [Math.random(), Math.random(), Math.random()];
    }
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
      console.warn("Invalid vector dimensions for cosine similarity calculation");
      return 0;
    }
    
    try {
      // Calculate dot product
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      
      // Handle zero vectors
      if (normA === 0 || normB === 0) {
        return 0;
      }
      
      // Calculate cosine similarity
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    } catch (error) {
      console.error("Error calculating cosine similarity:", error);
      return 0;
    }
  }

  // Find similar strains based on query
  async findSimilarStrains(query: string, limit: number = 5): Promise<Strain[]> {
    if (!this.initialized) await this.initialize();

    try {
      // Create query embedding
      const queryVector = await this.createEmbedding(query);

      // Calculate similarity scores
      const scoredStrains = this.vectors.map(entry => ({
        strain: entry.strain,
        score: this.cosineSimilarity(queryVector, entry.vector)
      }));

      // Sort by similarity score
      scoredStrains.sort((a, b) => b.score - a.score);

      // Return top results
      return scoredStrains.slice(0, limit).map(entry => entry.strain);
    } catch (error) {
      console.error("Error finding similar strains:", error);
      return [];
    }
  }
}

// Singleton instance
export const vectorDb = new VectorDatabase();

// Helper function to create a query from preferences with contextual awareness
export function createQuery(preferences: RecommendationRequest): string {
  const parts = [];
  
  // Add time of day context
  const hour = new Date().getHours();
  let timeContext = '';
  
  if (hour >= 5 && hour < 12) {
    timeContext = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeContext = 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeContext = 'evening';
  } else {
    timeContext = 'night';
  }
  
  // Add mood with time context
  if (preferences.mood) {
    // Adjust mood based on time of day for more contextually relevant results
    const moodAdjustments: Record<string, Record<string, string>> = {
      'morning': {
        'relaxed': 'gently relaxed but still alert for morning',
        'energetic': 'energetic to start the day',
        'creative': 'creative and productive for morning work',
        'focused': 'focused for morning tasks',
        'sleepy': 'mildly relaxed without being too sedated',
        'happy': 'uplifted and happy to start the day'
      },
      'afternoon': {
        'relaxed': 'moderately relaxed for afternoon unwinding',
        'energetic': 'energetic to overcome afternoon slump',
        'creative': 'creative for afternoon activities',
        'focused': 'focused for afternoon productivity',
        'sleepy': 'mildly sedated for afternoon relaxation',
        'happy': 'happy and socially engaging'
      },
      'evening': {
        'relaxed': 'deeply relaxed for evening unwinding',
        'energetic': 'moderately energetic for evening activities',
        'creative': 'creative and introspective for evening',
        'focused': 'relaxed but still mentally clear',
        'sleepy': 'sleep-inducing for bedtime',
        'happy': 'euphoric and relaxed for evening enjoyment'
      },
      'night': {
        'relaxed': 'deeply relaxed for nighttime rest',
        'energetic': 'balanced energy without being too stimulating',
        'creative': 'introspective and calmly creative',
        'focused': 'gentle mental clarity without being too stimulating',
        'sleepy': 'strongly sleep-inducing for insomnia',
        'happy': 'calming euphoria for night relaxation'
      }
    };
    
    const adjustedMood = moodAdjustments[timeContext]?.[preferences.mood.toLowerCase()] || preferences.mood;
    parts.push(`Mood: ${adjustedMood} during ${timeContext}`);
  } else {
    // If no mood is specified, add time context anyway
    parts.push(`Time of day: ${timeContext}`);
  }
  
  // Handle experience level with more nuance
  if (preferences.experienceLevel) {
    const experienceLevelContexts: Record<string, string> = {
      'beginner': 'low THC content for a beginner with minimal tolerance, avoid overwhelming effects',
      'intermediate': 'moderate THC content for someone with some experience and tolerance',
      'experienced': 'higher THC content for a veteran user with substantial tolerance'
    };
    
    const experienceContext = experienceLevelContexts[preferences.experienceLevel] || `Experience: ${preferences.experienceLevel}`;
    parts.push(experienceContext);
  }
  
  // Add effects with priority weighting
  if (preferences.effects && preferences.effects.length > 0) {
    // Group effects by primary and secondary importance
    const primaryEffects = preferences.effects.slice(0, 2);
    const secondaryEffects = preferences.effects.slice(2);
    
    if (primaryEffects.length > 0) {
      parts.push(`Primary desired effects: ${primaryEffects.join(', ')}`);
    }
    
    if (secondaryEffects.length > 0) {
      parts.push(`Secondary desired effects: ${secondaryEffects.join(', ')}`);
    }
  }
  
  // Add flavors with more descriptive language
  if (preferences.flavors && preferences.flavors.length > 0) {
    const flavorDescriptors: Record<string, string[]> = {
      'Citrus': ['zesty', 'refreshing', 'tangy'],
      'Sweet': ['sweet', 'dessert-like', 'sugary'],
      'Earthy': ['earthy', 'grounded', 'natural'],
      'Berry': ['berry', 'fruity', 'jam-like'],
      'Pine': ['pine', 'forest', 'outdoorsy'],
      'Woody': ['woody', 'oak', 'cedar'],
      'Spicy': ['spicy', 'peppery', 'warm'],
      'Tropical': ['tropical', 'exotic', 'island'],
      'Grape': ['grape', 'wine-like', 'purple'],
      'Floral': ['floral', 'flowery', 'botanical']
    };
    
    const flavorDescriptions = preferences.flavors.map(flavor => {
      const descriptors = flavorDescriptors[flavor] || [flavor.toLowerCase()];
      return `${descriptors[0]} ${flavor.toLowerCase()}`;
    });
    
    parts.push(`Desired flavors: ${flavorDescriptions.join(', ')}`);
  }
  
  // Add consumption method with context
  if (preferences.consumptionMethod && preferences.consumptionMethod.length > 0) {
    const methodContext: Record<string, string> = {
      'Smoking': 'fast-acting effects through smoking',
      'Vaping': 'clean, controlled effects through vaping',
      'Edibles': 'long-lasting, body-focused effects through edibles',
      'Tinctures': 'precise dosing through tinctures',
      'Topicals': 'localized relief without psychoactive effects through topicals'
    };
    
    const methodDescriptions = preferences.consumptionMethod.map(method => 
      methodContext[method] || method
    );
    
    parts.push(`Consumption method: ${methodDescriptions.join('; ')}`);
  }
  
  return parts.join('. ');
}
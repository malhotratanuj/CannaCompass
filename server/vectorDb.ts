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
    // Placeholder simple similarity for demo
    // In production, we'd use proper cosine similarity
    return Math.random(); // Simulating similarity score
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

// Helper function to create a query from preferences
export function createQuery(preferences: RecommendationRequest): string {
  const parts = [];
  
  if (preferences.mood) {
    parts.push(`Mood: ${preferences.mood}`);
  }
  
  if (preferences.effects && preferences.effects.length > 0) {
    parts.push(`Effects: ${preferences.effects.join(', ')}`);
  }
  
  if (preferences.flavors && preferences.flavors.length > 0) {
    parts.push(`Flavors: ${preferences.flavors.join(', ')}`);
  }
  
  if (preferences.experienceLevel) {
    parts.push(`Experience: ${preferences.experienceLevel}`);
  }
  
  if (preferences.consumptionMethod && preferences.consumptionMethod.length > 0) {
    parts.push(`Consumption Method: ${preferences.consumptionMethod.join(', ')}`);
  }
  
  return parts.join('. ');
}
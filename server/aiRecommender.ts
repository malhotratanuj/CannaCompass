import OpenAI from 'openai';
import { Strain, RecommendationRequest } from '@shared/schema';
import { vectorDb, createQuery } from './vectorDb';
import { enhancedStrains } from './enhancedStrainData';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024
const OPENAI_MODEL = "gpt-4o";

// Interface for the recommendation result from AI
interface AIRecommendationResult {
  recommendations: string[]; // IDs of recommended strains
  reasons: { [strainId: string]: string }; // Reasons for each recommendation
}

export class AIRecommender {
  constructor() {
    console.log("AI Recommender initialized");
  }

  // Generate recommendations using OpenAI
  async getRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    try {
      console.log("Generating AI-enhanced recommendations");
      
      // Step 1: Use vector DB to retrieve relevant strains
      const query = createQuery(preferences);
      console.log(`Query for vector search: "${query}"`);
      const relevantStrains = await vectorDb.findSimilarStrains(query, 10);
      
      if (relevantStrains.length === 0) {
        console.log("No relevant strains found, returning default recommendations");
        return enhancedStrains.slice(0, 6); // Return first 6 as default
      }
      
      // Step 2: Use OpenAI to refine and explain the recommendations
      const aiRecommendations = await this.generateAIRecommendations(preferences, relevantStrains);
      
      // Step 3: Map the recommended strain IDs back to full strain objects
      return aiRecommendations;
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      // Fallback to simple filtering if AI fails
      return this.getFallbackRecommendations(preferences);
    }
  }

  // Generate AI recommendations using OpenAI
  private async generateAIRecommendations(
    preferences: RecommendationRequest, 
    candidateStrains: Strain[]
  ): Promise<Strain[]> {
    try {
      // Create the prompt for OpenAI
      const candidateDetailsStr = candidateStrains.map(strain => 
        `ID: ${strain.id}\nName: ${strain.name}\nType: ${strain.type}\nTHC: ${strain.thcContent}\nCBD: ${strain.cbdContent}\nEffects: ${strain.effects.join(', ')}\nFlavors: ${strain.flavors.join(', ')}`
      ).join('\n\n');
      
      // Construct user preferences string
      const preferencesStr = Object.entries(preferences)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '' && (Array.isArray(value) ? value.length > 0 : true))
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');

      // Create the conversation for OpenAI
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert cannabis strain recommender. Your task is to recommend the best cannabis strains based on user preferences. 
            You'll receive information about the user's preferences and a list of candidate strains. 
            Select the top strains (up to 6) that best match the user's preferences and provide a brief explanation for each recommendation.`
          },
          {
            role: "user",
            content: `Please recommend the best cannabis strains for me based on these preferences:
            
            ${preferencesStr}
            
            Choose from these candidate strains:
            
            ${candidateDetailsStr}
            
            Return your recommendations as a JSON object with this format:
            {
              "recommendations": ["strain_id1", "strain_id2", ...], 
              "reasons": {"strain_id1": "reason", "strain_id2": "reason", ...}
            }`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Parse the AI response
      const result = JSON.parse(response.choices[0].message.content) as AIRecommendationResult;
      console.log(`AI recommended ${result.recommendations.length} strains`);
      
      // Get the full strain objects for the recommended IDs
      const recommendedStrains = result.recommendations
        .map(id => {
          const strain = enhancedStrains.find(s => s.id === id);
          return strain;
        })
        .filter(Boolean) as Strain[]; // Filter out any undefined values
      
      // If we get fewer than 3 recommendations, add more from candidate strains
      if (recommendedStrains.length < 3) {
        const additionalStrains = candidateStrains
          .filter(strain => !recommendedStrains.some(s => s.id === strain.id))
          .slice(0, 6 - recommendedStrains.length);
        
        recommendedStrains.push(...additionalStrains);
      }
      
      return recommendedStrains.slice(0, 6); // Ensure we return at most 6
    } catch (error) {
      console.error("Error in OpenAI recommendation:", error);
      // Return candidate strains as fallback
      return candidateStrains.slice(0, 6);
    }
  }

  // Basic fallback recommendation logic
  private getFallbackRecommendations(preferences: RecommendationRequest): Strain[] {
    console.log("Using fallback recommendation logic");
    
    // Simple filtering based on preferences
    let filtered = [...enhancedStrains];
    
    // Filter by type if mood suggests a type preference
    if (preferences.mood) {
      if (['relaxed', 'sleepy'].includes(preferences.mood.toLowerCase())) {
        filtered = filtered.filter(strain => 
          strain.type.toLowerCase().includes('indica')
        );
      } else if (['energetic', 'creative', 'focused'].includes(preferences.mood.toLowerCase())) {
        filtered = filtered.filter(strain => 
          strain.type.toLowerCase().includes('sativa')
        );
      }
    }
    
    // Filter by THC content based on experience level
    if (preferences.experienceLevel === 'beginner') {
      filtered = filtered.filter(strain => {
        const match = strain.thcContent.match(/(\d+)-(\d+)/);
        if (match) {
          const maxThc = parseInt(match[2]);
          return maxThc < 20; // Lower THC for beginners
        }
        return true;
      });
    }
    
    // Sort by rating and return top results
    return filtered
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }
}

// Singleton instance
export const aiRecommender = new AIRecommender();
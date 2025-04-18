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
  perfect_match_score: { [strainId: string]: number }; // How well each strain matches (0-100)
  usage_tips: { [strainId: string]: string }; // Usage tips for each strain
  effects_explanation: { [strainId: string]: string }; // Detailed explanation of likely effects
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
            content: `You are an expert cannabis strain recommender with extensive knowledge about cannabis strains, their effects, optimal usage, and therapeutic applications. 
            Your task is to recommend the best cannabis strains based on user preferences.
            
            You'll analyze the user's preferences in detail, considering mood, desired effects, experience level, consumption method, time of day, and other contextual factors.
            
            For each recommendation, provide:
            1. A personalized explanation of why this strain matches the user's needs
            2. A match score (0-100) indicating how well this strain aligns with preferences
            3. Practical usage tips considering consumption method, dosage advice based on experience level, and optimal times/settings
            4. A detailed breakdown of the effects they're likely to experience, both physiological and psychological
            
            Your recommendations should be evidence-based, practical, and tailored to the individual's specific needs.`
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
              "reasons": {"strain_id1": "detailed explanation", "strain_id2": "detailed explanation", ...},
              "perfect_match_score": {"strain_id1": score, "strain_id2": score, ...},
              "usage_tips": {"strain_id1": "practical advice", "strain_id2": "practical advice", ...},
              "effects_explanation": {"strain_id1": "detailed effects breakdown", "strain_id2": "detailed effects breakdown", ...}
            }
            
            Limit to 5 recommendations, prioritizing quality matches over quantity. Score each strain honestly - not all strains will be perfect matches.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Parse the AI response
      const content = response.choices[0].message.content || '{"recommendations":[], "reasons":{}}';
      const result = JSON.parse(content) as AIRecommendationResult;
      console.log(`AI recommended ${result.recommendations.length} strains`);
      
      // Get the full strain objects for the recommended IDs and enhance them with AI data
      const recommendedStrains = result.recommendations
        .map(id => {
          // Find the strain object
          const strain = enhancedStrains.find(s => s.id === id);
          
          if (!strain) return null;
          
          // Clone the strain object to avoid modifying the original data
          const enhancedStrain = { ...strain };
          
          // Add the AI-generated recommendation information
          if (result.reasons && result.reasons[id]) {
            enhancedStrain.matchReason = result.reasons[id];
          }
          
          if (result.perfect_match_score && result.perfect_match_score[id] !== undefined) {
            enhancedStrain.matchScore = result.perfect_match_score[id];
          }
          
          if (result.usage_tips && result.usage_tips[id]) {
            enhancedStrain.usageTips = result.usage_tips[id];
          }
          
          if (result.effects_explanation && result.effects_explanation[id]) {
            enhancedStrain.effectsExplanation = result.effects_explanation[id];
          }
          
          return enhancedStrain;
        })
        .filter(Boolean) as Strain[]; // Filter out any undefined values
      
      // Log the enhanced recommendations
      console.log(`Created ${recommendedStrains.length} enhanced recommendations with AI insights`);
      
      // If we get fewer than 3 recommendations, add more from candidate strains
      if (recommendedStrains.length < 3) {
        console.log(`Adding ${3 - recommendedStrains.length} additional strains to meet minimum count`);
        
        const additionalStrains = candidateStrains
          .filter(strain => !recommendedStrains.some(s => s.id === strain.id))
          .slice(0, 3 - recommendedStrains.length);
        
        // For these additional strains, add basic recommendation info
        additionalStrains.forEach(strain => {
          // Add basic match information since these weren't selected by the AI
          strain.matchReason = "Added based on general compatibility with your preferences";
          strain.matchScore = 50; // Medium match score
          strain.usageTips = `Start with a low dose of this ${strain.type.toLowerCase()} strain, especially if you're new to cannabis.`;
          strain.effectsExplanation = `You can expect typical ${strain.type.toLowerCase()} effects including ${strain.effects.join(', ')}.`;
        });
        
        recommendedStrains.push(...additionalStrains);
      }
      
      // Sort by match score (if available)
      const sortedStrains = recommendedStrains.sort((a, b) => {
        // Sort by matchScore if both have it
        if (a.matchScore !== undefined && b.matchScore !== undefined) {
          return b.matchScore - a.matchScore;
        }
        // If only one has a matchScore, prioritize that one
        if (a.matchScore !== undefined) return -1;
        if (b.matchScore !== undefined) return 1;
        // Otherwise sort by rating
        return b.rating - a.rating;
      });
      
      // Return top results (maximum 5)
      return sortedStrains.slice(0, 5);
    } catch (error) {
      console.error("Error in OpenAI recommendation:", error);
      // Use our enhanced fallback system instead of just returning candidate strains
      return this.getFallbackRecommendations(preferences);
    }
  }

  // Enhanced fallback recommendation logic with basic explanations
  private getFallbackRecommendations(preferences: RecommendationRequest): Strain[] {
    console.log("Using enhanced fallback recommendation logic");
    
    // Simple filtering based on preferences
    let filtered = [...enhancedStrains];
    let strainTypeContext = "balanced";
    
    // Filter by type if mood suggests a type preference
    if (preferences.mood) {
      if (['relaxed', 'sleepy'].includes(preferences.mood.toLowerCase())) {
        filtered = filtered.filter(strain => 
          strain.type.toLowerCase().includes('indica')
        );
        strainTypeContext = "relaxing indica";
      } else if (['energetic', 'creative', 'focused'].includes(preferences.mood.toLowerCase())) {
        filtered = filtered.filter(strain => 
          strain.type.toLowerCase().includes('sativa')
        );
        strainTypeContext = "energizing sativa";
      } else if (preferences.mood.toLowerCase() === 'balanced') {
        filtered = filtered.filter(strain => 
          strain.type.toLowerCase().includes('hybrid')
        );
        strainTypeContext = "balanced hybrid";
      }
    }
    
    // Filter by THC content based on experience level
    let experienceLevelContext = "moderate";
    if (preferences.experienceLevel) {
      if (preferences.experienceLevel === 'beginner') {
        filtered = filtered.filter(strain => {
          const match = strain.thcContent.match(/(\d+)-(\d+)/);
          if (match) {
            const maxThc = parseInt(match[2]);
            return maxThc < 20; // Lower THC for beginners
          }
          return true;
        });
        experienceLevelContext = "mild, beginner-friendly";
      } else if (preferences.experienceLevel === 'experienced') {
        experienceLevelContext = "potent, for experienced users";
      }
    }
    
    // Sort by rating and get top results
    const topStrains = filtered
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
    
    // Add basic recommendation information for each strain
    return topStrains.map((strain, index) => {
      // Clone the strain to avoid modifying original
      const enhancedStrain = { ...strain };
      
      // Generate a match score based on position in results (higher for earlier results)
      const baseScore = 90 - (index * 10); // 90, 80, 70, 60, 50
      enhancedStrain.matchScore = Math.max(50, Math.min(90, baseScore));
      
      // Generate a basic match reason
      const effectsList = strain.effects.slice(0, 2).join(' and ');
      enhancedStrain.matchReason = `This ${strain.type} strain offers ${effectsList} effects that align with your ${preferences.mood || 'desired'} mood preference. With ${strain.thcContent} THC content, it's suitable for ${preferences.experienceLevel || 'intermediate'} users.`;
      
      // Generate basic usage tips
      enhancedStrain.usageTips = `For best results with ${strain.name}, start with a small amount and gradually increase as needed. This ${strainTypeContext} strain works well ${this.getTimeOfDayRecommendation(strain)}. Consider ${this.getConsumptionMethodTip(preferences, strain)}.`;
      
      // Generate effects explanation
      enhancedStrain.effectsExplanation = `${strain.name} typically provides ${experienceLevelContext} effects including ${strain.effects.join(', ')}. The dominant terpenes (${strain.terpenes.join(', ')}) contribute to its ${strain.flavors.join(', ')} flavor profile and enhance its therapeutic properties.`;
      
      return enhancedStrain;
    });
  }
  
  // Helper method to suggest time of day
  private getTimeOfDayRecommendation(strain: Strain): string {
    const type = strain.type.toLowerCase();
    if (type.includes('indica')) {
      return 'in the evening or before bed';
    } else if (type.includes('sativa')) {
      return 'in the morning or early afternoon';
    } else {
      return 'throughout the day';
    }
  }
  
  // Helper method to suggest consumption method
  private getConsumptionMethodTip(preferences: RecommendationRequest, strain: Strain): string {
    if (preferences.consumptionMethod && preferences.consumptionMethod.length > 0) {
      const method = preferences.consumptionMethod[0];
      
      const methodTips: Record<string, string> = {
        'Smoking': `smoking this strain in a joint or pipe for immediate effects`,
        'Vaping': `vaping at a medium temperature to preserve the ${strain.terpenes[0]} terpenes`,
        'Edibles': `using edibles for longer-lasting but delayed effects`,
        'Tinctures': `using tinctures for precise dosing and faster onset than edibles`,
        'Topicals': `using topicals for localized relief without psychoactive effects`
      };
      
      return methodTips[method] || `using your preferred consumption method`;
    }
    
    // Default suggestion based on strain type
    const type = strain.type.toLowerCase();
    if (type.includes('indica')) {
      return 'using a vaporizer to enjoy the full flavor profile';
    } else if (type.includes('sativa')) {
      return 'consuming in smaller doses to maintain focus and avoid anxiety';
    } else {
      return 'experimenting with different consumption methods to find your ideal experience';
    }
  }
}

// Singleton instance
export const aiRecommender = new AIRecommender();
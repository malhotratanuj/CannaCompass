import OpenAI from 'openai';
import { Strain, RecommendationRequest } from '@shared/schema';
import { vectorDb, createQuery } from './vectorDb';
import { enhancedStrains } from './enhancedStrainData';
import { anthropicRecommender } from './anthropic';
import { topCanadianStrains, initializeTopCanadianStrains, scheduleStrainUpdates } from './canadianStrains';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024
const OPENAI_MODEL = "gpt-4o";

// Flag to use Anthropic instead of OpenAI when available
// Set to false to prioritize OpenAI even if Anthropic is available
const USE_ANTHROPIC = false;

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

  // Generate recommendations using OpenAI with top Canadian strains prioritized
  async getRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
    try {
      console.log("Generating AI-enhanced recommendations with Canadian strain priority");
      
      // Ensure top Canadian strains are initialized
      if (topCanadianStrains.length === 0) {
        initializeTopCanadianStrains();
      }
      
      // Step 1: Get potentially relevant strains from both sources
      // First prioritize top Canadian strains
      let candidateStrains: Strain[] = [...topCanadianStrains];
      
      // Then add other relevant strains from vector search
      const query = createQuery(preferences);
      console.log(`Query for vector search: "${query}"`);
      const vectorRelevantStrains = await vectorDb.findSimilarStrains(query, 15);
      
      // Add strains that aren't already in the candidate list
      const existingIds = new Set(candidateStrains.map(strain => strain.id));
      vectorRelevantStrains.forEach(strain => {
        if (!existingIds.has(strain.id)) {
          candidateStrains.push(strain);
          existingIds.add(strain.id);
        }
      });
      
      // If we still don't have enough candidates, add more from enhanced strains
      if (candidateStrains.length < 15) {
        const additionalStrains = enhancedStrains
          .filter(strain => !existingIds.has(strain.id))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 15 - candidateStrains.length);
        
        candidateStrains = [...candidateStrains, ...additionalStrains];
      }
      
      console.log(`Using ${candidateStrains.length} candidate strains (including ${topCanadianStrains.length} top Canadian strains)`);
      
      if (candidateStrains.length === 0) {
        console.log("No relevant strains found, returning default recommendations");
        return enhancedStrains.slice(0, 6); // Return first 6 as default
      }
      
      // Step 2: Use OpenAI or Anthropic to refine and explain the recommendations
      const aiRecommendations = await this.generateAIRecommendations(preferences, candidateStrains);
      
      // Step 3: Return the refined recommendations
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
      // Choose between Anthropic and OpenAI for recommendations
      if (USE_ANTHROPIC) {
        console.log("Using Anthropic Claude for enhanced recommendations");
        return this.generateAnthropicRecommendations(preferences, candidateStrains);
      } else {
        console.log("Using OpenAI for recommendations");
        return this.generateOpenAIRecommendations(preferences, candidateStrains);
      }
    } catch (error) {
      console.error("Error in AI recommendation:", error);
      // Use our enhanced fallback system instead
      return this.getFallbackRecommendations(preferences);
    }
  }

  private async generateAnthropicRecommendations(
    preferences: RecommendationRequest,
    candidateStrains: Strain[]
  ): Promise<Strain[]> {
    try {
      console.log("Generating recommendations with Claude");
      
      // Process each candidate strain with Anthropic for personalized insights
      const enhancedStrainsPromises = candidateStrains.slice(0, 5).map(async (strain) => {
        try {
          // Get enhanced recommendation from Anthropic
          const enhancement = await anthropicRecommender.getEnhancedRecommendation(
            {
              mood: preferences.mood || "relaxed",
              experienceLevel: preferences.experienceLevel || "intermediate",
              effects: preferences.effects || [],
              flavors: preferences.flavors || [],
              consumptionMethod: preferences.consumptionMethod ? preferences.consumptionMethod.join(', ') : undefined,
              timeOfDay: undefined, // Not in our schema yet
              medicalConditions: []  // Not in our schema yet
            },
            strain
          );
          
          // Create an enhanced strain with Claude insights
          return {
            ...strain,
            matchScore: enhancement.matchScore,
            matchReason: enhancement.matchReason,
            usageTips: enhancement.usageTips,
            effectsExplanation: enhancement.effectsExplanation
          };
        } catch (error) {
          console.error(`Error enhancing strain ${strain.name} with Anthropic:`, error);
          // Return basic enhancement if Claude enhancement fails
          return {
            ...strain,
            matchScore: 50,
            matchReason: `${strain.name} is a ${strain.type} strain that may provide ${strain.effects.slice(0, 2).join(' and ')} effects.`,
            usageTips: `Start with a small amount of ${strain.name} and gradually increase as needed.`,
            effectsExplanation: `${strain.name} typically provides effects including ${strain.effects.join(', ')}.`
          };
        }
      });
      
      // Wait for all enhancements to complete
      const enhancedStrains = await Promise.all(enhancedStrainsPromises);
      
      // Sort by match score
      return enhancedStrains.sort((a, b) => {
        if (a.matchScore !== undefined && b.matchScore !== undefined) {
          return b.matchScore - a.matchScore;
        }
        return b.rating - a.rating;
      });
    } catch (error) {
      console.error("Error using Anthropic for recommendations:", error);
      // Fall back to OpenAI if Anthropic fails completely
      return this.generateOpenAIRecommendations(preferences, candidateStrains);
    }
  }

  private async generateOpenAIRecommendations(
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
    console.log(`Initial strain count: ${enhancedStrains.length}`);
    
    try {
      // Simple filtering based on preferences
      let filtered = [...enhancedStrains];
      let strainTypeContext = "balanced";
      
      // Filter by type if mood suggests a type preference
      if (preferences.mood) {
        console.log(`Filtering by mood: ${preferences.mood}`);
        
        if (['relaxed', 'sleepy'].includes(preferences.mood.toLowerCase())) {
          console.log("Filtering for indica strains");
          filtered = filtered.filter(strain => 
            strain.type.toLowerCase().includes('indica')
          );
          strainTypeContext = "relaxing indica";
          console.log(`After indica filter: ${filtered.length} strains`);
        } else if (['energetic', 'creative', 'focused'].includes(preferences.mood.toLowerCase())) {
          console.log("Filtering for sativa strains");
          filtered = filtered.filter(strain => 
            strain.type.toLowerCase().includes('sativa')
          );
          strainTypeContext = "energizing sativa";
          console.log(`After sativa filter: ${filtered.length} strains`);
        } else if (preferences.mood.toLowerCase() === 'balanced') {
          console.log("Filtering for hybrid strains");
          filtered = filtered.filter(strain => 
            strain.type.toLowerCase().includes('hybrid')
          );
          strainTypeContext = "balanced hybrid";
          console.log(`After hybrid filter: ${filtered.length} strains`);
        } else {
          console.log(`No specific strain type for mood: ${preferences.mood}`);
        }
      } else {
        console.log("No mood specified");
      }
      
      // Apply effects filter if specified
      if (preferences.effects && preferences.effects.length > 0) {
        console.log(`Filtering by effects: ${preferences.effects.join(', ')}`);
        const prevCount = filtered.length;
        
        // Use a more lenient filter - match any of the requested effects
        filtered = filtered.filter(strain => 
          preferences.effects!.some(effect => 
            strain.effects.some(strainEffect => 
              strainEffect.toLowerCase().includes(effect.toLowerCase())
            )
          )
        );
        
        console.log(`After effects filter: ${filtered.length} strains (from ${prevCount})`);
        
        // If no strains match all requested effects, be more lenient
        if (filtered.length === 0) {
          console.log("No strains match all requested effects, using more lenient matching");
          filtered = [...enhancedStrains];
        }
      }
      
      // Apply flavors filter if specified
      if (preferences.flavors && preferences.flavors.length > 0) {
        console.log(`Filtering by flavors: ${preferences.flavors.join(', ')}`);
        const prevCount = filtered.length;
        
        // Use a more lenient filter - match any of the requested flavors
        const filteredByFlavor = filtered.filter(strain => 
          preferences.flavors!.some(flavor => 
            strain.flavors.some(strainFlavor => 
              strainFlavor.toLowerCase().includes(flavor.toLowerCase())
            )
          )
        );
        
        // Only apply flavor filter if it doesn't eliminate all options
        if (filteredByFlavor.length > 0) {
          filtered = filteredByFlavor;
        } else {
          console.log(`Flavor filter would eliminate all options (${filtered.length} to 0), ignoring flavor filter`);
        }
        
        console.log(`After flavor filter: ${filtered.length} strains (from ${prevCount})`);
      }
      
      // Filter by THC content based on experience level
      let experienceLevelContext = "moderate";
      if (preferences.experienceLevel) {
        console.log(`Filtering by experience level: ${preferences.experienceLevel}`);
        
        if (preferences.experienceLevel === 'beginner') {
          const prevCount = filtered.length;
          const filteredByExperience = filtered.filter(strain => {
            const match = strain.thcContent.match(/(\d+)-(\d+)/);
            if (match) {
              const maxThc = parseInt(match[2]);
              return maxThc < 20; // Lower THC for beginners
            }
            return true;
          });
          
          // Only apply this filter if it doesn't eliminate all options
          if (filteredByExperience.length > 0) {
            filtered = filteredByExperience;
          } else {
            console.log(`Experience level filter would eliminate all options (${filtered.length} to 0), ignoring`);
          }
          
          experienceLevelContext = "mild, beginner-friendly";
          console.log(`After beginner filter: ${filtered.length} strains (from ${prevCount})`);
        } else if (preferences.experienceLevel === 'experienced') {
          experienceLevelContext = "potent, for experienced users";
        }
      }
      
      // Sort by rating and get top results
      let topStrains = filtered
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      
      console.log(`After all filters, found ${topStrains.length} top strains`);
      
      // If no strains matched all filters, return a few default strains
      if (topStrains.length === 0) {
        console.log("No matching strains after all filters, using default recommendations");
        // Just get the top rated strains without filtering
        return enhancedStrains
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
          .map((strain, index) => {
            const enhancedStrain = { ...strain };
            enhancedStrain.matchScore = 70 - (index * 5);
            enhancedStrain.matchReason = `This is a popular ${strain.type} strain with high ratings from users.`;
            enhancedStrain.usageTips = `Start with a small amount and adjust based on your experience.`;
            enhancedStrain.effectsExplanation = `Known for ${strain.effects.join(', ')} effects with a ${strain.flavors.join(', ')} flavor profile.`;
            return enhancedStrain;
          });
      }
      
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
    } catch (error) {
      console.error("Error in fallback recommendation system:", error);
      // Ultimate fallback - just return the top 5 strains with basic info
      return enhancedStrains
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)
        .map((strain, index) => {
          const enhancedStrain = { ...strain };
          enhancedStrain.matchScore = 70 - (index * 5);
          enhancedStrain.matchReason = `${strain.name} is a popular ${strain.type.toLowerCase()} strain with good overall ratings.`;
          enhancedStrain.usageTips = `Start with a small amount and adjust based on your experience.`;
          enhancedStrain.effectsExplanation = `Known for ${strain.effects.join(', ')} effects.`;
          return enhancedStrain;
        });
    }
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
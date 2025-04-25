import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * An advanced recommender that leverages Anthropic Claude for detailed strain recommendations
 */
class AnthropicRecommender {
  /**
   * Gets enhanced recommendations for a cannabis strain based on user preferences
   * @param query User's preferences for recommendation
   * @param strainDetails Basic strain data to enhance
   * @returns Enhanced strain details with personalized recommendations
   */
  async getEnhancedRecommendation(
    query: {
      mood: string;
      experienceLevel: string;
      effects: string[];
      flavors: string[];
      consumptionMethod?: string;
      timeOfDay?: string;
      medicalConditions: string[];
    },
    strainDetails: {
      id: string;
      name: string;
      type: string;
      thcContent: string;
      cbdContent: string;
      terpenes: string[];
      effects: string[];
      flavors: string[];
    }
  ) {
    try {
      // Format the query into a comprehensive prompt for Claude
      const prompt = this.createPrompt(query, strainDetails);

      // Call Claude to get detailed insights
      const message = await anthropic.messages.create({
        max_tokens: 1024,
        model: 'claude-3-7-sonnet-20250219',
        system: "You are a Cannabis Medical Expert AI advisor. Provide detailed, science-based information about cannabis strains, focusing on medical applications, effects, and consumption guidance. Be informative but responsible, noting that cannabis affects individuals differently and mentioning potential side effects. Avoid recreational terminology. Structure your responses as JSON containing matchScore, matchReason, usageTips, and effectsExplanation.",
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      // Parse the response as JSON
      const textContent = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const enhancedData = JSON.parse(textContent);
      
      return {
        matchScore: enhancedData.matchScore,
        matchReason: enhancedData.matchReason,
        usageTips: enhancedData.usageTips,
        effectsExplanation: enhancedData.effectsExplanation,
      };
    } catch (error) {
      console.error("Error generating enhanced recommendation with Anthropic:", error);
      // Return a fallback recommendation if Claude fails
      return this.createFallbackRecommendation(query, strainDetails);
    }
  }

  /**
   * Generates a detailed strain analysis and personalized recommendations for a user
   * @param strainName Name of the strain to analyze
   * @param strainData Basic strain data
   * @returns Detailed analysis and personalized recommendations
   */
  async getDetailedStrainAnalysis(strainName: string, strainData: any) {
    try {
      const prompt = `Provide a detailed analysis of the cannabis strain "${strainName}" with the following characteristics:
      - Type: ${strainData.type}
      - THC Content: ${strainData.thcContent}
      - CBD Content: ${strainData.cbdContent}
      - Terpenes: ${strainData.terpenes.join(', ')}
      - Effects: ${strainData.effects.join(', ')}
      - Flavors: ${strainData.flavors.join(', ')}
      
      Please include:
      1. A detailed breakdown of the strain's cannabinoid profile and potential effects
      2. The entourage effect of the specific terpene profile
      3. Potential medical applications
      4. Recommended consumption methods
      5. Potential side effects to be aware of
      
      Format your answer as a JSON object with the following keys:
      - cannabinoidAnalysis
      - terpeneProfile
      - medicalApplications
      - recommendedConsumptionMethods
      - potentialSideEffects
      - expertInsights`;

      const message = await anthropic.messages.create({
        max_tokens: 1500,
        model: 'claude-3-7-sonnet-20250219',
        system: "You are a Cannabis Medical Expert AI advisor. Provide detailed, science-based information about cannabis strains, focusing on medical applications, effects, and consumption guidance. Be informative but responsible, noting that cannabis affects individuals differently and mentioning potential side effects. Avoid recreational terminology.",
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      // Parse the response
      const textContent = message.content[0].type === 'text' ? message.content[0].text : '{}';
      return JSON.parse(textContent);
    } catch (error) {
      console.error("Error generating detailed strain analysis with Anthropic:", error);
      return {
        cannabinoidAnalysis: `${strainData.name} contains ${strainData.thcContent} THC and ${strainData.cbdContent} CBD, which may produce various effects.`,
        terpeneProfile: `Contains ${strainData.terpenes.join(', ')}, contributing to its unique aroma and effects.`,
        medicalApplications: `May be used for conditions related to ${strainData.effects.join(', ')}.`,
        recommendedConsumptionMethods: "Start with a low dose, especially for beginners. Methods vary based on personal preference.",
        potentialSideEffects: "May include dry mouth, dry eyes, and potential anxiety with high THC strains.",
        expertInsights: `${strainData.name} is a ${strainData.type} strain known for ${strainData.effects.slice(0, 2).join(' and ')} effects.`
      };
    }
  }

  /**
   * Creates a comprehensive prompt for Claude based on user preferences and strain details
   */
  private createPrompt(query: any, strainDetails: any): string {
    // Current time of day for contextual recommendations
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = query.timeOfDay || 
      (hour < 12 ? "morning" : 
       hour < 17 ? "afternoon" : 
       hour < 21 ? "evening" : "night");

    return `I need a personalized cannabis recommendation for a user with the following preferences:
      - Mood/desired effect: ${query.mood}
      - Experience level: ${query.experienceLevel}
      - Specific effects desired: ${query.effects ? query.effects.join(', ') : 'N/A'}
      - Preferred flavors: ${query.flavors ? query.flavors.join(', ') : 'N/A'}
      - Preferred consumption method: ${query.consumptionMethod || 'N/A'}
      - Time of day for use: ${timeOfDay}
      - Medical conditions (if any): ${query.medicalConditions ? query.medicalConditions.join(', ') : 'N/A'}

      I'm considering recommending the strain "${strainDetails.name}" with these characteristics:
      - Type: ${strainDetails.type}
      - THC Content: ${strainDetails.thcContent}
      - CBD Content: ${strainDetails.cbdContent}
      - Known effects: ${strainDetails.effects.join(', ')}
      - Terpene profile: ${strainDetails.terpenes.join(', ')}
      - Flavor profile: ${strainDetails.flavors.join(', ')}

      Please provide a recommendation in JSON format with these fields:
      - matchScore: A number between 0-100 indicating how well this strain matches the user's preferences
      - matchReason: A short paragraph explaining why this strain may be suitable for the user's preferences
      - usageTips: Practical advice for using this strain based on the user's experience level and preferences
      - effectsExplanation: A detailed explanation of the expected effects based on the strain's profile

      For the matchScore, consider the alignment between the user's preferences and the strain's characteristics, 
      with higher scores for better matches.`;
  }

  /**
   * Creates a fallback recommendation when Claude is unavailable
   */
  private createFallbackRecommendation(query: any, strainDetails: any) {
    // Basic time-aware recommendation
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = query.timeOfDay || 
      (hour < 12 ? "morning" : 
      hour < 17 ? "afternoon" : 
      hour < 21 ? "evening" : "night");
    
    let timeBasedTip = "";
    if (strainDetails.type.toLowerCase().includes('indica')) {
      timeBasedTip = `This indica strain is typically better for evening or nighttime use due to its relaxing properties.`;
    } else if (strainDetails.type.toLowerCase().includes('sativa')) {
      timeBasedTip = `This sativa strain is typically better for daytime use due to its energizing properties.`;
    } else {
      timeBasedTip = `This hybrid strain can be used throughout the day, depending on your specific needs.`;
    }

    // Experience level advice
    let experienceLevelTip = "";
    if (query.experienceLevel === "beginner") {
      experienceLevelTip = "As a beginner, start with a very small amount and wait at least 15-30 minutes before considering more. Consider using a method with controllable dosing like a vaporizer.";
    } else if (query.experienceLevel === "intermediate") {
      experienceLevelTip = "With your intermediate experience, you likely understand your tolerance, but still exercise caution with this particular strain as effects can vary.";
    } else {
      experienceLevelTip = "With your veteran background, you'll likely appreciate the nuanced effects of this strain, but still start with a standard dose to assess its specific impact on you.";
    }

    // Calculate a basic match score
    let matchScore = 50; // Base score
    
    // Check for type match
    const moodTypeMap: Record<string, string[]> = {
      "relaxed": ["indica", "indica-dominant"],
      "sleepy": ["indica", "indica-dominant"],
      "energetic": ["sativa", "sativa-dominant"],
      "creative": ["sativa", "sativa-dominant"],
      "focused": ["hybrid", "sativa-dominant"],
      "happy": ["hybrid", "sativa-dominant"]
    };
    
    const preferredTypes = moodTypeMap[query.mood?.toLowerCase() || ""] || [];
    if (preferredTypes.some(t => strainDetails.type.toLowerCase().includes(t))) {
      matchScore += 20;
    }
    
    // Check for effects match
    if (query.effects && query.effects.length > 0) {
      const effectMatch = query.effects.filter((effect: string) => 
        strainDetails.effects.some((e: string) => e.toLowerCase().includes(effect.toLowerCase()))
      ).length;
      matchScore += Math.min(15, effectMatch * 5);
    }
    
    // Check for flavor match
    if (query.flavors && query.flavors.length > 0) {
      const flavorMatch = query.flavors.filter((flavor: string) => 
        strainDetails.flavors.some((f: string) => f.toLowerCase().includes(flavor.toLowerCase()))
      ).length;
      matchScore += Math.min(15, flavorMatch * 5);
    }
    
    // Cap the score at 100
    matchScore = Math.min(100, matchScore);

    return {
      matchScore: matchScore,
      matchReason: `${strainDetails.name} is a ${strainDetails.type} strain that may provide ${strainDetails.effects.slice(0, 2).join(' and ')} effects, which aligns with your ${query.mood || "desired"} mood preference. With ${strainDetails.thcContent} THC content, it's suitable for ${query.experienceLevel || "intermediate"} users.`,
      usageTips: `For best results with ${strainDetails.name}, start with a small amount and gradually increase as needed. ${timeBasedTip} ${experienceLevelTip}`,
      effectsExplanation: `${strainDetails.name} typically provides effects including ${strainDetails.effects.join(', ')}. The dominant terpenes (${strainDetails.terpenes.join(', ')}) contribute to its ${strainDetails.flavors.join(', ')} flavor profile and enhance its therapeutic properties.`
    };
  }
}

export const anthropicRecommender = new AnthropicRecommender();
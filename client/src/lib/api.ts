import { apiRequest } from "./queryClient";
import { Strain, Dispensary, RecommendationRequest, UserLocation } from "@shared/schema";

export async function getStrainRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
  try {
    console.log('Getting strain recommendations with preferences:', preferences);
    const response = await apiRequest("POST", "/api/recommendations", preferences);
    
    if (!response.ok) {
      console.error(`Recommendations API returned status ${response.status}: ${response.statusText}`);
      return []; // Return empty array on error
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("Failed to parse JSON from recommendations API:", jsonError);
      return []; // Return empty array if JSON parsing fails
    }
    
    console.log('Recommendations API response:', data);
    
    // Server returns the array directly, not inside a recommendations object
    if (Array.isArray(data)) {
      console.log(`Received ${data.length} recommendations directly as array`);
      return data;
    }
    
    // Fallback for the case where server returns { recommendations: [...] }
    if (data && data.recommendations && Array.isArray(data.recommendations)) {
      console.log(`Received ${data.recommendations.length} recommendations in recommendations property`);
      return data.recommendations;
    }
    
    // If no valid data format is found, return empty array to avoid undefined errors
    console.error("Invalid response format from recommendations API:", data);
    return [];
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return []; // Always return an array, never undefined
  }
}

export async function getStrainById(id: string): Promise<Strain> {
  const response = await apiRequest("GET", `/api/strains/${id}`);
  const data = await response.json();
  return data.strain;
}

export async function getAllStrains(): Promise<Strain[]> {
  const response = await apiRequest("GET", "/api/strains");
  const data = await response.json();
  return data.strains;
}

export async function findNearbyDispensaries(
  location: UserLocation, 
  radius: number = 10,
  strainIds: string[] = []
): Promise<Dispensary[]> {
  console.log('Making API call to findNearbyDispensaries:', { location, radius, strainIds });
  try {
    const response = await apiRequest("POST", "/api/dispensaries/nearby", {
      location,
      radius,
      strainIds,
    });
    const data = await response.json();
    console.log('API response received:', data);
    
    if (!data.dispensaries || !Array.isArray(data.dispensaries)) {
      console.error('Invalid response format, dispensaries is not an array:', data);
      return [];
    }
    
    return data.dispensaries;
  } catch (error) {
    console.error('Error in findNearbyDispensaries:', error);
    throw error;
  }
}

// Function to find nearby dispensaries using static data (fallback)
export async function findNearbyDispensariesStatic(
  location: UserLocation, 
  radius: number = 10
): Promise<Dispensary[]> {
  const response = await apiRequest("POST", "/api/dispensaries/static", {
    location,
    radius,
  });
  const data = await response.json();
  return data.dispensaries;
}

export async function getDispensaryById(id: string): Promise<Dispensary> {
  const response = await apiRequest("GET", `/api/dispensaries/${id}`);
  const data = await response.json();
  return data.dispensary;
}

export async function saveUserPreferences(preferences: RecommendationRequest): Promise<void> {
  await apiRequest("POST", "/api/preferences", preferences);
}

export async function getUserPreferences(): Promise<RecommendationRequest | null> {
  try {
    const response = await apiRequest("GET", "/api/preferences");
    const data = await response.json();
    return data.preferences;
  } catch (error) {
    return null;
  }
}

export async function saveStrain(strainId: string): Promise<void> {
  await apiRequest("POST", "/api/strains/save", { strainId });
}

export async function removeSavedStrain(strainId: string): Promise<void> {
  await apiRequest("DELETE", `/api/strains/save/${strainId}`);
}

export async function getSavedStrains(): Promise<string[]> {
  const response = await apiRequest("GET", "/api/strains/saved");
  const data = await response.json();
  return data.savedStrains.map((s: any) => s.strainId);
}

// Helper function to get user's current location
export function getCurrentLocation(): Promise<UserLocation> {
  console.log('Getting current location from browser...');
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('Successfully obtained location:', location);
        resolve(location);
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        // Fall back to a default location to keep the app working
        console.log('Falling back to default Denver location');
        resolve({
          latitude: 39.7392,
          longitude: -104.9903,
          address: "Denver, CO (Default location)"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

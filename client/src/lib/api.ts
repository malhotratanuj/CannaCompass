import { apiRequest } from "./queryClient";
import { Strain, Dispensary, RecommendationRequest, UserLocation } from "@shared/schema";

export async function getStrainRecommendations(preferences: RecommendationRequest): Promise<Strain[]> {
  const response = await apiRequest("POST", "/api/recommendations", preferences);
  const data = await response.json();
  return data.recommendations;
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
  const response = await apiRequest("POST", "/api/dispensaries/nearby", {
    ...location,
    radius,
    strainIds,
  });
  const data = await response.json();
  return data.dispensaries;
}

// Function to find nearby dispensaries using static data (fallback)
export async function findNearbyDispensariesStatic(
  location: UserLocation, 
  radius: number = 10
): Promise<Dispensary[]> {
  const response = await apiRequest("POST", "/api/dispensaries/static", {
    ...location,
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
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

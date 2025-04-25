import { Dispensary, UserLocation } from '@shared/schema';
import { googlePlacesService } from './googlePlacesService';
import { storage } from './storage';

/**
 * Adapter that connects our app's storage interface with the Google Places API
 */
export class GooglePlacesStorageAdapter {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Check if Google Places API is configured and available
   */
  private initialize(): void {
    this.isInitialized = googlePlacesService.isAvailable();
    if (this.isInitialized) {
      console.log('Google Places API initialized successfully');
    } else {
      console.log('Google Places API not available - using static dispensary data');
    }
  }

  /**
   * Find nearby dispensaries using Google Places API with fallback to static data
   */
  public async findNearbyDispensaries(
    location: UserLocation, 
    radius: number = 10,
    strainIds: string[] = []
  ): Promise<Dispensary[]> {
    try {
      console.log(`Using Google Places API to search for dispensaries near: ${location.address || `${location.latitude},${location.longitude}`}`);

      // Use googlePlacesService directly
      if (!googlePlacesService.isAvailable()) {
        console.error("Google Places API is not configured properly");
        return Promise.resolve([]);
      }

      // First, try to get coordinates if we only have an address
      let lat = location.latitude;
      let lng = location.longitude;

      // Canadian postal code pattern - always try to geocode these for accuracy
      const isCanadianPostalCode = location.address && /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i.test(location.address.trim());

      // If we have an address but no coordinates, or if it's a Canadian postal code
      // (even if we have coordinates, postal code geocoding is more accurate)
      if (location.address && (isCanadianPostalCode || !lat || !lng)) {
        try {
          const coordinates = await googlePlacesService.geocodeAddress(location.address);
          lat = coordinates.lat;
          lng = coordinates.lng;
          console.log(`Successfully geocoded address to: ${lat}, ${lng}`);
        } catch (error) {
          console.error("Error geocoding address:", error);
          return Promise.resolve([]);
        }
      }

      if (!lat || !lng) {
        console.error("Could not determine location coordinates");
        return Promise.resolve([]);
      }

      // Get dispensaries from Google Places API - no need to specify keyword 
      // as our enhanced implementation now does multiple searches with different keywords
      console.log("Finding nearby dispensaries using dynamic store finder...");
      const dispensaries = await googlePlacesService.findNearbyDispensaries(lat, lng, {
        radius: radius * 1000 // Convert km to meters
      });

      // If we have strain IDs, we need to enhance dispensaries with inventory data
      if (strainIds && strainIds.length > 0) {
        // First get our app's built-in dispensary data for inventory information
        const staticDispensaries = await storage.findNearbyDispensaries(location, radius);

        // Create a map of static dispensary inventory for quick lookup
        const staticInventoryMap = new Map<string, Dispensary>();
        staticDispensaries.forEach(d => {
          staticInventoryMap.set(d.name.toLowerCase(), d);
        });

        // Try to match Google dispensaries with our static data based on name similarity
        for (const dispensary of dispensaries) {
          // Look for a name match to find inventory data
          const nameKey = dispensary.name.toLowerCase();
          const matchedStatic = staticInventoryMap.get(nameKey) || 
                               Array.from(staticInventoryMap.values()).find(d => 
                                 d.name.toLowerCase().includes(nameKey) || 
                                 nameKey.includes(d.name.toLowerCase())
                               );

          if (matchedStatic) {
            // Filter inventory to only include requested strains
            const filteredInventory = matchedStatic.inventory.filter(item => 
              !strainIds.length || strainIds.includes(item.strainId)
            );

            // Add inventory data to Google Places dispensary
            dispensary.inventory = filteredInventory;
          } else {
            // For dispensaries without a match, we'll indicate strain availability is unknown
            dispensary.inventory = [];
          }
        }
      }

      return dispensaries;
    } catch (error) {
      console.error('Error finding dispensaries with Google Places:', error);
      // Fall back to static data on error
      console.log('Falling back to static dispensary data due to error');
      return storage.findNearbyDispensaries(location, radius);
    }
  }

  /**
   * Get a dispensary by ID with Google Places API (with fallback)
   */
  public async getDispensaryById(dispensaryId: string): Promise<Dispensary | undefined> {
    try {
      if (!this.isInitialized) {
        return storage.getDispensaryById(dispensaryId);
      }

      // Try to determine if this is a Google Places ID
      const isGooglePlaceId = dispensaryId.startsWith('ChI') || dispensaryId.length > 20;

      if (isGooglePlaceId) {
        return await googlePlacesService.getDispensaryDetails(dispensaryId);
      } else {
        // If it's not a Google Place ID, use static data
        return storage.getDispensaryById(dispensaryId);
      }
    } catch (error) {
      console.error('Error getting dispensary details from Google Places:', error);
      return storage.getDispensaryById(dispensaryId);
    }
  }
}

export const googlePlacesAdapter = new GooglePlacesStorageAdapter();
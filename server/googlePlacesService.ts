import axios from 'axios';
import { Dispensary } from '@shared/schema';

interface GooglePlacesLocation {
  lat: number;
  lng: number;
}

interface GooglePlacesGeometry {
  location: GooglePlacesLocation;
}

interface GooglePlacesPhoto {
  photo_reference?: string;
  height: number;
  width: number;
}

interface GooglePlacesOpeningHours {
  open_now?: boolean;
  weekday_text?: string[];
}

interface GooglePlacesResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: GooglePlacesGeometry;
  rating?: number;
  user_ratings_total?: number;
  photos?: GooglePlacesPhoto[];
  vicinity?: string;
  opening_hours?: GooglePlacesOpeningHours;
  formatted_phone_number?: string;
  website?: string;
  distance?: number;
}

interface GooglePlacesResponse {
  results: GooglePlacesResult[];
  status: string;
  next_page_token?: string;
}

interface GooglePlacesDetailsResponse {
  result: GooglePlacesResult;
  status: string;
}

interface SearchOptions {
  radius?: number;
  pageToken?: string;
  type?: string;
  keyword?: string;
}

class GooglePlacesService {
  private apiKey: string | undefined;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';
  
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
  }
  
  public isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Find nearby cannabis dispensaries based on location
   * This performs multiple searches with different keywords to get better results
   */
  public async findNearbyDispensaries(
    latitude: number, 
    longitude: number,
    options: SearchOptions = {}
  ): Promise<Dispensary[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Places API key is not configured');
      }
      
      // Define search radius
      const searchRadius = options.radius || 50000; // 50km default radius - the max Google Places API allows
      
      // Define multiple search terms to get better coverage
      const searchTerms = [
        // Common terms for dispensaries
        'cannabis dispensary',
        'marijuana dispensary',
        'cannabis store',
        'weed store',
        'pot shop',
        'cannabis retail',
        'marijuana store',
        'legal cannabis',
        'recreational cannabis',
        'medical cannabis',
        
        // Canadian specific terms
        'cannabis retail store', 
        'government cannabis',
        
        // Brand-specific Canadian terms
        'SQDC', // Quebec
        'OCS', // Ontario
        'Cannabis NB', // New Brunswick
        'NSLC Cannabis', // Nova Scotia
        'AGLC', // Alberta
        'BC Cannabis Stores', // British Columbia
        'Tokyo Smoke',
        'Tweed',
        'Canna Cabana',
        'Fire & Flower',
        'Value Buds',
        'Nova Cannabis',
        'Dutch Love',
        'Spiritleaf',
        'Hobo Cannabis',
        'Superette',
        'High Tide',
        'Choom'
      ];
      
      console.log(`Performing multiple searches for dispensaries near ${latitude},${longitude}`);
      
      // Store all results
      const allResults: GooglePlacesResult[] = [];
      const uniquePlaceIds = new Set<string>();
      
      // Perform a search for each term
      for (const term of searchTerms) {
        try {
          const results = await this.performSingleSearch(
            latitude, 
            longitude, 
            searchRadius, 
            term, 
            options.pageToken
          );
          
          // Add unique results to our collection
          for (const result of results) {
            if (!uniquePlaceIds.has(result.place_id)) {
              uniquePlaceIds.add(result.place_id);
              allResults.push(result);
            }
          }
          
          console.log(`Found ${results.length} results with term '${term}'`);
          
          // Don't make too many requests too quickly
          if (searchTerms.indexOf(term) < searchTerms.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (err) {
          console.error(`Error searching with term "${term}":`, err);
          // Continue with other search terms even if one fails
        }
      }
      
      console.log(`Found ${allResults.length} unique dispensaries in total`);
      
      // Transform results to Dispensary format and filter out non-cannabis businesses
      const dispensaries = (await Promise.all(
        allResults.map(async (place) => this.convertToDispensary(place, latitude, longitude))
      )).filter(dispensary => dispensary !== null);
      
      console.log(`After filtering, ${dispensaries.length} cannabis dispensaries remain`);
      
      return dispensaries;
    } catch (error) {
      console.error('Error finding nearby dispensaries:', error);
      throw error;
    }
  }
  
  /**
   * Perform a single search with the Google Places API
   * Helper method for findNearbyDispensaries
   */
  private async performSingleSearch(
    latitude: number,
    longitude: number,
    radius: number,
    keyword: string,
    pageToken?: string
  ): Promise<GooglePlacesResult[]> {
    try {
      const nearbyUrl = `${this.baseUrl}/nearbysearch/json`;
      
      // Make sure the apiKey is defined as we already checked earlier
      const apiKey = this.apiKey as string;
      
      // First try with keyword (most specific)
      let results: GooglePlacesResult[] = [];
      
      // Build the query parameters object with keyword
      const keywordParamsObj: Record<string, string> = {
        location: `${latitude},${longitude}`,
        radius: radius.toString(),
        keyword: keyword,
        key: apiKey
      };
      
      // Try with keyword first
      try {
        const keywordParams = new URLSearchParams(keywordParamsObj);
        if (pageToken) {
          keywordParams.append('pagetoken', pageToken);
        }
        
        const keywordResponse = await axios.get<GooglePlacesResponse>(
          `${nearbyUrl}?${keywordParams.toString()}`
        );
        
        if (keywordResponse.data.status === 'OK') {
          results = keywordResponse.data.results || [];
          console.log(`Found ${results.length} results with keyword "${keyword}"`);
        }
      } catch (keywordErr) {
        console.error(`Error with keyword search for "${keyword}":`, keywordErr);
      }
      
      // If we have results from keyword search, just return those
      if (results.length > 0) {
        return results;
      }
      
      // Try with type=store and name parameter (less specific, fallback)
      try {
        const typeParamsObj: Record<string, string> = {
          location: `${latitude},${longitude}`,
          radius: radius.toString(),
          type: 'store',
          name: keyword,
          key: apiKey
        };
        
        const typeParams = new URLSearchParams(typeParamsObj);
        if (pageToken) {
          typeParams.append('pagetoken', pageToken);
        }
        
        const typeResponse = await axios.get<GooglePlacesResponse>(
          `${nearbyUrl}?${typeParams.toString()}`
        );
        
        if (typeResponse.data.status === 'OK') {
          const typeResults = typeResponse.data.results || [];
          console.log(`Found ${typeResults.length} results with type=store and name="${keyword}"`);
          
          // Combine results
          for (const result of typeResults) {
            if (!results.some(r => r.place_id === result.place_id)) {
              results.push(result);
            }
          }
        }
      } catch (typeErr) {
        console.error(`Error with type search for "${keyword}":`, typeErr);
      }
      
      return results;
    } catch (error) {
      console.error(`Error in performSingleSearch with keyword "${keyword}":`, error);
      return []; // Return empty array instead of throwing to continue with other searches
    }
  }
  
  /**
   * Get dispensary details by Google Place ID
   */
  public async getDispensaryDetails(placeId: string): Promise<Dispensary> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Places API key is not configured');
      }
      
      const detailsUrl = `${this.baseUrl}/details/json`;
      
      const queryParams = new URLSearchParams({
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,formatted_phone_number,opening_hours,website,user_ratings_total,photos',
        key: this.apiKey
      });
      
      const response = await axios.get<GooglePlacesDetailsResponse>(`${detailsUrl}?${queryParams.toString()}`);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }
      
      // Use a placeholder here for location since we don't have user location in this context
      return this.convertToDispensary(response.data.result, 0, 0);
    } catch (error) {
      console.error('Error getting dispensary details:', error);
      throw error;
    }
  }
  
  /**
   * Convert Google Places result to our Dispensary type
   */
  private async convertToDispensary(
    place: GooglePlacesResult, 
    userLat: number, 
    userLng: number
  ): Promise<Dispensary> {
    const distance = this.calculateDistance(
      userLat, 
      userLng, 
      place.geometry.location.lat, 
      place.geometry.location.lng
    );
    
    // Get a photo URL if available
    let photoUrl = 'https://images.unsplash.com/photo-1603909223575-bd6bbca6e07b?w=800&auto=format&fit=crop';
    
    if (place.photos && place.photos.length > 0 && this.apiKey && place.photos[0].photo_reference) {
      photoUrl = `${this.baseUrl}/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${this.apiKey}`;
    }
    
    // Format opening hours if available
    let hoursText = "";
    if (place.opening_hours && place.opening_hours.weekday_text) {
      hoursText = place.opening_hours.weekday_text.join(", ");
    } else if (place.opening_hours && place.opening_hours.open_now) {
      hoursText = "Open now";
    }
    
    // Determine if this is actually a cannabis store by checking keywords
    const cannabisKeywords = [
      'cannabis', 'marijuana', 'dispensary', 'pot', 'weed', 'cbd', 'thc', 
      'bud', 'green cross', 'medical marijuana', 'recreational', 'chronic'
    ];
    
    // Check if the business name or address contains any cannabis keywords
    const businessText = (place.name + ' ' + (place.vicinity || '') + ' ' + (place.formatted_address || '')).toLowerCase();
    const isCannabisStore = cannabisKeywords.some(keyword => businessText.includes(keyword));
    
    // Filter out obvious non-cannabis businesses
    const excludedKeywords = [
      'bakery', 'cafe', 'coffee', 'restaurant', 'food', 'grocery', 'hotel', 
      'motel', 'school', 'college', 'university', 'bank', 'church', 'gym',
      'fitness', 'salon', 'spa', 'pharmacy', 'hospital', 'clinic', 'doctor'
    ];
    
    // Check if the business is one of the excluded types
    const isExcludedBusiness = excludedKeywords.some(keyword => businessText.includes(keyword));
    
    // Skip this place if it's not a cannabis store or is an explicitly excluded type
    if (!isCannabisStore || isExcludedBusiness) {
      console.log(`Filtered out non-cannabis business: ${place.name}`);
      // Return null to indicate this should be filtered out
      return null as any;
    }
    
    // If we get here, it's likely a cannabis store
    const amenities = ['Cannabis Store'];
    
    // Add delivery as likely amenity for most dispensaries
    amenities.push('Delivery Available');
    
    // Check if the name suggests it's a medical dispensary
    const isMedical = place.name.toLowerCase().includes('medical') || 
                     place.name.toLowerCase().includes('med') ||
                     (place.vicinity && place.vicinity.toLowerCase().includes('medical'));
    
    // Check if it's likely recreational
    const isRecreational = place.name.toLowerCase().includes('recreational') ||
                          place.name.toLowerCase().includes('adult use') ||
                          place.name.toLowerCase().includes('rec');
    
    // Add appropriate amenities based on business type
    if (isMedical) {
      amenities.push('Medical');
    }
    
    if (isRecreational) {
      amenities.push('Recreational');
    }
    
    // Add pickup option (most dispensaries offer this)
    amenities.push('In-Store Pickup');
    
    // Add online ordering if they have a website
    if (place.website) {
      amenities.push('Online Ordering');
    }

    return {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      distance: Number(distance.toFixed(1)),
      openNow: place.opening_hours?.open_now || false,
      hours: hoursText,
      phone: place.formatted_phone_number || '',
      website: place.website || '',
      amenities: amenities,
      imageUrl: photoUrl,
      inventory: [], // We don't have inventory data from Google Places
      placeId: place.place_id
    };
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }
  
  /**
   * Geocode an address or postal code to get coordinates
   */
  public async geocodeAddress(address: string): Promise<{lat: number, lng: number}> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Places API key is not configured');
      }
      
      // For Canadian postal codes, add "Canada" to improve geocoding accuracy
      // Format: A1A 1A1 (Letter-Number-Letter Space/Dash/Nothing Number-Letter-Number)
      const cleanAddress = address.trim();
      const isCanadianPostalCode = /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i.test(cleanAddress);
      
      // Determine if this looks like a Canadian address based on province abbreviations
      const hasCanadianProvince = /\b(BC|AB|SK|MB|ON|QC|NB|NS|PE|NL|YT|NT|NU)\b/i.test(cleanAddress);
      
      // Create a more accurate search query
      let searchAddress = cleanAddress;
      
      if (isCanadianPostalCode) {
        console.log("Canadian postal code detected, enhancing geocoding query");
        // Format postal code consistently as "A1A 1A1" with a space
        const formattedPostal = cleanAddress.replace(/^([A-Z][0-9][A-Z])\s*([0-9][A-Z][0-9])$/i, "$1 $2").toUpperCase();
        searchAddress = `${formattedPostal} Canada`;
      } else if (hasCanadianProvince) {
        console.log("Canadian province detected, enhancing geocoding query");
        searchAddress = `${cleanAddress}, Canada`;
      }
      
      const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      
      const queryParams = new URLSearchParams({
        address: searchAddress,
        key: this.apiKey
      });
      
      console.log(`Geocoding address: ${searchAddress}`);
      const response = await axios.get(`${geocodeUrl}?${queryParams.toString()}`);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding API error: ${response.data.status}`);
      }
      
      if (response.data.results.length === 0) {
        throw new Error('No results found for this address');
      }
      
      const location = response.data.results[0].geometry.location;
      console.log(`Geocoded to coordinates: ${location.lat}, ${location.lng}`);
      return { lat: location.lat, lng: location.lng };
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }
}

export const googlePlacesService = new GooglePlacesService();
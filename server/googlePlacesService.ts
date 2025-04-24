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
  photo_reference: string;
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
      
      // Default options - we need to be careful with search terms to get accurate results
      // Note: Google Places API limits radius to 50,000 meters maximum
      const searchOptions: {
        radius: number;
        type?: string;  // Make type optional
        keyword: string;
        pageToken?: string;
      } = {
        radius: options.radius || 25000, // Increased to 25km default radius to find more results
        // Use broader keywords with Cannabis-specific Canadian terms
        keyword: options.keyword || 'cannabis marijuana dispensary weed pot shop SQDC OCS',
        pageToken: options.pageToken
      };
      
      const nearbyUrl = `${this.baseUrl}/nearbysearch/json`;
      
      // Build the query parameters object
      const queryParamsObj: Record<string, string> = {
        location: `${latitude},${longitude}`,
        radius: searchOptions.radius.toString(),
        keyword: searchOptions.keyword,
        key: this.apiKey
      };
      
      // Add type parameter only if it exists
      if (searchOptions.type) {
        queryParamsObj.type = searchOptions.type;
      }
      
      const queryParams = new URLSearchParams(queryParamsObj);
      
      if (searchOptions.pageToken) {
        queryParams.append('pagetoken', searchOptions.pageToken);
      }
      
      const response = await axios.get<GooglePlacesResponse>(`${nearbyUrl}?${queryParams.toString()}`);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }
      
      // Transform results to Dispensary format
      const dispensaries = await Promise.all(
        response.data.results.map(async (place) => this.convertToDispensary(place, latitude, longitude))
      );
      
      return dispensaries;
    } catch (error) {
      console.error('Error finding nearby dispensaries:', error);
      throw error;
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
    
    if (place.photos && place.photos.length > 0 && this.apiKey) {
      photoUrl = `${this.baseUrl}/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${this.apiKey}`;
    }
    
    // Format opening hours if available
    let hoursText = "";
    if (place.opening_hours && place.opening_hours.weekday_text) {
      hoursText = place.opening_hours.weekday_text.join(", ");
    } else if (place.opening_hours && place.opening_hours.open_now) {
      hoursText = "Open now";
    }
    
    // Determine what type of cannabis store this is based on name/address
    const amenities = ['Cannabis Store'];
    
    // Add delivery as likely amenity for most dispensaries
    amenities.push('Delivery Available');
    
    // Check if the name suggests it's a medical dispensary
    const isMedical = place.name.toLowerCase().includes('medical') || 
                     place.name.toLowerCase().includes('med') ||
                     place.name.toLowerCase().includes('clinic') ||
                     place.name.toLowerCase().includes('pharmacy') ||
                     (place.vicinity && place.vicinity.toLowerCase().includes('medical'));
    
    // Check if it's likely recreational
    const isRecreational = place.name.toLowerCase().includes('recreational') ||
                          place.name.toLowerCase().includes('adult use') ||
                          place.name.toLowerCase().includes('rec') ||
                          place.name.toLowerCase().includes('cannabis') ||
                          place.name.toLowerCase().includes('marijuana');
    
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
      const isCanadianPostalCode = /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i.test(address.trim());
      
      // Create a more accurate search query
      let searchAddress = address;
      if (isCanadianPostalCode) {
        console.log("Canadian postal code detected, enhancing geocoding query");
        searchAddress = `${address.trim()} Canada`;
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
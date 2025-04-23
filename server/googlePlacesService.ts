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
      
      // Default options
      const searchOptions = {
        radius: options.radius || 5000, // 5km default radius
        type: options.type || 'store',
        keyword: options.keyword || 'cannabis dispensary marijuana',
        pageToken: options.pageToken
      };
      
      const nearbyUrl = `${this.baseUrl}/nearbysearch/json`;
      
      const queryParams = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: searchOptions.radius.toString(),
        type: searchOptions.type,
        keyword: searchOptions.keyword,
        key: this.apiKey
      });
      
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
      amenities: ['Cannabis Store'],
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
      
      const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      
      const queryParams = new URLSearchParams({
        address: address,
        key: this.apiKey
      });
      
      const response = await axios.get(`${geocodeUrl}?${queryParams.toString()}`);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding API error: ${response.data.status}`);
      }
      
      if (response.data.results.length === 0) {
        throw new Error('No results found for this address');
      }
      
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }
}

export const googlePlacesService = new GooglePlacesService();
import { Dispensary } from "@shared/schema";

// Log to ensure this file is being loaded
console.log("Loading dispensary data...");

// Add specific stores for Toronto-StClair area (M6C postal code)
const torontoStClairDispensaries: Dispensary[] = [
  {
    id: 'store-toronto-1',
    name: 'On High Cannabis',
    address: '806-A St Clair Ave West, Toronto, ON M6C 1B6',
    rating: 4.7,
    reviewCount: 132,
    distance: 0.1, // Very close, this is the real store at this location
    openNow: true,
    hours: '10AM - 10PM, 7 days a week',
    amenities: [
      'Delivery Available',
      'In-Store Pickup',
      'Online Ordering',
      'Medical',
      'Recreational'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1542281286-f93cd05310c6?w=800&auto=format&fit=crop',
    inventory: [
      {
        strainId: 'og1',
        strainName: 'OG Kush',
        price: 36,
        quantity: '3.5g',
        inStock: true
      },
      {
        strainId: 'ss1',
        strainName: 'Sour Diesel',
        price: 39,
        quantity: '3.5g',
        inStock: true
      },
      {
        strainId: 'gdp1',
        strainName: 'Granddaddy Purple',
        price: 42,
        quantity: '3.5g',
        inStock: true
      },
      {
        strainId: 'bd1',
        strainName: 'Blue Dream',
        price: 38,
        quantity: '3.5g',
        inStock: true
      },
      {
        strainId: 'pu1',
        strainName: 'Purple Urkle',
        price: 41,
        quantity: '3.5g',
        inStock: true
      }
    ],
    coordinates: {
      lat: 43.6815,
      lng: -79.4199
    }
  },
  {
    id: 'store-toronto-2',
    name: 'Leaf Cannabis Company',
    address: '1051 St Clair Ave West, Toronto, ON M6E 1A4',
    rating: 4.3,
    reviewCount: 85,
    distance: 0.9, // A bit further away on St. Clair
    openNow: true,
    hours: '9AM - 11PM, 7 days a week',
    amenities: [
      'Delivery Available',
      'Online Ordering',
      'Recreational'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1542281286-f93cd05310c6?w=800&auto=format&fit=crop',
    inventory: [
      {
        strainId: 'og1',
        strainName: 'OG Kush',
        price: 34,
        quantity: '3.5g',
        inStock: true
      },
      {
        strainId: 'ss1',
        strainName: 'Sour Diesel',
        price: 37,
        quantity: '3.5g',
        inStock: true
      },
      {
        strainId: 'gdp1',
        strainName: 'Granddaddy Purple',
        price: 40,
        quantity: '3.5g',
        inStock: true
      }
    ],
    coordinates: {
      lat: 43.6774,
      lng: -79.4442
    }
  },
  {
    id: 'store-toronto-3',
    name: 'Canna Cabana',
    address: '700 Bathurst St, Toronto, ON M5S 2R4',
    rating: 4.6,
    reviewCount: 156,
    distance: 2.1, // Further south
    openNow: true,
    hours: '9AM - 10PM, 7 days a week',
    amenities: [
      'In-Store Pickup',
      'Online Ordering',
      'Medical',
      'Recreational'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1542281286-f93cd05310c6?w=800&auto=format&fit=crop',
    inventory: [
      {
        strainId: 'og1',
        strainName: 'OG Kush',
        price: 35,
        quantity: '3.5g',
        inStock: true
      },
      {
        strainId: 'ss1',
        strainName: 'Sour Diesel',
        price: 38,
        quantity: '3.5g',
        inStock: true
      }
    ],
    coordinates: {
      lat: 43.6636,
      lng: -79.4113
    }
  }
];

export const dispensaries: Dispensary[] = [
  {
    id: "disp1",
    name: "Green Leaf Dispensary",
    address: "1234 Cannabis Ave, Denver, CO 80202",
    rating: 4.9,
    reviewCount: 128,
    distance: 0, // Will be calculated based on user location
    openNow: true,
    hours: "9am - 10pm",
    amenities: ["Pickup Available", "Delivery Available", "Medical & Recreational"],
    imageUrl: "https://images.unsplash.com/photo-1589280115275-0389941272d9?w=200&h=200&fit=crop",
    inventory: [
      {
        strainId: "gdp1",
        strainName: "Granddaddy Purple",
        price: 45.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "nl1",
        strainName: "Northern Lights",
        price: 42.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "bd1",
        strainName: "Blue Dream",
        price: 40.00,
        quantity: "3.5g | Flower",
        inStock: true
      }
    ],
    coordinates: {
      lat: 39.742043,
      lng: -104.991531
    }
  },
  {
    id: "disp2",
    name: "Mile High Dispensary",
    address: "5678 Mountain View Rd, Denver, CO 80202",
    rating: 4.4,
    reviewCount: 87,
    distance: 0, // Will be calculated based on user location
    openNow: true,
    hours: "8am - 9pm",
    amenities: ["Pickup Available", "Medical & Recreational"],
    imageUrl: "https://images.unsplash.com/photo-1589055504547-1c175ec51e8e?w=200&h=200&fit=crop",
    inventory: [
      {
        strainId: "gdp1",
        strainName: "Granddaddy Purple",
        price: 40.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "nl1",
        strainName: "Northern Lights",
        price: 42.00,
        quantity: "3.5g | Flower",
        inStock: false
      },
      {
        strainId: "og1",
        strainName: "OG Kush",
        price: 48.00,
        quantity: "3.5g | Flower",
        inStock: true
      }
    ],
    coordinates: {
      lat: 39.745383,
      lng: -104.983223
    }
  },
  {
    id: "disp3",
    name: "Rocky Mountain Cannabis",
    address: "9101 High St, Denver, CO 80205",
    rating: 4.7,
    reviewCount: 103,
    distance: 0, // Will be calculated based on user location
    openNow: true,
    hours: "10am - 8pm",
    amenities: ["Pickup Available", "Delivery Available", "Recreational Only"],
    imageUrl: "https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=200&h=200&fit=crop",
    inventory: [
      {
        strainId: "ss1",
        strainName: "Sour Diesel",
        price: 45.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "bd1",
        strainName: "Blue Dream",
        price: 42.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "gg4",
        strainName: "Gorilla Glue #4",
        price: 50.00,
        quantity: "3.5g | Flower",
        inStock: true
      }
    ],
    coordinates: {
      lat: 39.752273,
      lng: -104.975493
    }
  },
  {
    id: "disp4",
    name: "Mountain View Dispensary",
    address: "3210 Valley Way, Boulder, CO 80301",
    rating: 4.5,
    reviewCount: 92,
    distance: 0, // Will be calculated based on user location
    openNow: true,
    hours: "9am - 9pm",
    amenities: ["Pickup Available", "Medical & Recreational"],
    imageUrl: "https://images.unsplash.com/photo-1527069438183-05ee82394e5d?w=200&h=200&fit=crop",
    inventory: [
      {
        strainId: "gsc1",
        strainName: "Girl Scout Cookies",
        price: 48.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "jh1",
        strainName: "Jack Herer",
        price: 45.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "ww1",
        strainName: "White Widow",
        price: 42.00,
        quantity: "3.5g | Flower",
        inStock: true
      }
    ],
    coordinates: {
      lat: 40.012936,
      lng: -105.270505
    }
  },
  {
    id: "disp5",
    name: "Colorado Cannabis Co.",
    address: "5678 Pine St, Denver, CO 80204",
    rating: 4.2,
    reviewCount: 76,
    distance: 0, // Will be calculated based on user location
    openNow: false,
    hours: "10am - 7pm",
    amenities: ["Pickup Available", "Recreational Only"],
    imageUrl: "https://images.unsplash.com/photo-1539614413498-4a143eaf7c5f?w=200&h=200&fit=crop",
    inventory: [
      {
        strainId: "gdp1",
        strainName: "Granddaddy Purple",
        price: 38.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "pu1",
        strainName: "Purple Urkle",
        price: 40.00,
        quantity: "3.5g | Flower",
        inStock: true
      },
      {
        strainId: "ss1",
        strainName: "Sour Diesel",
        price: 45.00,
        quantity: "3.5g | Flower",
        inStock: false
      }
    ],
    coordinates: {
      lat: 39.738453,
      lng: -105.001723
    }
  }
];

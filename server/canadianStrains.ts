
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Strain } from '@shared/schema';
import { enhancedStrains } from './enhancedStrainData';

// Top Canadian strains based on popularity
// This data will be periodically updated by the scraper
export const topCanadianStrains: Strain[] = [];

/**
 * Scrapes popular Canadian cannabis strains from multiple sources
 * and updates the topCanadianStrains array
 */
export async function scrapePopularCanadianStrains(): Promise<void> {
  try {
    console.log('Scraping popular Canadian strains...');
    
    // Sources to scrape
    const sources = [
      'https://www.leafly.ca/strains/lists/location/canada',
      'https://www.reddit.com/r/canadients/top/?t=month' // Reddit discussions
    ];
    
    // Map to track strain mentions and popularity
    const strainMentions: Record<string, number> = {};
    
    // Scrape each source
    for (const source of sources) {
      try {
        const response = await axios.get(source, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract strain names based on the page structure
        if (source.includes('leafly')) {
          // Leafly-specific selectors
          $('.strain-tile__name').each((_, element) => {
            const strainName = $(element).text().trim();
            if (strainName) {
              strainMentions[strainName] = (strainMentions[strainName] || 0) + 3; // Higher weight for Leafly
            }
          });
        } else if (source.includes('reddit')) {
          // Reddit-specific content extraction
          $('h3.title, div.md').each((_, element) => {
            const text = $(element).text();
            // Search for strain names in our database within the text
            enhancedStrains.forEach(strain => {
              if (text.toLowerCase().includes(strain.name.toLowerCase())) {
                strainMentions[strain.name] = (strainMentions[strain.name] || 0) + 1;
              }
            });
          });
        }
      } catch (error) {
        console.error(`Error scraping ${source}:`, error);
        // Continue with other sources
      }
    }
    
    // Find matching strains in our database for the top mentioned strains
    const topStrainNames = Object.entries(strainMentions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Get top 20 mentions
      .map(entry => entry[0]);
    
    // Reset the top Canadian strains array
    topCanadianStrains.length = 0;
    
    // Find the strains in our database that match the top mentions
    let matchedStrains: Strain[] = [];
    
    topStrainNames.forEach(name => {
      // Try to find an exact match
      const exactMatch = enhancedStrains.find(
        strain => strain.name.toLowerCase() === name.toLowerCase()
      );
      
      if (exactMatch) {
        matchedStrains.push(exactMatch);
      } else {
        // Try to find a partial match
        const partialMatch = enhancedStrains.find(
          strain => strain.name.toLowerCase().includes(name.toLowerCase()) ||
                   name.toLowerCase().includes(strain.name.toLowerCase())
        );
        
        if (partialMatch) {
          matchedStrains.push(partialMatch);
        }
      }
    });
    
    // Ensure we have at least 10 strains by adding top-rated strains if needed
    if (matchedStrains.length < 10) {
      console.log(`Only found ${matchedStrains.length} matching strains, adding top-rated strains`);
      
      // Get existing strain IDs to avoid duplicates
      const existingIds = new Set(matchedStrains.map(strain => strain.id));
      
      // Add top-rated strains that aren't already in the matched strains
      const additionalStrains = enhancedStrains
        .sort((a, b) => b.rating - a.rating)
        .filter(strain => !existingIds.has(strain.id))
        .slice(0, 10 - matchedStrains.length);
      
      matchedStrains = [...matchedStrains, ...additionalStrains];
    }
    
    // Take the top 10 strains
    matchedStrains = matchedStrains.slice(0, 10);
    
    // Add the strains to our topCanadianStrains array
    topCanadianStrains.push(...matchedStrains);
    
    console.log(`Updated top Canadian strains: ${topCanadianStrains.map(s => s.name).join(', ')}`);
  } catch (error) {
    console.error('Error scraping popular Canadian strains:', error);
    // Fallback to top rated strains if scraping fails
    const fallbackStrains = enhancedStrains
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
    
    topCanadianStrains.length = 0;
    topCanadianStrains.push(...fallbackStrains);
    
    console.log('Using fallback top-rated strains due to scraping error');
  }
}

// Static fallback data in case web scraping fails
export const staticTopCanadianStrains: Strain[] = [
  {
    id: "gs1",
    name: "Girl Scout Cookies",
    breeder: "Cookie Family",
    type: "Hybrid",
    thcContent: "25-28%",
    cbdContent: "0.2%",
    terpenes: ["Caryophyllene", "Limonene", "Humulene"],
    effects: ["Euphoric", "Happy", "Relaxing", "Creative", "Uplifting"],
    flavors: ["Sweet", "Earthy", "Dessert"],
    rating: 4.7,
    reviewCount: 624,
    description: "Girl Scout Cookies, or GSC, is a popular Canadian strain created by crossing OG Kush with Durban Poison. This strain produces a euphoric high with powerful full-body relaxation, making it ideal for evening use.",
    imageUrl: "https://images.unsplash.com/photo-1620218982513-9040e40987a2?w=800&auto=format&fit=crop"
  },
  {
    id: "bd1",
    name: "Blue Dream",
    breeder: "DJ Short",
    type: "Hybrid",
    thcContent: "17-24%",
    cbdContent: "0.1-0.2%",
    terpenes: ["Myrcene", "Pinene"],
    effects: ["Happy", "Relaxing", "Creative"],
    flavors: ["Blueberry", "Sweet", "Herbal"],
    rating: 4.4,
    reviewCount: 523,
    description: "Blue Dream is a sativa-dominant hybrid that has achieved legendary status in Canada. By crossing Blueberry with Haze, Blue Dream balances full-body relaxation with gentle cerebral invigoration.",
    imageUrl: "https://images.unsplash.com/photo-1603909223358-05f2b6cdb7c0?w=800&auto=format&fit=crop"
  },
  {
    id: "gg4",
    name: "Gorilla Glue #4",
    breeder: "GG Strains",
    type: "Hybrid",
    thcContent: "25-30%",
    cbdContent: "0.1%",
    terpenes: ["Caryophyllene", "Limonene", "Myrcene"],
    effects: ["Relaxing", "Euphoric", "Creative", "Happy"],
    flavors: ["Earthy", "Pine", "Chemical"],
    rating: 4.7,
    reviewCount: 528,
    description: "Gorilla Glue #4, developed by GG Strains, is a potent hybrid strain popular in Canada that delivers heavy-handed euphoria and relaxation, leaving you feeling 'glued' to the couch.",
    imageUrl: "https://images.unsplash.com/photo-1616246686486-a4da96738bf8?w=800&auto=format&fit=crop"
  },
  {
    id: "sd1",
    name: "Sour Diesel",
    breeder: "Unknown",
    type: "Sativa-dominant",
    thcContent: "20-25%",
    cbdContent: "0.1-0.2%",
    terpenes: ["Myrcene", "Limonene", "Caryophyllene"],
    effects: ["Energetic", "Euphoric", "Happy", "Uplifting", "Creative"],
    flavors: ["Diesel", "Citrus", "Sour"],
    rating: 4.5,
    reviewCount: 567,
    description: "Sour Diesel is a fast-acting strain renowned for its energizing effects. This sativa-dominant hybrid has a pungent, diesel-like aroma with hints of citrus, and is a Canadian favorite.",
    imageUrl: "https://images.unsplash.com/photo-1603962313439-8857a866578a?w=800&auto=format&fit=crop"
  },
  {
    id: "pk1",
    name: "Pink Kush",
    breeder: "Unknown",
    type: "Indica",
    thcContent: "20-25%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Limonene", "Caryophyllene"],
    effects: ["Relaxing", "Happy", "Euphoric", "Sleepy", "Pain Relief"],
    flavors: ["Sweet", "Floral", "Vanilla"],
    rating: 4.8,
    reviewCount: 612,
    description: "Pink Kush, related to OG Kush, is a popular Canadian indica strain known for its potent effects. This strain delivers a strong body high and is often used for pain relief and insomnia.",
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800&auto=format&fit=crop"
  },
  {
    id: "wp1",
    name: "Wedding Cake",
    breeder: "Seed Junky Genetics",
    type: "Hybrid",
    thcContent: "20-25%",
    cbdContent: "0.1%",
    terpenes: ["Limonene", "Caryophyllene", "Myrcene"],
    effects: ["Relaxing", "Happy", "Euphoric", "Creative", "Uplifting"],
    flavors: ["Sweet", "Vanilla", "Earthy"],
    rating: 4.7,
    reviewCount: 512,
    description: "Wedding Cake, also known as Pink Cookies, is a hybrid strain that's gained popularity in Canada. Created by crossing Triangle Kush with Animal Mints, it provides relaxing and euphoric effects.",
    imageUrl: "https://images.unsplash.com/photo-1620472444424-d79d34dfc891?w=800&auto=format&fit=crop"
  }
];

// Initialize the top Canadian strains with static data
// Will be replaced when scraping is successful
export function initializeTopCanadianStrains(): void {
  if (topCanadianStrains.length === 0) {
    console.log('Initializing top Canadian strains with static data');
    topCanadianStrains.push(...staticTopCanadianStrains);
  }
}

// Schedule regular updates (every 24 hours)
export function scheduleStrainUpdates(): void {
  // Initial scrape
  scrapePopularCanadianStrains().catch(error => {
    console.error('Error in initial strain scrape:', error);
    initializeTopCanadianStrains();
  });
  
  // Schedule regular updates
  setInterval(() => {
    scrapePopularCanadianStrains().catch(error => {
      console.error('Error in scheduled strain scrape:', error);
      // If topCanadianStrains is empty due to errors, use static data
      if (topCanadianStrains.length === 0) {
        initializeTopCanadianStrains();
      }
    });
  }, 24 * 60 * 60 * 1000); // 24 hours
}

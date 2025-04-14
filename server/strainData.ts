import { Strain } from "@shared/schema";

// Log to ensure this file is being loaded
console.log("Loading strain data...");
// Log the actual strain data to make sure it's valid
setTimeout(() => {
  console.log("First strain:", JSON.stringify(strains[0]));
  console.log("Total strains:", strains.length);
}, 1000);

export const strains: Strain[] = [
  {
    id: "gdp1",
    name: "Granddaddy Purple",
    breeder: "Purple Farm Genetics",
    type: "Indica",
    thcContent: "17-24%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Caryophyllene"],
    effects: ["Relaxing", "Sleepy", "Pain Relief"],
    flavors: ["Grape", "Berry", "Sweet"],
    rating: 4.8,
    reviewCount: 354,
    description: "Granddaddy Purple (GDP) is a famous indica strain that combines the best of Purple Urkle and Big Bud. This California staple inherits a complex grape and berry aroma from its Purple Urkle parent, while Big Bud passes on its oversized, compact bud structure. GDP is known for introducing deep purple hues set against vibrant orange hairs and a blanket of crystal resin.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1667543228378-c8920444f272?w=800&auto=format&fit=crop"
  },
  {
    id: "nl1",
    name: "Northern Lights",
    breeder: "Sensi Seeds",
    type: "Indica",
    thcContent: "16-21%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Pinene"],
    effects: ["Relaxing", "Happy", "Sleepy"],
    flavors: ["Pine", "Earthy", "Sweet"],
    rating: 4.9,
    reviewCount: 612,
    description: "Northern Lights is one of the most famous indica strains of all time, a pure indica that has won countless awards and is the foundation of many modern hybrids. The effects are classic indica - relaxing, sleepy, and excellent for stress relief. Northern Lights' resin-packed buds emit a sweet and spicy aroma reminiscent of an evergreen forest.",
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800&auto=format&fit=crop"
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
    description: "Blue Dream is a sativa-dominant hybrid that has achieved legendary status in California. By crossing Blueberry with Haze, Blue Dream balances full-body relaxation with gentle cerebral invigoration. With a sweet berry aroma reminiscent of its Blueberry parent, Blue Dream delivers swift symptom relief without heavy sedative effects.",
    imageUrl: "https://images.unsplash.com/photo-1603909223358-05f2b6cdb7c0?w=800&auto=format&fit=crop"
  },
  {
    id: "og1",
    name: "OG Kush",
    breeder: "Unknown",
    type: "Hybrid",
    thcContent: "19-26%",
    cbdContent: "0.3%",
    terpenes: ["Limonene", "Caryophyllene", "Linalool"],
    effects: ["Relaxing", "Euphoric", "Happy"],
    flavors: ["Earthy", "Pine", "Citrus"],
    rating: 4.7,
    reviewCount: 788,
    description: "OG Kush is a legendary strain that originated in Florida in the early '90s when Emerald Triangle genetics were crossed with a Hindu Kush plant. Its complex aroma with notes of fuel, skunk, and spice is an essential part of the strain's appeal. The heavy, euphoric high combines mental stimulation with a powerful physical relaxation.",
    imageUrl: "https://images.unsplash.com/photo-1603386329201-251398d29e7c?w=800&auto=format&fit=crop"
  },
  {
    id: "ss1",
    name: "Sour Diesel",
    breeder: "Unknown",
    type: "Sativa",
    thcContent: "19-25%",
    cbdContent: "0.2%",
    terpenes: ["Caryophyllene", "Limonene", "Myrcene"],
    effects: ["Energetic", "Uplifting", "Creative"],
    flavors: ["Diesel", "Citrus", "Earthy"],
    rating: 4.6,
    reviewCount: 645,
    description: "Sour Diesel is an invigorating sativa-dominant strain named after its pungent, diesel-like aroma. This fast-acting strain delivers energizing, dreamy cerebral effects that have pushed Sour Diesel to its legendary status. Stress, pain, and depression fade away in long-lasting relief that makes Sour Diesel a top choice among medical patients.",
    imageUrl: "https://images.unsplash.com/photo-1588737005761-d632e5cf63f6?w=800&auto=format&fit=crop"
  },
  {
    id: "gg4",
    name: "Gorilla Glue #4",
    breeder: "GG Strains",
    type: "Hybrid",
    thcContent: "25-30%",
    cbdContent: "0.1%",
    terpenes: ["Caryophyllene", "Limonene", "Myrcene"],
    effects: ["Relaxing", "Euphoric", "Happy"],
    flavors: ["Earthy", "Pine", "Chemical"],
    rating: 4.8,
    reviewCount: 712,
    description: "Gorilla Glue #4 (also known as Original Glue) is a potent hybrid strain that delivers heavy-handed euphoria and relaxation, leaving you feeling \"glued\" to the couch. Its chunky, resin-covered buds fill the room with aromas of earthy pine and sour diesel. Developed by GG Strains, this multiple award-winning hybrid has quickly become a favorite among consumers and growers alike.",
    imageUrl: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=800&auto=format&fit=crop"
  },
  {
    id: "ww1",
    name: "White Widow",
    breeder: "Green House Seeds",
    type: "Hybrid",
    thcContent: "18-25%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Caryophyllene"],
    effects: ["Uplifting", "Creative", "Relaxing"],
    flavors: ["Earthy", "Woody", "Sweet"],
    rating: 4.5,
    reviewCount: 509,
    description: "White Widow is a legendary hybrid strain bred in the Netherlands by Green House Seeds. A cross between a Brazilian sativa landrace and a resin-heavy South Indian indica, White Widow has blessed every Dutch coffee shop menu since the 1990s. Its buds are white with crystal resin, warning you of the potent effects to come.",
    imageUrl: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=800&auto=format&fit=crop"
  },
  {
    id: "pu1",
    name: "Purple Urkle",
    breeder: "Unknown",
    type: "Indica",
    thcContent: "17-20%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Caryophyllene"],
    effects: ["Relaxing", "Sleepy", "Happy"],
    flavors: ["Grape", "Berry", "Skunk"],
    rating: 4.6,
    reviewCount: 421,
    description: "Purple Urkle is a longtime favorite in the California cannabis scene. Though its precise origins are unknown, Purple Urkle emerged in the 1980s as a member of the purple cannabis family known for relaxing sedative effects and deep purple colors. Its sweet, grape-like flavor profile adds to the appeal.",
    imageUrl: "https://images.unsplash.com/photo-1603909223398-db0f5e9d1774?w=800&auto=format&fit=crop"
  },
  {
    id: "gsc1",
    name: "Girl Scout Cookies",
    breeder: "Cookie Fam",
    type: "Hybrid",
    thcContent: "20-28%",
    cbdContent: "0.2%",
    terpenes: ["Caryophyllene", "Limonene", "Humulene"],
    effects: ["Euphoric", "Happy", "Relaxing"],
    flavors: ["Sweet", "Earthy", "Mint"],
    rating: 4.7,
    reviewCount: 689,
    description: "Girl Scout Cookies, or GSC, is an OG Kush and Durban Poison hybrid cross whose reputation grew too large to stay within the borders of its California homeland. With a sweet and earthy aroma, GSC launches you to euphoria's top floor where full-body relaxation meets a time-bending cerebral space.",
    imageUrl: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=800&auto=format&fit=crop"
  },
  {
    id: "jh1",
    name: "Jack Herer",
    breeder: "Sensi Seeds",
    type: "Sativa",
    thcContent: "18-24%",
    cbdContent: "0.1-0.2%",
    terpenes: ["Terpinolene", "Pinene", "Caryophyllene"],
    effects: ["Creative", "Energetic", "Focused"],
    flavors: ["Pine", "Spicy", "Woody"],
    rating: 4.6,
    reviewCount: 532,
    description: "Jack Herer is a sativa-dominant cannabis strain that has gained as much renown as its namesake, the marijuana activist and author of The Emperor Wears No Clothes. Combining a Haze hybrid with a Northern Lights #5 and Shiva Skunk cross, Sensi Seeds created Jack Herer in the Netherlands in the mid-1990s.",
    imageUrl: "https://images.unsplash.com/photo-1603386329205-e5b99c6c824c?w=800&auto=format&fit=crop"
  }
];

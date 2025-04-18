import { Strain } from "@shared/schema";

// Extended dataset from seedfinder.eu
// This is our seed dataset with more comprehensive information
export const enhancedStrains: Strain[] = [
  // Original strains
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
  // Adding many more strains from seedfinder.eu
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
    description: "Gorilla Glue #4, developed by GG Strains, is a potent hybrid strain that delivers heavy-handed euphoria and relaxation, leaving you feeling 'glued' to the couch. Its chunky, resin-covered buds fill the room with pungent earthy and sour aromas inherited from its parent strains, Chem's Sister, Sour Dubb, and Chocolate Diesel.",
    imageUrl: "https://images.unsplash.com/photo-1616246686486-a4da96738bf8?w=800&auto=format&fit=crop"
  },
  {
    id: "wd1",
    name: "White Widow",
    breeder: "Green House Seeds",
    type: "Hybrid",
    thcContent: "18-25%",
    cbdContent: "0.2%",
    terpenes: ["Caryophyllene", "Myrcene", "Limonene"],
    effects: ["Euphoric", "Uplifting", "Creative", "Energetic", "Focused"],
    flavors: ["Earthy", "Woody", "Sweet"],
    rating: 4.5,
    reviewCount: 489,
    description: "White Widow is a balanced hybrid first bred in the Netherlands by Green House Seeds. A cross between a Brazilian sativa landrace and a resin-heavy South Indian indica, White Widow has blessed every Dutch coffee shop menu since the 1990s. Its buds are white with crystal resin, warning you of the potent effects to come.",
    imageUrl: "https://images.unsplash.com/photo-1603572689298-2c721b826e69?w=800&auto=format&fit=crop"
  },
  {
    id: "sk1",
    name: "Sour Kush",
    breeder: "DNA Genetics",
    type: "Hybrid",
    thcContent: "20-25%",
    cbdContent: "0.3%",
    terpenes: ["Myrcene", "Limonene", "Pinene"],
    effects: ["Relaxing", "Happy", "Euphoric", "Uplifting", "Pain Relief"],
    flavors: ["Sour", "Citrus", "Diesel"],
    rating: 4.6,
    reviewCount: 402,
    description: "Sour Kush, also known as Sour OG, is a cross between OG Kush and Sour Diesel. This strain inherits the best qualities from both of its parent strains, offering a perfect balance of relaxation and mental stimulation. The aroma is a blend of earthy, piney notes from OG Kush and the sour, fuel-like smell from Sour Diesel.",
    imageUrl: "https://images.unsplash.com/photo-1603909223575-bd6bbca6e07b?w=800&auto=format&fit=crop"
  },
  {
    id: "pk1",
    name: "Purple Kush",
    breeder: "BC Bud Depot",
    type: "Indica",
    thcContent: "17-22%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Caryophyllene", "Pinene"],
    effects: ["Relaxing", "Sleepy", "Happy", "Euphoric", "Pain Relief"],
    flavors: ["Grape", "Earthy", "Sweet"],
    rating: 4.5,
    reviewCount: 382,
    description: "Purple Kush is a pure indica strain that emerged from the Oakland area of California as a cross between Hindu Kush and Purple Afghani. Its aroma is subtle and earthy with sweet overtones typical of Kush varieties. Blissful, long-lasting euphoria blankets the mind while physical relaxation rests the body.",
    imageUrl: "https://images.unsplash.com/photo-1616246363838-7f610a33765c?w=800&auto=format&fit=crop"
  },
  {
    id: "jh1",
    name: "Jack Herer",
    breeder: "Sensi Seeds",
    type: "Sativa-dominant",
    thcContent: "15-24%",
    cbdContent: "0.2%",
    terpenes: ["Terpinolene", "Pinene", "Caryophyllene"],
    effects: ["Happy", "Uplifting", "Creative", "Energetic", "Focused"],
    flavors: ["Earthy", "Pine", "Woody"],
    rating: 4.6,
    reviewCount: 507,
    description: "Jack Herer is a sativa-dominant cannabis strain named after the legendary cannabis activist and author. Created by Sensi Seeds, it's a Dutch classic that combines a Haze hybrid with a Northern Lights #5 and Shiva Skunk cross. Jack Herer's clear-headed, blissful high has won numerous awards and is ideal for creative pursuits.",
    imageUrl: "https://images.unsplash.com/photo-1620218944466-5962fe189f01?w=800&auto=format&fit=crop"
  },
  {
    id: "ak47",
    name: "AK-47",
    breeder: "Serious Seeds",
    type: "Hybrid",
    thcContent: "15-20%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Pinene", "Limonene"],
    effects: ["Happy", "Relaxing", "Uplifting", "Sociable", "Creative"],
    flavors: ["Earthy", "Woody", "Sour"],
    rating: 4.4,
    reviewCount: 392,
    description: "AK-47 is a Sativa-dominant hybrid with bright white coloring created by Serious Seeds in 1992. This strain has won numerous Cannabis Cup awards despite its controversial name. AK-47 produces a steady, long-lasting cerebral buzz that keeps you mentally alert and engaged in creative or social activities.",
    imageUrl: "https://images.unsplash.com/photo-1603962295671-494e8c4ba23b?w=800&auto=format&fit=crop"
  },
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
    description: "Girl Scout Cookies, or GSC, is a California strain created by crossing OG Kush with Durban Poison. This strain produces a euphoric high with powerful full-body relaxation, making it ideal for evening use. GSC has a sweet and earthy aroma with hints of dessert-like flavors that have made it a favorite among connoisseurs.",
    imageUrl: "https://images.unsplash.com/photo-1620218982513-9040e40987a2?w=800&auto=format&fit=crop"
  },
  {
    id: "bb1",
    name: "Bruce Banner",
    breeder: "Dark Horse Genetics",
    type: "Hybrid",
    thcContent: "25-30%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Caryophyllene", "Limonene"],
    effects: ["Euphoric", "Happy", "Creative", "Energetic", "Focused"],
    flavors: ["Sweet", "Earthy", "Diesel"],
    rating: 4.6,
    reviewCount: 473,
    description: "Bruce Banner, named after the Hulk's alter ego, is a heavy-hitting hybrid with strong OG Kush influence. This strain delivers an immediate rush of euphoria and creativity, followed by a relaxing body buzz. With THC levels often testing above 25%, it's known for its potency and is recommended for experienced consumers.",
    imageUrl: "https://images.unsplash.com/photo-1620472416242-92fab49decb8?w=800&auto=format&fit=crop"
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
    description: "Sour Diesel is a fast-acting strain renowned for its energizing effects that blend full-body relaxation with cerebral stimulation. This sativa-dominant hybrid has a pungent, diesel-like aroma with hints of citrus. Originating in the early 90s, Sour Diesel has become a staple in the cannabis community for its mood-lifting and creative properties.",
    imageUrl: "https://images.unsplash.com/photo-1603962313439-8857a866578a?w=800&auto=format&fit=crop"
  },
  {
    id: "pr1",
    name: "Pineapple Express",
    breeder: "G13 Labs",
    type: "Hybrid",
    thcContent: "18-25%",
    cbdContent: "0.1%",
    terpenes: ["Caryophyllene", "Myrcene", "Limonene"],
    effects: ["Happy", "Uplifting", "Energetic", "Creative", "Relaxing"],
    flavors: ["Pineapple", "Tropical", "Cedar"],
    rating: 4.5,
    reviewCount: 489,
    description: "Pineapple Express is a sativa-dominant hybrid that rose to fame after the 2008 movie of the same name. A cross between Trainwreck and Hawaiian, this tropical strain delivers energetic, uplifting effects paired with a sweet, fruity flavor profile dominated by fresh pineapple notes. It's perfect for productive afternoons or creative activities.",
    imageUrl: "https://images.unsplash.com/photo-1620472444248-cf02962b5ecf?w=800&auto=format&fit=crop"
  },
  {
    id: "bw1",
    name: "Blue Widow",
    breeder: "Dinafem Seeds",
    type: "Hybrid",
    thcContent: "15-20%",
    cbdContent: "0.1-0.2%",
    terpenes: ["Myrcene", "Pinene", "Caryophyllene"],
    effects: ["Relaxing", "Happy", "Euphoric", "Creative", "Uplifting"],
    flavors: ["Berry", "Sweet", "Citrus"],
    rating: 4.3,
    reviewCount: 352,
    description: "Blue Widow is a balanced hybrid cross between Blueberry and White Widow. This strain inherits the sweet berry notes of Blueberry and the resinous potency of White Widow. The effects begin with a cerebral rush followed by full-body relaxation, making it suitable for both daytime and evening use.",
    imageUrl: "https://images.unsplash.com/photo-1603909223393-89aa239b7e8c?w=800&auto=format&fit=crop"
  },
  {
    id: "am1",
    name: "Amnesia Haze",
    breeder: "Soma Seeds",
    type: "Sativa-dominant",
    thcContent: "20-25%",
    cbdContent: "0.5%",
    terpenes: ["Myrcene", "Pinene", "Limonene"],
    effects: ["Energetic", "Euphoric", "Creative", "Focused", "Uplifting"],
    flavors: ["Citrus", "Lemon", "Earthy"],
    rating: 4.6,
    reviewCount: 437,
    description: "Amnesia Haze is a classic sativa-dominant strain known for its potent psychoactive effects. With complex genetics from landrace strains from Jamaica, Hawaii, and various Asian and Afghani regions, this strain delivers an energetic, uplifting high with a hint of euphoria. Its citrusy flavor profile has made it a Cannabis Cup winner multiple times.",
    imageUrl: "https://images.unsplash.com/photo-1620472444310-5e4ca3bb118f?w=800&auto=format&fit=crop"
  },
  {
    id: "og1",
    name: "OG Kush",
    breeder: "Unknown",
    type: "Hybrid",
    thcContent: "20-25%",
    cbdContent: "0.2%",
    terpenes: ["Myrcene", "Limonene", "Caryophyllene"],
    effects: ["Relaxing", "Happy", "Euphoric", "Uplifting", "Sleepy"],
    flavors: ["Earthy", "Pine", "Woody"],
    rating: 4.8,
    reviewCount: 728,
    description: "OG Kush is a legendary strain with mysterious origins, thought to be a cross between Chemdawg and Hindu Kush. The 'OG' in OG Kush has been debated as meaning 'Original Gangster' or 'Ocean Grown.' This hybrid delivers a powerful combination of head and body effects, often described as both mentally stimulating and physically relaxing.",
    imageUrl: "https://images.unsplash.com/photo-1620472444339-add0d19c1c95?w=800&auto=format&fit=crop"
  },
  {
    id: "cd1",
    name: "Chemdawg",
    breeder: "Unknown",
    type: "Hybrid",
    thcContent: "20-25%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Caryophyllene", "Limonene"],
    effects: ["Relaxing", "Euphoric", "Happy", "Uplifting", "Creative"],
    flavors: ["Diesel", "Chemical", "Earthy"],
    rating: 4.6,
    reviewCount: 462,
    description: "Chemdawg is a legendary strain with an uncertain genetic history and a strong chemical smell. This hybrid strain delivers a cerebral high paired with a strong physical relaxation, often resulting in a powerful sense of euphoria. Chemdawg is the parent strain of many popular varieties, including Sour Diesel and OG Kush.",
    imageUrl: "https://images.unsplash.com/photo-1620472444235-7eb3d4d02d58?w=800&auto=format&fit=crop"
  },
  {
    id: "dp1",
    name: "Durban Poison",
    breeder: "African landrace",
    type: "Sativa",
    thcContent: "15-25%",
    cbdContent: "0.1%",
    terpenes: ["Terpinolene", "Myrcene", "Pinene"],
    effects: ["Energetic", "Creative", "Focused", "Uplifting", "Happy"],
    flavors: ["Sweet", "Earthy", "Pine"],
    rating: 4.5,
    reviewCount: 436,
    description: "Durban Poison is a pure African sativa named after the South African port city of Durban. This landrace strain delivers a sweet smell and energetic, uplifting effects that are great for productive daytime use. Beloved for its sweet smell and energetic high, it's often used to treat depression and fatigue.",
    imageUrl: "https://images.unsplash.com/photo-1620218931658-66a51e934f44?w=800&auto=format&fit=crop"
  },
  {
    id: "tm1",
    name: "Trainwreck",
    breeder: "Unknown",
    type: "Hybrid",
    thcContent: "18-25%",
    cbdContent: "0.2%",
    terpenes: ["Myrcene", "Pinene", "Terpinolene"],
    effects: ["Euphoric", "Happy", "Energetic", "Creative", "Relaxing"],
    flavors: ["Earthy", "Lemon", "Pine"],
    rating: 4.4,
    reviewCount: 384,
    description: "Trainwreck is a mind-bending hybrid with potent sativa effects that hit like a freight train. Mexican and Thai sativas were blended with Afghani indicas to create this Northern California staple, passing on a sweet lemon and spicy pine aroma. Trainwreck begins with a surge of euphoria, creativity, and happiness before melting into relaxation.",
    imageUrl: "https://images.unsplash.com/photo-1620218942412-2af17de59b2c?w=800&auto=format&fit=crop"
  },
  {
    id: "bb2",
    name: "Blueberry",
    breeder: "DJ Short",
    type: "Indica",
    thcContent: "15-24%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Pinene", "Caryophyllene"],
    effects: ["Relaxing", "Happy", "Euphoric", "Sleepy", "Creative"],
    flavors: ["Berry", "Sweet", "Earthy"],
    rating: 4.5,
    reviewCount: 421,
    description: "Blueberry is a popular indica strain developed by DJ Short in the late 1970s. A cross of Thai, Purple Thai, and Afghani genetics, it's famous for its distinct blueberry aroma and flavor. The effects are deeply relaxing and euphoric, making it perfect for stress relief and evening use. Its beautiful blue hues have made it a longtime favorite.",
    imageUrl: "https://images.unsplash.com/photo-1620472444040-539acdb4f259?w=800&auto=format&fit=crop"
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
    description: "Wedding Cake, also known as Pink Cookies, is a hybrid strain created by crossing Triangle Kush with Animal Mints. This rich and tangy strain provides relaxing and euphoric effects that calm the body without sedating the mind. It offers a rich and tangy flavor profile with earthy and peppery notes.",
    imageUrl: "https://images.unsplash.com/photo-1620472444424-d79d34dfc891?w=800&auto=format&fit=crop"
  },
  {
    id: "gp1",
    name: "Green Poison",
    breeder: "Sweet Seeds",
    type: "Hybrid",
    thcContent: "15-20%",
    cbdContent: "0.1%",
    terpenes: ["Myrcene", "Pinene", "Limonene"],
    effects: ["Relaxing", "Euphoric", "Creative", "Happy", "Energetic"],
    flavors: ["Sweet", "Fruity", "Citrus"],
    rating: 4.3,
    reviewCount: 362,
    description: "Green Poison is a fast-flowering hybrid from Sweet Seeds, created by crossing Skunk and Big Bud. This strain delivers a balanced effect with initial cerebral stimulation followed by physical relaxation. It has a sweet, fruity aroma with hints of citrus and a fast flowering time, making it popular among growers.",
    imageUrl: "https://images.unsplash.com/photo-1620554740172-8ed703237dde?w=800&auto=format&fit=crop"
  }
];

// Create vectors for each strain based on effects, flavors, and type
export const strainVectors: { [id: string]: number[] } = {};

// This would be replaced with actual vector embeddings in a production environment
// For now, we're using a simple placeholder structure
export function initializeVectors() {
  console.log("Initializing strain vectors");
  
  enhancedStrains.forEach(strain => {
    // In a real implementation, we would use embeddings API to create these vectors
    // For now, we're using placeholder to conceptualize the approach
    strainVectors[strain.id] = [Math.random(), Math.random(), Math.random()];
  });
  
  console.log(`Vectors created for ${Object.keys(strainVectors).length} strains`);
}
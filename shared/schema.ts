import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  mood: text("mood"),
  experienceLevel: text("experience_level"),
  effects: text("effects").array(),
  flavors: text("flavors").array(),
  consumptionMethod: text("consumption_method").array(),
});

export const savedStrains = pgTable("saved_strains", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  strainId: text("strain_id").notNull(),
  savedAt: text("saved_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const userPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true,
});

export const savedStrainSchema = createInsertSchema(savedStrains).omit({
  id: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof userPreferencesSchema>;
export type SavedStrain = typeof savedStrains.$inferSelect;
export type InsertSavedStrain = z.infer<typeof savedStrainSchema>;

export interface Strain {
  id: string;
  name: string;
  breeder: string;
  type: 'Indica' | 'Sativa' | 'Hybrid';
  thcContent: string;
  cbdContent: string;
  terpenes: string[];
  effects: string[];
  flavors: string[];
  rating: number;
  reviewCount: number;
  description: string;
  imageUrl: string;
}

export interface Dispensary {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  distance: number;
  openNow: boolean;
  hours: string;
  amenities: string[];
  imageUrl: string;
  inventory: DispensaryInventory[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface DispensaryInventory {
  strainId: string;
  strainName: string;
  price: number;
  quantity: string;
  inStock: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RecommendationRequest {
  mood: string;
  experienceLevel: string;
  effects?: string[];
  flavors?: string[];
  consumptionMethod?: string[];
}

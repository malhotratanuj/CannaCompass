import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
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

// Strain reviews schema
export const strainReviews = pgTable("strain_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  strainId: text("strain_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  effects: text("effects").array(),
  flavors: text("flavors").array(),
  wouldRecommend: boolean("would_recommend").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community discussions schema
export const communityDiscussions = pgTable("community_discussions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion comments schema
export const discussionComments = pgTable("discussion_comments", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").references(() => communityDiscussions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const strainReviewSchema = createInsertSchema(strainReviews).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const communityDiscussionSchema = createInsertSchema(communityDiscussions).omit({
  id: true,
  userId: true,
  likes: true,
  createdAt: true,
  updatedAt: true,
});

export const discussionCommentSchema = createInsertSchema(discussionComments).omit({
  id: true,
  userId: true,
  likes: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof userPreferencesSchema>;
export type SavedStrain = typeof savedStrains.$inferSelect;
export type InsertSavedStrain = z.infer<typeof savedStrainSchema>;
export type StrainReview = typeof strainReviews.$inferSelect;
export type InsertStrainReview = z.infer<typeof strainReviewSchema>;
export type CommunityDiscussion = typeof communityDiscussions.$inferSelect;
export type InsertCommunityDiscussion = z.infer<typeof communityDiscussionSchema>;
export type DiscussionComment = typeof discussionComments.$inferSelect;
export type InsertDiscussionComment = z.infer<typeof discussionCommentSchema>;

export interface Strain {
  id: string;
  name: string;
  breeder: string;
  type: 'Indica' | 'Sativa' | 'Hybrid' | 'Sativa-dominant' | 'Indica-dominant';
  thcContent: string;
  cbdContent: string;
  terpenes: string[];
  effects: string[];
  flavors: string[];
  rating: number;
  reviewCount: number;
  description: string;
  imageUrl: string;
  // AI-generated recommendation information
  matchReason?: string;          // Personalized reason for this recommendation
  matchScore?: number;           // How well this strain matches preferences (0-100)
  usageTips?: string;            // Practical usage tips
  effectsExplanation?: string;   // Detailed breakdown of expected effects
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
  phone?: string;
  website?: string;
  placeId?: string;  // Google Places ID
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

// Review with user info
export interface ReviewWithUser extends StrainReview {
  username: string;
}

// Discussion with user info
export interface DiscussionWithUser extends CommunityDiscussion {
  username: string;
  commentCount: number;
}

// Comment with user info
export interface CommentWithUser extends DiscussionComment {
  username: string;
}

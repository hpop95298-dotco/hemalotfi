import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),

  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description"),

  imageUrl: text("image_url"),

  liveUrl: text("live_url"),
  githubUrl: text("github_url"),

  technologies: text("technologies").array(),

  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  twoFactorSecret: text("two_factor_secret"),
  isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;   

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"), // Optional: if we want to track anonymous or logged users
  status: text("status").default("active"), // active, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => chatSessions.id).notNull(),
  sender: text("sender").notNull(), // 'user', 'ai', 'admin'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  author: text("author").default("Ibrahim Lotfi"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  proficiency: text("proficiency").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientName: text("client_name").notNull(),
  role: text("role"),
  content: text("content").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export const seoSettings = pgTable("seo_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SEOSetting = typeof seoSettings.$inferSelect;
export type InsertSEOSetting = typeof seoSettings.$inferInsert;

export const visitorLogs = pgTable("visitor_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  path: text("path").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  city: text("city"),
  country: text("country"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const guestbook = pgTable("guestbook", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  aiReply: text("ai_reply"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").references(() => users.id),
  action: text("action").notNull(), // e.g. "DELETE_PROJECT", "UPDATE_POST"
  entityType: text("entity_type").notNull(), // e.g. "projects", "posts"
  entityId: uuid("entity_id"),
  details: text("details"), // JSON or string of changes
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type VisitorLog = typeof visitorLogs.$inferSelect;
export type InsertVisitorLog = typeof visitorLogs.$inferInsert;

export type GuestbookEntry = typeof guestbook.$inferSelect;
export type InsertGuestbookEntry = typeof guestbook.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
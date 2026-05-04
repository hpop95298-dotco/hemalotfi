import { db } from "./db";
import {
  users, projects, messages, chatSessions, chatMessages, posts,
  skills, testimonials, seoSettings, visitorLogs, guestbook, auditLogs
} from "../shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { authenticator } from 'otplib';

import type {
  InsertUser, User, InsertProject, Project, InsertMessage, Message,
  ChatSession, InsertChatSession, ChatMessage, InsertChatMessage,
  Post, InsertPost, Skill, InsertSkill, Testimonial, InsertTestimonial,
  SEOSetting, InsertSEOSetting, VisitorLog, InsertVisitorLog,
  GuestbookEntry, InsertGuestbookEntry, AuditLog, InsertAuditLog
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, passwordHash: string): Promise<boolean>;
  updateUser2FA(id: string, secret: string, enabled: boolean): Promise<boolean>;

  getAllProjects(): Promise<Project[]>;
  getProjectBySlug(slug: string): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  createMessage(data: InsertMessage): Promise<Message>;

  getAllMessages(): Promise<Message[]>;
  getMessagesPaginated(limit: number, offset: number): Promise<Message[]>;

  markMessageAsRead(id: string): Promise<boolean>;
  getUnreadCount(): Promise<number>;

  deleteMessage(id: string): Promise<boolean>;

  // ✅ CHAT
  createChatSession(data: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  addChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  getAllChatSessions(): Promise<ChatSession[]>;

  // ✅ BLOG
  getAllPosts(includeUnpublished?: boolean): Promise<Post[]>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  createPost(data: InsertPost): Promise<Post>;
  updatePost(id: string, data: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;

  // ✅ SKILLS
  getAllSkills(): Promise<Skill[]>;
  createSkill(data: InsertSkill): Promise<Skill>;
  updateSkill(id: string, data: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: string): Promise<boolean>;

  // ✅ TESTIMONIALS
  getAllTestimonials(): Promise<Testimonial[]>;
  createTestimonial(data: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, data: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<boolean>;

  // ✅ SEO
  getSEOSettings(): Promise<SEOSetting[]>;
  updateSEOSetting(key: string, value: string): Promise<SEOSetting>;

  // ✅ ANALYTICS
  logVisitor(data: InsertVisitorLog): Promise<VisitorLog>;
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  getAnalyticsSummary(): Promise<any>;

  // ✅ GUESTBOOK
  createGuestbookEntry(data: InsertGuestbookEntry): Promise<GuestbookEntry>;
  getGuestbookEntries(): Promise<GuestbookEntry[]>;
}

export class DatabaseStorage implements IStorage {

  // =========================
  // 👤 USERS
  // =========================
  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser)
      .returning();

    return result[0];
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, id))
      .returning();

    return result.length > 0;
  }

  async updateUser2FA(id: string, secret: string, enabled: boolean): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        twoFactorSecret: secret, 
        isTwoFactorEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    return result.length > 0;
  }

  // =========================
  // 📦 PROJECTS
  // =========================
  async getAllProjects(includeUnpublished = false): Promise<Project[]> {
    let query = db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    if (!includeUnpublished) {
      query = query.where(eq(projects.isPublished, true)) as any;
    }

    return await query;
  }

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    return project;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const result = await db
      .insert(projects)
      .values(data)
      .returning();

    return result[0];
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // =========================
  // 📩 MESSAGES
  // =========================
  async createMessage(data: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values({
        ...data,
        name: encrypt(data.name),
        email: encrypt(data.email),
        message: encrypt(data.message),
        isRead: false,
      })
      .returning();

    return result[0];
  }

  async getAllMessages(): Promise<Message[]> {
    const msgs = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt));
    
    return msgs.map(m => ({
      ...m,
      name: decrypt(m.name),
      email: decrypt(m.email),
      message: decrypt(m.message)
    }));
  }

  // ✅ Pagination
  async getMessagesPaginated(limit: number, offset: number): Promise<Message[]> {
    const msgs = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return msgs.map(m => ({
      ...m,
      name: decrypt(m.name),
      email: decrypt(m.email),
      message: decrypt(m.message)
    }));
  }

  // ✅ Mark as Read
  async markMessageAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();

    return result.length > 0;
  }

  // ✅ Unread Counter
  async getUnreadCount(): Promise<number> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.isRead, false));

    return result.length;
  }

  // 🗑 Delete
  async deleteMessage(id: string): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();

    return result.length > 0;
  }

  // =========================
  // 💬 CHAT
  // =========================
  async createChatSession(data: InsertChatSession): Promise<ChatSession> {
    const [session] = await db.insert(chatSessions).values(data).returning();
    return session;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async addChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  }

  async getAllChatSessions(): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt));
  }

  // =========================
  // ✍️ BLOG
  // =========================
  async getAllPosts(includeUnpublished = false): Promise<Post[]> {
    let query = db.select().from(posts).orderBy(desc(posts.createdAt));

    if (!includeUnpublished) {
      query = query.where(eq(posts.isPublished, true)) as any;
    }

    return await query;
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
    return post;
  }

  async createPost(data: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(data).returning();
    return post;
  }

  async updatePost(id: string, data: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db.update(posts).set(data).where(eq(posts.id, id)).returning();
    return post;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }

  // =========================
  // 🚀 SKILLS
  // =========================
  async getAllSkills(): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(desc(skills.createdAt));
  }

  async createSkill(data: InsertSkill): Promise<Skill> {
    const [skill] = await db.insert(skills).values(data).returning();
    return skill;
  }

  async updateSkill(id: string, data: Partial<InsertSkill>): Promise<Skill | undefined> {
    const [skill] = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
    return skill;
  }

  async deleteSkill(id: string): Promise<boolean> {
    const result = await db.delete(skills).where(eq(skills.id, id)).returning();
    return result.length > 0;
  }

  // =========================
  // ⭐ TESTIMONIALS
  // =========================
  async getAllTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  }

  async createTestimonial(data: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db.insert(testimonials).values(data).returning();
    return testimonial;
  }

  async updateTestimonial(id: string, data: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [testimonial] = await db.update(testimonials).set(data).where(eq(testimonials.id, id)).returning();
    return testimonial;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    const result = await db.delete(testimonials).where(eq(testimonials.id, id)).returning();
    return result.length > 0;
  }

  // =========================
  // 🔍 SEO settings
  // =========================
  async getSEOSettings(): Promise<SEOSetting[]> {
    return await db.select().from(seoSettings);
  }

  async updateSEOSetting(key: string, value: string): Promise<SEOSetting> {
    const [setting] = await db
      .insert(seoSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: seoSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  // =========================
  // 📉 ANALYTICS
  // =========================
  async logVisitor(data: InsertVisitorLog): Promise<VisitorLog> {
    const [log] = await db.insert(visitorLogs).values(data).returning();
    return log;
  }

  async getAnalyticsSummary(): Promise<any> {
    const [{ count: visitsCount }] = await db.select({ count: sql<number>`count(*)` }).from(visitorLogs);
    const [{ count: messagesCount }] = await db.select({ count: sql<number>`count(*)` }).from(messages);
    const [{ count: projectsCount }] = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const [{ count: postsCount }] = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const [{ count: skillsCount }] = await db.select({ count: sql<number>`count(*)` }).from(skills);
    const [{ count: guestbookCount }] = await db.select({ count: sql<number>`count(*)` }).from(guestbook);

    return {
      visits: Number(visitsCount),
      messages: Number(messagesCount),
      projects: Number(projectsCount),
      posts: Number(postsCount),
      skills: Number(skillsCount),
      guestbook: Number(guestbookCount),
    };
  }

  // =========================
  // 📒 GUESTBOOK
  // =========================
  async createGuestbookEntry(data: InsertGuestbookEntry): Promise<GuestbookEntry> {
    const [entry] = await db.insert(guestbook).values({
      ...data,
      name: encrypt(data.name),
      message: encrypt(data.message)
    }).returning();
    return entry;
  }

  async getGuestbookEntries(): Promise<GuestbookEntry[]> {
    const entries = await db.select().from(guestbook).orderBy(desc(guestbook.createdAt));
    return entries.map(e => ({
      ...e,
      message: decrypt(e.message),
      name: decrypt(e.name)
    }));
  }

  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }
}

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || "fallback-secret-key-at-least-32-chars-long";
// Always hash the key to exactly 32 bytes for AES-256-GCM
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
  console.warn("[SECURITY] ENCRYPTION_KEY is missing or too weak. Using hashed fallback/short key.");
}

const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `v1:${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (e) { return text; }
}

export function decrypt(text: string): string {
  if (!text || !text.startsWith("v1:")) return text;
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const encryptedText = parts[3];
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) { return text; }
}


export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (e) { 
    return false; 
  }
}

export const storage = new DatabaseStorage();
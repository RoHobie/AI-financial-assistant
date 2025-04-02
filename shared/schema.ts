import { pgTable, text, serial, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  profileImage: true,
});

// Financial Goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),
  status: text("status").notNull().default("in_progress"),
  automated: boolean("automated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  name: true,
  description: true,
  category: true,
  targetAmount: true,
  currentAmount: true,
  startDate: true,
  targetDate: true,
  status: true,
  automated: true,
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id"),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // deposit, withdrawal
  category: text("category").notNull(),
  account: text("account").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  goalId: true,
  description: true,
  amount: true,
  type: true,
  category: true,
  account: true,
  date: true,
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // goal_update, insight, reminder
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  read: true,
});

// Financial Insights and Advice
export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // saving, investing, debt, etc.
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInsightSchema = createInsertSchema(insights).pick({
  userId: true,
  goalId: true,
  title: true,
  content: true,
  category: true,
  read: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;

// Dashboard metrics type
export type DashboardMetrics = {
  totalSavings: number;
  savingsIncrease: string;
  activeGoalsCount: number;
  completedGoalsCount: number;
  monthlyBudget: number;
  budgetRemaining: number;
  financialHealthScore: number;
  financialHealthStatus: string;
};

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { 
  insertUserSchema, 
  insertGoalSchema, 
  insertTransactionSchema,
  insertNotificationSchema,
  insertInsightSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcrypt";
import session from "express-session";
import { generateGoalInsight, generateFinancialAdvice } from "./lib/openai";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session storage
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // Prune expired entries every 24h
  });

  // Setup session middleware
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "supersecretkey",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Check if session has a valid user
  const ensureAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Return sanitized user data (no password)
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Return sanitized user data (no password)
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return sanitized user data (no password)
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Goal routes
  app.get("/api/goals", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goals = await storage.getGoalsByUserId(userId);
      res.status(200).json(goals);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/goals/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Check if goal belongs to the authenticated user
      if (goal.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to this goal" });
      }
      
      res.status(200).json(goal);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/goals", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Add user ID to the goal data
      const goalData = { ...req.body, userId };
      
      // Validate goal data
      const validatedData = insertGoalSchema.parse(goalData);
      
      // Create goal
      const goal = await storage.createGoal(validatedData);
      
      // Generate AI insight for the goal
      const progress = Math.round((validatedData.currentAmount / validatedData.targetAmount) * 100);
      const insight = await generateGoalInsight({
        name: goal.name,
        category: goal.category,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        progress,
        description: goal.description
      });
      
      // Store the insight
      await storage.createInsight({
        userId,
        goalId: goal.id,
        title: insight.title,
        content: insight.content,
        category: insight.category,
        read: false
      });
      
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.patch("/api/goals/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Check if goal belongs to the authenticated user
      if (goal.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to this goal" });
      }
      
      // Update goal
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      res.status(200).json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/goals/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Check if goal belongs to the authenticated user
      if (goal.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to this goal" });
      }
      
      // Delete goal
      await storage.deleteGoal(goalId);
      res.status(200).json({ message: "Goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getTransactionsByUserId(userId, limit);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/goals/:goalId/transactions", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Check if goal belongs to the authenticated user
      if (goal.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to this goal" });
      }
      
      const transactions = await storage.getTransactionsByGoalId(goalId);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/transactions", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Add user ID to the transaction data
      const transactionData = { ...req.body, userId };
      
      // If goal ID is provided, verify it belongs to the user
      if (transactionData.goalId) {
        const goal = await storage.getGoal(transactionData.goalId);
        if (!goal) {
          return res.status(404).json({ message: "Goal not found" });
        }
        
        if (goal.userId !== userId) {
          return res.status(403).json({ message: "Unauthorized access to this goal" });
        }
      }
      
      // Validate transaction data
      const validatedData = insertTransactionSchema.parse(transactionData);
      
      // Create transaction
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Notification routes
  app.get("/api/notifications", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/notifications/:id/read", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check if notification belongs to the authenticated user
      if (notification.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to this notification" });
      }
      
      // Mark notification as read
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.status(200).json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Insight routes
  app.get("/api/insights", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const insights = await storage.getInsightsByUserId(userId);
      res.status(200).json(insights);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/goals/:goalId/insights", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Check if goal belongs to the authenticated user
      if (goal.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to this goal" });
      }
      
      const insights = await storage.getInsightsByGoalId(goalId);
      res.status(200).json(insights);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/goals/:goalId/insights", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const goalId = parseInt(req.params.goalId);
      
      // Verify goal exists and belongs to user
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to this goal" });
      }
      
      // Generate new AI insight for the goal
      const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      const insight = await generateGoalInsight({
        name: goal.name,
        category: goal.category,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        progress,
        description: goal.description
      });
      
      // Create the insight
      const newInsight = await storage.createInsight({
        userId,
        goalId,
        title: insight.title,
        content: insight.content,
        category: insight.category,
        read: false
      });
      
      res.status(201).json(newInsight);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Financial Tips
  app.get("/api/financial-tips", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get user data for personalized tips
      const goals = await storage.getGoalsByUserId(userId);
      const metrics = await storage.getDashboardMetrics(userId);
      
      // Transform goals for the AI prompt
      const formattedGoals = goals.map(goal => ({
        name: goal.name,
        category: goal.category,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        progress: Math.round((goal.currentAmount / goal.targetAmount) * 100)
      }));
      
      // Generate personalized financial tips from OpenAI
      const tips = await generateFinancialAdvice({
        goals: formattedGoals,
        totalSavings: metrics.totalSavings,
        activeGoalsCount: metrics.activeGoalsCount
      });
      
      // Add IDs to each tip for React key prop
      const tipsWithIds = tips.map((tip, index) => ({
        id: index + 1,
        ...tip
      }));
      
      res.json({ tips: tipsWithIds });
    } catch (error) {
      console.error("Error generating financial tips:", error);
      res.status(500).json({ message: "Error generating financial tips" });
    }
  });

  // Dashboard
  app.get("/api/dashboard", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get user's metrics
      const metrics = await storage.getDashboardMetrics(userId);
      
      // Get user's goals
      const goals = await storage.getGoalsByUserId(userId);
      
      // Get recent transactions
      const transactions = await storage.getTransactionsByUserId(userId, 5);
      
      // Get unread notifications
      const notifications = await storage.getNotificationsByUserId(userId);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Generate financial advice
      const goalsForAdvice = goals.map(goal => ({
        name: goal.name,
        category: goal.category,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        progress: Math.round((goal.currentAmount / goal.targetAmount) * 100)
      }));
      
      const financialAdvice = await generateFinancialAdvice({
        goals: goalsForAdvice,
        totalSavings: metrics.totalSavings,
        activeGoalsCount: metrics.activeGoalsCount
      });
      
      res.status(200).json({
        metrics,
        goals,
        transactions,
        unreadNotifications,
        financialAdvice
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

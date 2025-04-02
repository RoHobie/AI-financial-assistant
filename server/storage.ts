import { 
  User, InsertUser, 
  Goal, InsertGoal, 
  Transaction, InsertTransaction,
  Notification, InsertNotification,
  Insight, InsertInsight,
  DashboardMetrics
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Goal operations
  getGoal(id: number): Promise<Goal | undefined>;
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]>;
  getTransactionsByGoalId(goalId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Insight operations
  getInsight(id: number): Promise<Insight | undefined>;
  getInsightsByUserId(userId: number): Promise<Insight[]>;
  getInsightsByGoalId(goalId: number): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  
  // Dashboard operations
  getDashboardMetrics(userId: number): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private goals: Map<number, Goal>;
  private transactions: Map<number, Transaction>;
  private notifications: Map<number, Notification>;
  private insights: Map<number, Insight>;
  private userIdCounter: number;
  private goalIdCounter: number;
  private transactionIdCounter: number;
  private notificationIdCounter: number;
  private insightIdCounter: number;

  constructor() {
    this.users = new Map();
    this.goals = new Map();
    this.transactions = new Map();
    this.notifications = new Map();
    this.insights = new Map();
    this.userIdCounter = 1;
    this.goalIdCounter = 1;
    this.transactionIdCounter = 1;
    this.notificationIdCounter = 1;
    this.insightIdCounter = 1;
    
    // Add a demo user
    this.createUser({
      username: "demo",
      password: "$2b$10$XbvAKGC8Z6BHKv3TYywjOuCbmwpYEZXF8TMWrn6A3LgfGrOqjMBPK", // password: "password"
      fullName: "Alex Morgan",
      email: "demo@example.com",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Goal operations
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId,
    );
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const now = new Date();
    const goal: Goal = { 
      ...insertGoal, 
      id,
      createdAt: now
    };
    this.goals.set(id, goal);
    
    // Create a notification for the goal creation
    this.createNotification({
      userId: goal.userId,
      title: "New Goal Created",
      message: `You've set up a new goal: ${goal.name}`,
      type: "goal_update",
      read: false,
    });
    
    return goal;
  }

  async updateGoal(id: number, goalUpdate: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...goalUpdate };
    this.goals.set(id, updatedGoal);
    
    // Create a notification for the goal update if amount changed
    if (goalUpdate.currentAmount !== undefined && goalUpdate.currentAmount !== goal.currentAmount) {
      const action = goalUpdate.currentAmount > goal.currentAmount ? "added to" : "withdrawn from";
      const amount = Math.abs(Number(goalUpdate.currentAmount) - Number(goal.currentAmount));
      
      this.createNotification({
        userId: goal.userId,
        title: "Goal Updated",
        message: `$${amount.toFixed(2)} ${action} your ${goal.name} goal`,
        type: "goal_update",
        read: false,
      });
    }
    
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: number, limit = 10): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getTransactionsByGoalId(goalId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      createdAt: now
    };
    this.transactions.set(id, transaction);
    
    // If associated with a goal, update goal amount
    if (transaction.goalId) {
      const goal = await this.getGoal(transaction.goalId);
      if (goal) {
        const newAmount = transaction.type === "deposit" 
          ? goal.currentAmount + transaction.amount
          : goal.currentAmount - transaction.amount;
          
        await this.updateGoal(goal.id, { currentAmount: newAmount });
      }
    }
    
    return transaction;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id,
      createdAt: now
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    
    return updatedNotification;
  }

  // Insight operations
  async getInsight(id: number): Promise<Insight | undefined> {
    return this.insights.get(id);
  }

  async getInsightsByUserId(userId: number): Promise<Insight[]> {
    return Array.from(this.insights.values())
      .filter(insight => insight.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getInsightsByGoalId(goalId: number): Promise<Insight[]> {
    return Array.from(this.insights.values())
      .filter(insight => insight.goalId === goalId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const id = this.insightIdCounter++;
    const now = new Date();
    const insight: Insight = { 
      ...insertInsight, 
      id,
      createdAt: now
    };
    this.insights.set(id, insight);
    
    // Create a notification for the new insight
    this.createNotification({
      userId: insight.userId,
      title: "New Financial Insight",
      message: insight.title,
      type: "insight",
      read: false,
    });
    
    return insight;
  }

  // Dashboard operations
  async getDashboardMetrics(userId: number): Promise<DashboardMetrics> {
    const userGoals = await this.getGoalsByUserId(userId);
    const activeGoals = userGoals.filter(goal => goal.status === "in_progress");
    const completedGoals = userGoals.filter(goal => goal.status === "completed");
    
    // Calculate total savings
    const totalSavings = userGoals.reduce((total, goal) => total + Number(goal.currentAmount), 0);
    
    // For MVP, we're generating some mock metrics
    const savingsIncrease = "12% from last month";
    const monthlyBudget = 3200;
    const budgetRemaining = 850;
    const financialHealthScore = 72;
    const financialHealthStatus = "Good";
    
    return {
      totalSavings,
      savingsIncrease,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      monthlyBudget,
      budgetRemaining,
      financialHealthScore,
      financialHealthStatus
    };
  }
}

export const storage = new MemStorage();

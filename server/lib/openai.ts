import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-demo-key" });

/**
 * Generates financial advice based on a goal and its progress
 */
export async function generateGoalInsight(goalDetails: {
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  targetDate: Date;
  progress: number; // percentage from 0-100
  description?: string;
}): Promise<{ title: string; content: string; category: string }> {
  try {
    // Default response in case of API failure
    const defaultResponse = {
      title: "Save consistently to reach your goal",
      content: "Regular contributions, even small ones, can help you reach your goal on schedule.",
      category: "saving"
    };

    // Without an API key, return a default response instead of failing
    if (process.env.OPENAI_API_KEY === undefined) {
      return getDefaultInsight(goalDetails);
    }

    const { name, category, targetAmount, currentAmount, startDate, targetDate, progress, description } = goalDetails;
    
    const timeRemaining = Math.round((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const amountRemaining = targetAmount - currentAmount;
    
    const prompt = `
      As a financial advisor for Indian users, give me ONE specific actionable insight for my financial goal:
      
      Goal name: ${name}
      Category: ${category}
      Description: ${description || "N/A"}
      Target amount: ₹${targetAmount}
      Current amount: ₹${currentAmount}
      Progress: ${progress}%
      Time remaining: ${timeRemaining} days
      
      Based only on the information provided, provide ONE financial insight or tip that could help achieve this goal.
      The insight should be practical, specific, and tailored to this goal for an Indian user.
      Consider Indian financial context, regulations and investment options when applicable.
      
      Return only a JSON with two fields:
      - "title": A short, attention-grabbing title for the insight (max 10 words)
      - "content": The actual advice (max 40 words)
      - "category": One of "saving", "investing", "budgeting", "debt", "income", "general"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 250,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      title: result.title || defaultResponse.title,
      content: result.content || defaultResponse.content,
      category: result.category || defaultResponse.category,
    };
  } catch (error) {
    console.error("Error generating goal insight:", error);
    return getDefaultInsight(goalDetails);
  }
}

/**
 * Generates financial advice for the user's dashboard based on their goals and transactions
 */
export async function generateFinancialAdvice(userData: {
  goals: Array<{
    name: string;
    category: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
  }>;
  totalSavings: number;
  activeGoalsCount: number;
}): Promise<Array<{ title: string; content: string; category: string; icon: string }>> {
  try {
    const defaultAdvice = getDefaultFinancialAdvice();
    
    // Without an API key, return default advice instead of failing
    if (process.env.OPENAI_API_KEY === undefined) {
      return defaultAdvice;
    }

    const { goals, totalSavings, activeGoalsCount } = userData;
    
    const prompt = `
      As a financial advisor for Indian users, give me 4 different financial insights or tips based on this user profile:
      
      Total savings: ₹${totalSavings}
      Number of active goals: ${activeGoalsCount}
      
      Goals:
      ${goals.map(g => `- ${g.name} (${g.category}): ₹${g.currentAmount}/₹${g.targetAmount} (${g.progress}% complete)`).join('\n')}
      
      Provide 4 different financial insights covering different areas like spending optimization, interest rates, investment opportunities (like mutual funds, FDs, PPF), and general financial health for Indian users.
      Consider Indian financial context, regulations and investment options when applicable.
      
      Return only a JSON array with 4 objects, each with these fields:
      - "title": A short, attention-grabbing title (max 10 words)
      - "content": The actual advice (max 40 words)
      - "category": One of "saving", "investing", "budgeting", "debt", "income", "general"
      - "icon": One of "savings", "account_balance", "trending_up", "credit_card"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || "[]");
    
    if (Array.isArray(result) && result.length > 0) {
      return result.slice(0, 4).map(item => ({
        title: item.title || "Financial Tip",
        content: item.content || "Regularly review your financial goals and adjust as needed.",
        category: item.category || "general",
        icon: item.icon || "savings"
      }));
    }
    
    return defaultAdvice;
  } catch (error) {
    console.error("Error generating financial advice:", error);
    return getDefaultFinancialAdvice();
  }
}

function getDefaultInsight(goalDetails: any) {
  const { progress, targetAmount, currentAmount } = goalDetails;
  
  if (progress < 30) {
    return {
      title: "Boost your early momentum",
      content: "Consider increasing your monthly contribution by 10% to build momentum toward your goal.",
      category: "saving"
    };
  } else if (progress < 60) {
    return {
      title: "Stay on track with automation",
      content: "Setting up automatic transfers can help ensure consistent progress toward your goal.",
      category: "saving"
    };
  } else {
    return {
      title: "Final stretch strategy",
      content: `You're only ₹${(targetAmount - currentAmount).toFixed(2)} away from your goal! Consider a one-time deposit to finish early.`,
      category: "general"
    };
  }
}

function getDefaultFinancialAdvice() {
  return [
    {
      title: "Spending Optimization",
      content: "Review your monthly subscriptions and eliminate unused services to save approximately ₹1,000-2,000 per month.",
      category: "budgeting",
      icon: "savings"
    },
    {
      title: "Interest Rate Alert",
      content: "Consider FDs or high-yield savings accounts offering better interest rates for your emergency fund.",
      category: "saving",
      icon: "account_balance"
    },
    {
      title: "Investment Opportunity",
      content: "Starting with just ₹5,000/month in mutual funds could potentially grow to over ₹12 lakhs in 10 years.",
      category: "investing",
      icon: "trending_up"
    },
    {
      title: "Tax Saving Tips",
      content: "Invest in PPF, ELSS mutual funds, or NPS to save taxes under Section 80C of Income Tax Act.",
      category: "general",
      icon: "credit_card"
    }
  ];
}

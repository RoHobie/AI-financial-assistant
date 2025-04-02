import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FinancialOverview from "@/components/FinancialOverview";
import FinancialInsights from "@/components/FinancialInsights";
import RecentTransactions from "@/components/RecentTransactions";
import GoalCard from "@/components/GoalCard";
import { Button } from "@/components/ui/button";
import CreateGoalModal from "@/components/CreateGoalModal";
import FinancialTipsCarousel from "@/components/FinancialTipsCarousel";

const Dashboard = () => {
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });
  
  const metrics = dashboardData?.metrics || {
    totalSavings: 0,
    savingsIncrease: "0% from last month",
    activeGoalsCount: 0,
    completedGoalsCount: 0,
    monthlyBudget: 0,
    budgetRemaining: 0,
    financialHealthScore: 0,
    financialHealthStatus: "N/A"
  };
  
  const goals = dashboardData?.goals || [];
  const transactions = dashboardData?.transactions || [];
  const financialAdvice = dashboardData?.financialAdvice || [];
  
  // Create a mapping between goals and their insights
  const goalInsights = {};
  if (dashboardData?.goals && dashboardData?.financialAdvice) {
    // For simplicity, just associate first few insights with first few goals
    for (let i = 0; i < Math.min(goals.length, financialAdvice.length); i++) {
      goalInsights[goals[i].id] = {
        title: financialAdvice[i].title,
        content: financialAdvice[i].content,
        category: financialAdvice[i].category
      };
    }
  }
  
  // Fix any hydration issues with financialAdvice
  useEffect(() => {
    if (dashboardData?.financialAdvice) {
      if (!Array.isArray(dashboardData.financialAdvice)) {
        dashboardData.financialAdvice = [];
      }
    }
  }, [dashboardData]);
  
  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Your Financial Dashboard</h1>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setGoalModalOpen(true)}>
            <span className="material-icons mr-2 text-sm">add</span>
            Create New Goal
          </Button>
        </div>
      </div>
      
      {/* Financial Overview */}
      <FinancialOverview metrics={metrics} isLoading={isLoading} />
      
      {/* Financial Tips Carousel */}
      <FinancialTipsCarousel isLoading={isLoading} />
      
      {/* Goals Progress Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Financial Goals</h3>
            <p className="mt-1 text-sm text-gray-500">Track your progress toward financial targets</p>
          </div>
          <Button variant="link" asChild>
            <a href="/goals">View all goals</a>
          </Button>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm h-96 animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between mb-6">
                      <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-20 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-end space-x-2">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-500 mb-6">Start by creating your first financial goal</p>
              <Button onClick={() => setGoalModalOpen(true)}>
                <span className="material-icons mr-2">add</span>
                Create a goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {goals.slice(0, 3).map((goal) => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  insight={goalInsights[goal.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Financial Insights */}
      <FinancialInsights 
        insights={Array.isArray(financialAdvice) ? financialAdvice : []} 
        isLoading={isLoading} 
      />
      
      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} isLoading={isLoading} />
      
      <CreateGoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => setGoalModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProgressChart from "@/components/ProgressChart";

const GoalDetails = () => {
  const { id } = useParams();
  const goalId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fundAmount, setFundAmount] = useState("");
  
  const { data: goal, isLoading: isLoadingGoal } = useQuery({
    queryKey: [`/api/goals/${goalId}`],
    enabled: !isNaN(goalId),
  });
  
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: [`/api/goals/${goalId}/transactions`],
    enabled: !isNaN(goalId),
  });
  
  const { data: insights = [], isLoading: isLoadingInsights } = useQuery({
    queryKey: [`/api/goals/${goalId}/insights`],
    enabled: !isNaN(goalId),
  });
  
  const addFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/transactions", {
        goalId,
        description: `Deposit to ${goal.name}`,
        amount,
        type: "deposit",
        category: goal.category,
        account: "Primary Account",
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}/transactions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setFundAmount("");
      toast({
        title: "Funds added",
        description: `Successfully added funds to your ${goal.name} goal.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const requestInsightMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/goals/${goalId}/insights`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}/insights`] });
      toast({
        title: "New insight generated",
        description: "A new AI-powered financial insight has been generated for your goal.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate insight. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const withdrawFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/transactions", {
        goalId,
        description: `Withdrawal from ${goal.name}`,
        amount,
        type: "withdrawal",
        category: goal.category,
        account: "Primary Account",
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}/transactions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setFundAmount("");
      toast({
        title: "Funds withdrawn",
        description: `Successfully withdrew funds from your ${goal.name} goal.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to withdraw funds. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleAddFunds = () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    addFundsMutation.mutate(amount);
  };
  
  const handleWithdrawFunds = () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > goal.currentAmount) {
      toast({
        title: "Insufficient funds",
        description: "You cannot withdraw more than your current balance.",
        variant: "destructive",
      });
      return;
    }
    
    withdrawFundsMutation.mutate(amount);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "on_track":
        return "On Track";
      case "needs_attention":
        return "Needs Attention";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "on_track":
        return "bg-green-100 text-green-800";
      case "needs_attention":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "emergency":
        return "bg-blue-50";
      case "home":
        return "bg-green-50";
      case "vacation":
        return "bg-yellow-50";
      case "retirement":
        return "bg-purple-50";
      case "education":
        return "bg-indigo-50";
      case "vehicle":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };
  
  if (isLoadingGoal) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading goal details...</span>
      </div>
    );
  }
  
  if (!goal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Goal not found</h2>
        <p className="text-gray-600 mb-4">The goal you're looking for doesn't exist or you don't have access to it.</p>
        <Button asChild>
          <Link href="/goals">Go back to goals</Link>
        </Button>
      </div>
    );
  }
  
  const progress = Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100);
  
  // Generate chart data from transactions
  const generateChartData = () => {
    if (!transactions || transactions.length === 0) {
      // Default example data if no transactions yet
      const startDate = new Date(goal.startDate);
      const today = new Date();
      const months = [];
      const data = [];
      
      // Fill with monthly data from start date to now
      let currentDate = new Date(startDate);
      while (currentDate <= today) {
        months.push(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        data.push(0); // Start with zero
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Set current amount to last data point
      if (data.length > 0) {
        data[data.length - 1] = Number(goal.currentAmount);
      }
      
      return { labels: months.length > 0 ? months : ['Start', 'Current'], data: data.length > 0 ? data : [0, Number(goal.currentAmount)] };
    }
    
    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const months = new Set();
    const monthlyData = {};
    
    // Initialize with start month
    const startDate = new Date(goal.startDate);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    months.add(startMonth);
    monthlyData[startMonth] = 0;
    
    // Process all transactions
    let runningTotal = 0;
    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.add(month);
      
      const amount = transaction.type === 'deposit' ? Number(transaction.amount) : -Number(transaction.amount);
      runningTotal += amount;
      monthlyData[month] = runningTotal;
    });
    
    // Convert to arrays for chart
    const monthsArray = Array.from(months) as string[];
    const dataArray = monthsArray.map(month => monthlyData[month] || 0);
    
    return { labels: monthsArray, data: dataArray };
  };
  
  const chartData = generateChartData();
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/goals">
                <span className="material-icons text-sm mr-1">arrow_back</span>
                Back to goals
              </Link>
            </Button>
            <Badge className={getStatusColor(goal.status)}>
              {getStatusLabel(goal.status)}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mt-2">{goal.name}</h1>
          <p className="text-gray-600">{goal.description}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => requestInsightMutation.mutate()}
            disabled={requestInsightMutation.isPending}
          >
            <span className="material-icons mr-2 text-sm">lightbulb</span>
            Get New Advice
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Goal Progress Chart */}
          <ProgressChart
            title="Goal Progress Over Time"
            description="Track your progress towards achieving this goal"
            labels={chartData.labels}
            data={chartData.data}
            target={Number(goal.targetAmount)}
            type="line"
          />
          
          {/* Transactions */}
          <Card className="mt-6">
            <CardHeader className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Goal Transactions</h3>
                <p className="mt-1 text-sm text-gray-500">All financial activities related to this goal</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTransactions ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-2">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500 mb-4">Start adding funds to track your progress</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.account}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right tabular-nums ${
                            transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "deposit" ? "+" : "-"}
                            ${Math.abs(Number(transaction.amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          {/* Goal Details Card */}
          <Card className={`overflow-hidden border ${getCategoryColor(goal.category)}`}>
            <CardHeader className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Goal Details</h3>
            </CardHeader>
            <CardContent className="px-4 py-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Progress</span>
                <span className="text-sm font-medium text-gray-900">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5 mb-4" />
              
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p className="font-medium text-gray-500">Current</p>
                  <p className="text-lg font-semibold text-gray-900 tabular-nums">
                    ${Number(goal.currentAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-500">Target</p>
                  <p className="text-lg font-semibold text-gray-900 tabular-nums">
                    ${Number(goal.targetAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-sm text-gray-900">{formatDate(goal.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Target Date</p>
                  <p className="text-sm text-gray-900">{formatDate(goal.targetDate)}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-sm text-gray-900 capitalize">{goal.category}</p>
              </div>
              
              {goal.automated && (
                <div className="mb-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    <span className="material-icons text-sm mr-1">sync</span>
                    Automated Contributions
                  </Badge>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Manage Funds</h4>
                <div className="flex flex-col space-y-2">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Enter amount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleAddFunds}
                      disabled={addFundsMutation.isPending}
                      className="w-full"
                    >
                      <span className="material-icons text-sm mr-1">add</span>
                      Add Funds
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleWithdrawFunds}
                      disabled={withdrawFundsMutation.isPending || goal.currentAmount <= 0}
                      className="w-full"
                    >
                      <span className="material-icons text-sm mr-1">remove</span>
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Insights */}
          <Card className="mt-6">
            <CardHeader className="px-4 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <span className="material-icons text-accent mr-2">lightbulb</span>
                <h3 className="text-lg font-medium text-gray-900">AI Financial Insights</h3>
              </div>
            </CardHeader>
            <CardContent className="px-4 py-4">
              {isLoadingInsights ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full"></div>
                  <span className="ml-2">Loading insights...</span>
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No insights available yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => requestInsightMutation.mutate()}
                    disabled={requestInsightMutation.isPending}
                  >
                    <span className="material-icons mr-2 text-sm">lightbulb</span>
                    Generate New Insight
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="p-3 bg-accent bg-opacity-10 rounded-lg">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">{insight.content}</p>
                      <div className="mt-1 text-xs text-gray-500 flex justify-between">
                        <span>Category: {insight.category}</span>
                        <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {insights.length > 3 && (
                    <div className="text-center">
                      <Button variant="link" className="text-sm">
                        View all {insights.length} insights
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GoalDetails;

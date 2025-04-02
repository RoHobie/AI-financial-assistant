import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface GoalCardProps {
  goal: {
    id: number;
    name: string;
    description: string;
    category: string;
    targetAmount: number;
    currentAmount: number;
    startDate: string;
    targetDate: string;
    status: string;
  };
  insight?: {
    title: string;
    content: string;
    category: string;
  };
}

const GoalCard = ({ goal, insight }: GoalCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fundAmount, setFundAmount] = useState("");
  
  const progress = Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100);
  
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };
  
  const addFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/transactions", {
        goalId: goal.id,
        description: `Deposit to ${goal.name}`,
        amount,
        type: "deposit",
        category: goal.category,
        account: "Primary Account",
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
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
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${getCategoryColor(goal.category)} px-4 py-5 border-b border-gray-200`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
            <p className="text-sm text-gray-500">{goal.description}</p>
          </div>
          <Badge className={getStatusColor(goal.status)}>
            {getStatusLabel(goal.status)}
          </Badge>
        </div>
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
              {formatCurrency(Number(goal.currentAmount))}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-500">Target</p>
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              {formatCurrency(Number(goal.targetAmount))}
            </p>
          </div>
        </div>
        <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
          <span>Started: {formatDate(goal.startDate)}</span>
          <span>Target: {formatDate(goal.targetDate)}</span>
        </div>
        
        {insight && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="material-icons text-accent">lightbulb</span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">AI Insight</h4>
                <p className="mt-1 text-sm text-gray-500">{insight.content}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col space-y-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Enter amount"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
              <button
                onClick={handleAddFunds}
                disabled={addFundsMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {addFundsMutation.isPending ? "Adding..." : "Add Funds"}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-gray-50 flex justify-end">
        <Button variant="outline" asChild>
          <Link href={`/goals/${goal.id}`}>Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoalCard;

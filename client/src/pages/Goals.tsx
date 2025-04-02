import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import GoalCard from "@/components/GoalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateGoalModal from "@/components/CreateGoalModal";

const Goals = () => {
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["/api/goals"],
  });
  
  // Get insights for goals
  const { data: insights = [] } = useQuery({
    queryKey: ["/api/insights"],
    enabled: goals.length > 0,
  });
  
  // Create a mapping between goals and their insights
  const goalInsights = {};
  if (insights && insights.length > 0) {
    insights.forEach((insight) => {
      if (insight.goalId) {
        goalInsights[insight.goalId] = {
          title: insight.title,
          content: insight.content,
          category: insight.category
        };
      }
    });
  }
  
  // Filter goals based on search and filters
  const filteredGoals = goals.filter((goal) => {
    const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || goal.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || goal.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Financial Goals</h1>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setGoalModalOpen(true)}>
            <span className="material-icons mr-2 text-sm">add</span>
            Create New Goal
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="emergency">Emergency Fund</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="home">Home Purchase</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm h-96 animate-pulse">
              <div className="h-20 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {goals.length === 0 ? "No goals found" : "No matching goals"}
          </h3>
          <p className="text-gray-500 mb-6">
            {goals.length === 0 
              ? "Start by creating your first financial goal" 
              : "Try adjusting your search or filters"}
          </p>
          {goals.length === 0 && (
            <Button onClick={() => setGoalModalOpen(true)}>
              <span className="material-icons mr-2">add</span>
              Create a goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              insight={goalInsights[goal.id]}
            />
          ))}
        </div>
      )}
      
      <CreateGoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => setGoalModalOpen(false)}
      />
    </div>
  );
};

export default Goals;

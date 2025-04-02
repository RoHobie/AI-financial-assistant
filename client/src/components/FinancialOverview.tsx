import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface FinancialOverviewProps {
  metrics: {
    totalSavings: number;
    savingsIncrease: string;
    activeGoalsCount: number;
    completedGoalsCount: number;
    monthlyBudget: number;
    budgetRemaining: number;
    financialHealthScore: number;
    financialHealthStatus: string;
  };
  isLoading?: boolean;
}

const FinancialOverview = ({ metrics, isLoading = false }: FinancialOverviewProps) => {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="px-4 py-5 border-b border-gray-200">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-1"></div>
        </CardHeader>
        <CardContent className="px-4 py-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="px-4 py-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Financial Overview</h3>
        <p className="mt-1 text-sm text-gray-500">Your current financial snapshot and progress</p>
      </CardHeader>
      <CardContent className="px-4 py-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Savings */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500 truncate">Total Savings</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">
              {formatCurrency(metrics.totalSavings)}
            </p>
            <div className="flex items-center text-sm text-success mt-2">
              <span className="material-icons text-sm mr-1">trending_up</span>
              <span>{metrics.savingsIncrease}</span>
            </div>
          </div>

          {/* Active Goals */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500 truncate">Active Goals</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.activeGoalsCount}</p>
            <div className="text-sm text-gray-500 mt-2">
              <span>{metrics.completedGoalsCount} completed this year</span>
            </div>
          </div>

          {/* Monthly Budget */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500 truncate">Monthly Budget</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">
              {formatCurrency(metrics.monthlyBudget)}
            </p>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <span>{formatCurrency(metrics.budgetRemaining)} remaining</span>
            </div>
          </div>

          {/* Financial Health Score */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500 truncate">Financial Health Score</p>
            <div className="mt-1 flex items-center">
              <p className="text-2xl font-semibold text-gray-900">{metrics.financialHealthScore}</p>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-success bg-opacity-10 text-success">
                {metrics.financialHealthStatus}
              </span>
            </div>
            <div className="text-sm text-success mt-2 flex items-center">
              <span className="material-icons text-sm mr-1">trending_up</span>
              <span>5 points from last month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialOverview;

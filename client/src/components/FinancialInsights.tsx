import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Insight {
  title: string;
  content: string;
  category: string;
  icon: string;
}

interface FinancialInsightsProps {
  insights: Insight[];
  isLoading?: boolean;
}

const FinancialInsights = ({ insights, isLoading = false }: FinancialInsightsProps) => {
  // Map of category to color classes
  const categoryColors: Record<string, { bg: string; text: string }> = {
    saving: { bg: "bg-blue-100", text: "text-blue-600" },
    investing: { bg: "bg-green-100", text: "text-green-600" },
    budgeting: { bg: "bg-violet-100", text: "text-violet-600" },
    debt: { bg: "bg-yellow-100", text: "text-yellow-600" },
    income: { bg: "bg-indigo-100", text: "text-indigo-600" },
    general: { bg: "bg-gray-100", text: "text-gray-600" },
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="px-4 py-5 border-b border-gray-200">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-1"></div>
        </CardHeader>
        <CardContent className="px-4 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 flex">
                <div className="mr-4 flex-shrink-0 h-12 w-12 rounded-md bg-gray-200 animate-pulse"></div>
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-2"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mt-2"></div>
                </div>
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
        <h3 className="text-lg leading-6 font-medium text-gray-900">Financial Insights</h3>
        <p className="mt-1 text-sm text-gray-500">AI-powered recommendations based on your financial habits</p>
      </CardHeader>
      <CardContent className="px-4 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {insights.map((insight, index) => {
            const colorClass = categoryColors[insight.category] || categoryColors.general;
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 flex">
                <div className="mr-4 flex-shrink-0">
                  <span className={cn("inline-flex items-center justify-center h-12 w-12 rounded-md", colorClass.bg, colorClass.text)}>
                    <span className="material-icons">{insight.icon}</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{insight.title}</h4>
                  <p className="mt-1 text-sm text-gray-500">{insight.content}</p>
                  <a href="#" className="mt-2 text-sm text-primary font-medium hover:text-blue-600">Learn more</a>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialInsights;

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FinancialTip {
  id: number;
  title: string;
  content: string;
  category: string;
  icon: string;
}

interface FinancialTipsCarouselProps {
  isLoading?: boolean;
  variant?: "full" | "compact";
  className?: string;
}

const FinancialTipsCarousel = ({
  isLoading = false,
  variant = "full",
  className
}: FinancialTipsCarouselProps) => {
  // Map of category to color classes
  const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
    saving: { 
      bg: "bg-blue-100", 
      text: "text-blue-600",
      gradient: "from-blue-500 to-blue-700"
    },
    investing: { 
      bg: "bg-green-100", 
      text: "text-green-600",
      gradient: "from-green-500 to-green-700"
    },
    budgeting: { 
      bg: "bg-violet-100", 
      text: "text-violet-600",
      gradient: "from-violet-500 to-violet-700"
    },
    debt: { 
      bg: "bg-yellow-100", 
      text: "text-yellow-600",
      gradient: "from-yellow-500 to-yellow-700"
    },
    income: { 
      bg: "bg-indigo-100", 
      text: "text-indigo-600",
      gradient: "from-indigo-500 to-indigo-700"
    },
    general: { 
      bg: "bg-gray-100", 
      text: "text-gray-600",
      gradient: "from-gray-500 to-gray-700"
    },
  };

  const { data: tipsData, isLoading: isTipsLoading } = useQuery({
    queryKey: ["/api/financial-tips"],
    enabled: !isLoading,
  });

  const [tips, setTips] = useState<FinancialTip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (tipsData?.tips && Array.isArray(tipsData.tips)) {
      setTips(tipsData.tips);
    } else if (!isLoading && !isTipsLoading) {
      // Fallback tips focused on Indian financial context
      setTips([
        {
          id: 1,
          title: "Tax-saving with ELSS",
          content: "ELSS mutual funds offer tax benefits under Section 80C with a shorter 3-year lock-in period compared to other tax-saving options.",
          category: "investing",
          icon: "savings"
        },
        {
          id: 2,
          title: "PPF for Long-term Growth",
          content: "Public Provident Fund (PPF) offers tax-free returns with government backing. Even ₹5,000 monthly can grow significantly over 15 years.",
          category: "saving",
          icon: "account_balance"
        },
        {
          id: 3,
          title: "50-30-20 Budget Rule",
          content: "Allocate 50% of income to necessities, 30% to wants, and 20% to savings. Adjust for Indian context by increasing savings if possible.",
          category: "budgeting",
          icon: "pie_chart"
        },
        {
          id: 4,
          title: "SIP Investments",
          content: "Systematic Investment Plans of ₹2,000-5,000 monthly can help build substantial wealth over time with the power of compounding.",
          category: "investing",
          icon: "trending_up"
        },
        {
          id: 5,
          title: "Digital Payments Benefits",
          content: "UPI and digital wallets offer cashbacks and rewards. Track spending automatically and maintain spending discipline.",
          category: "general",
          icon: "credit_card"
        }
      ]);
    }
  }, [tipsData, isLoading, isTipsLoading]);

  const autoScroll = useCallback(() => {
    if (tips.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }
  }, [tips.length]);

  // Auto-scroll every 7 seconds
  useEffect(() => {
    const timer = setInterval(autoScroll, 7000);
    return () => clearInterval(timer);
  }, [autoScroll]);

  if (isLoading || isTipsLoading) {
    return (
      <div className={cn("w-full overflow-hidden rounded-lg mb-6", className)}>
        <div className="h-52 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (tips.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full mb-6", className)}>
      <Carousel className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Financial Tips for You
          </h3>
          <div className="flex space-x-2">
            <CarouselPrevious className="relative -left-0 h-8 w-8" />
            <CarouselNext className="relative -right-0 h-8 w-8" />
          </div>
        </div>

        <CarouselContent>
          {tips.map((tip, index) => {
            const colorClass = categoryColors[tip.category] || categoryColors.general;
            
            return (
              <CarouselItem key={tip.id || index}>
                <Card className="h-full border-none shadow-md">
                  <CardContent className="p-0">
                    <div className={cn(
                      "rounded-t-lg bg-gradient-to-r p-6",
                      `bg-gradient-to-r ${colorClass.gradient}`
                    )}>
                      <span className="material-icons text-white text-3xl">{tip.icon}</span>
                      <h4 className="text-xl font-bold text-white mt-2">{tip.title}</h4>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-700">{tip.content}</p>
                      
                      {variant === "full" && (
                        <div className="mt-4 flex justify-between items-center">
                          <span className={cn(
                            "text-xs font-medium px-2.5 py-0.5 rounded",
                            colorClass.bg,
                            colorClass.text
                          )}>
                            {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
                          </span>
                          <Button variant="link" size="sm" className="text-primary p-0">
                            Learn more →
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default FinancialTipsCarousel;
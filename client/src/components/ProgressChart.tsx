import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRef, useEffect } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface ProgressChartProps {
  title: string;
  description?: string;
  labels: string[];
  data: number[];
  target?: number;
  type?: "line" | "bar";
  colors?: {
    primary: string;
    background: string;
    target?: string;
  };
}

const ProgressChart = ({
  title,
  description,
  labels,
  data,
  target,
  type = "line",
  colors = {
    primary: "#3B82F6",
    background: "rgba(59, 130, 246, 0.1)",
    target: "#EF4444"
  }
}: ProgressChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;
    
    // Create datasets array with the main data
    const datasets = [
      {
        label: title,
        data,
        borderColor: colors.primary,
        backgroundColor: colors.background,
        tension: 0.2,
        fill: type === "line",
        borderWidth: 2,
      }
    ];
    
    // Add target line if provided
    if (target !== undefined && type === "line") {
      datasets.push({
        label: "Target",
        data: Array(labels.length).fill(target),
        borderColor: colors.target,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      });
    }
    
    // Create chart
    chartInstance.current = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: target !== undefined,
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return "$" + value;
              }
            }
          }
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [title, labels, data, target, type, colors]);

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64">
          <canvas ref={chartRef}></canvas>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;

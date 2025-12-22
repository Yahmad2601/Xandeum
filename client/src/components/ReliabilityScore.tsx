import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

interface ReliabilityScoreProps {
  score?: number;
  rank?: number | null;
  totalNodes?: number;
  trend?: "up" | "down" | "stable";
  className?: string;
}

export function ReliabilityScore({ 
  score = 0, 
  rank, 
  totalNodes,
  trend = "stable",
  className = "" 
}: ReliabilityScoreProps) {
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 99) return "text-x-teal";
    if (score >= 95) return "text-x-purple";
    if (score >= 90) return "text-x-orange";
    if (score >= 80) return "text-x-orange";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 99.5) return "Excellent";
    if (score >= 98) return "Outstanding";
    if (score >= 95) return "Very Good";
    if (score >= 90) return "Good";
    if (score >= 80) return "Fair";
    return "Poor";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 99.5) return "bg-x-teal/10 text-x-teal";
    if (score >= 98) return "bg-x-purple/10 text-x-purple";
    if (score >= 95) return "bg-x-purple/10 text-x-purple";
    if (score >= 90) return "bg-x-orange/10 text-x-orange";
    if (score >= 80) return "bg-x-orange/10 text-x-orange";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Reliability Score
            </p>
          </div>
          
          <div className="flex items-baseline gap-3">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(2)}%
            </div>
            {trend !== "stable" && (
              <div className="flex items-center">
                {trend === "up" ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className={getScoreBadge(score)}>
              {getScoreLabel(score)}
            </Badge>
            {rank && totalNodes && (
              <Badge variant="outline">
                Rank #{rank} of {totalNodes}
              </Badge>
            )}
          </div>
        </div>

        {/* Visual indicator */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted opacity-20"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 35}`}
                strokeDashoffset={`${2 * Math.PI * 35 * (1 - score / 100)}`}
                className={getScoreColor(score)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional context */}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        Based on 7-day uptime history
      </div>
    </Card>
  );
}

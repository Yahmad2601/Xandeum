import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
  color?: "blue" | "teal" | "orange" | "purple" | "green";
}

export function StatCard({ title, value, trend, trendUp, icon, className, color = "blue" }: StatCardProps) {
  const colorStyles = {
    blue: "text-blue-500 bg-blue-500/10",
    teal: "text-teal-500 bg-teal-500/10",
    orange: "text-orange-500 bg-orange-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    green: "text-emerald-500 bg-emerald-500/10",
  };

  return (
    <div className={cn(
      "flex flex-col p-5 bg-secondary/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 h-full justify-between",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={cn("p-2 rounded-lg", colorStyles[color])}>
           {icon || <Activity className="w-4 h-4" />}
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center mt-1 text-xs">
            <span className={cn(
              "flex items-center font-medium", 
              trendUp ? "text-emerald-500" : "text-rose-500"
            )}>
              {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {trend}
            </span>
            <span className="text-muted-foreground ml-2">vs last 24h</span>
          </div>
        )}
      </div>
    </div>
  );
}

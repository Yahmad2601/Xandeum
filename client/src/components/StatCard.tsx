import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, trend, trendUp, icon, className }: StatCardProps) {
  return (
    <div className={cn("stat-card group", className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
        </div>
        <div className="p-2 bg-white/5 rounded-lg text-primary/80 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
          {icon || <Activity className="w-5 h-5" />}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center text-xs">
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
  );
}

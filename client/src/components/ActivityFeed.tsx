import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Package, 
  Clock,
  AlertCircle,
  HardDrive,
  Sparkles
} from "lucide-react";

export interface ActivityEvent {
  id: number;
  type: "earnings" | "upgrade" | "status-change" | "storage-commit" | "new-node";
  nodeId?: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const getEventIcon = (type: ActivityEvent["type"]) => {
  switch (type) {
    case "earnings":
      return <TrendingUp className="w-4 h-4 text-x-teal" />;
    case "upgrade":
      return <Package className="w-4 h-4 text-x-purple" />;
    case "status-change":
      return <AlertCircle className="w-4 h-4 text-x-orange" />;
    case "storage-commit":
      return <HardDrive className="w-4 h-4 text-blue-500" />;
    case "new-node":
      return <Sparkles className="w-4 h-4 text-green-500" />;
  }
};

const getEventColor = (type: ActivityEvent["type"]) => {
  switch (type) {
    case "earnings":
      return "bg-x-teal/10 border-x-teal/20";
    case "upgrade":
      return "bg-x-purple/10 border-x-purple/20";
    case "status-change":
      return "bg-x-orange/10 border-x-orange/20";
    case "storage-commit":
      return "bg-blue-500/10 border-blue-500/20";
    case "new-node":
      return "bg-green-500/10 border-green-500/20";
  }
};

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities?limit=30');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
    
    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Live Network Activity</h2>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={`p-4 rounded-lg border transition-colors ${getEventColor(
              event.type
            )} hover:bg-muted cursor-default`}
            data-testid={`activity-event-${index}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium text-foreground break-words">
                    {event.message}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatTimeAgo(event.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Loading activity...</p>
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
}

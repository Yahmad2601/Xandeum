import React from "react";
import { 
  TrendingUp, 
  Package, 
  Clock,
  AlertCircle 
} from "lucide-react";

export interface ActivityEvent {
  id: string;
  type: "credits" | "version-update" | "status-change";
  nodeId: string;
  message: string;
  timestamp: Date;
}

const generateMockEvents = (): ActivityEvent[] => {
  const nodeIds = ["node-001", "node-015", "node-042", "node-028", "node-037"];
  const versions = ["1.2.3", "1.2.4", "1.3.0", "1.2.5"];
  
  const events: ActivityEvent[] = [];
  const now = new Date();

  // Generate mixed events
  for (let i = 0; i < 8; i++) {
    const nodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const type = i % 2 === 0 ? "credits" : "version-update";
    
    if (type === "credits") {
      events.push({
        id: `event-${i}`,
        type: "credits",
        nodeId,
        message: `${nodeId} earned ${(Math.random() * 500 + 100).toFixed(0)} STOINC credits`,
        timestamp: new Date(now.getTime() - (i * 5 + Math.random() * 2) * 60000),
      });
    } else {
      const newVersion = versions[Math.floor(Math.random() * versions.length)];
      events.push({
        id: `event-${i}`,
        type: "version-update",
        nodeId,
        message: `${nodeId} updated to v${newVersion}`,
        timestamp: new Date(now.getTime() - (i * 8 + Math.random() * 3) * 60000),
      });
    }
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const getEventIcon = (type: ActivityEvent["type"]) => {
  switch (type) {
    case "credits":
      return <TrendingUp className="w-4 h-4 text-x-teal" />;
    case "version-update":
      return <Package className="w-4 h-4 text-x-purple" />;
    case "status-change":
      return <AlertCircle className="w-4 h-4 text-x-orange" />;
  }
};

const getEventColor = (type: ActivityEvent["type"]) => {
  switch (type) {
    case "credits":
      return "bg-x-teal/10 border-x-teal/20";
    case "version-update":
      return "bg-x-purple/10 border-x-purple/20";
    case "status-change":
      return "bg-x-orange/10 border-x-orange/20";
  }
};

export function ActivityFeed() {
  const events = generateMockEvents();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
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
                <p className="text-sm font-medium text-foreground break-words">
                  {event.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(event.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
}

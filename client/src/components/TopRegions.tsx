import React from "react";
import { Globe } from "lucide-react";

export interface RegionData {
  country: string;
  count: number;
  percentage: number;
}

interface TopRegionsProps {
  nodes: any[];
}

export function TopRegions({ nodes }: TopRegionsProps) {
  // Calculate node count by country
  const countryMap = new Map<string, number>();
  nodes.forEach((node) => {
    const count = countryMap.get(node.country) || 0;
    countryMap.set(node.country, count + 1);
  });

  // Convert to array and sort by count
  const regionData: RegionData[] = Array.from(countryMap.entries())
    .map(([country, count]) => ({
      country,
      count,
      percentage: (count / nodes.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const getRegionColor = (index: number) => {
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-purple-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Top Regions</h3>
      </div>

      <div className="space-y-3">
        {regionData.map((region, index) => (
          <div key={region.country} className="space-y-2" data-testid={`region-${region.country}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{region.country}</span>
              <span className="text-muted-foreground text-xs">
                {region.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${getRegionColor(index)} transition-all duration-500`}
                style={{ width: `${region.percentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {region.count} node{region.count !== 1 ? "s" : ""}
            </div>
          </div>
        ))}
      </div>

      {regionData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No regions data</p>
        </div>
      )}
    </div>
  );
}

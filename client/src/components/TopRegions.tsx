import React, { useState } from "react";
import { Globe, ChevronUp, ChevronDown } from "lucide-react";

export interface RegionData {
  country: string;
  count: number;
  percentage: number;
}

interface TopRegionsProps {
  nodes: any[];
}

const countryInfo: Record<string, { name: string; flag: string }> = {
  "US": { name: "United States", flag: "🇺🇸" },
  "DE": { name: "Germany", flag: "🇩🇪" },
  "UK": { name: "United Kingdom", flag: "🇬🇧" },
  "GB": { name: "United Kingdom", flag: "🇬🇧" },
  "JP": { name: "Japan", flag: "🇯🇵" },
  "SG": { name: "Singapore", flag: "🇸🇬" },
  "BR": { name: "Brazil", flag: "🇧🇷" },
  "AU": { name: "Australia", flag: "🇦🇺" },
  "CA": { name: "Canada", flag: "🇨🇦" },
  "IN": { name: "India", flag: "🇮🇳" },
  "FR": { name: "France", flag: "🇫🇷" },
};

export function TopRegions({ nodes }: TopRegionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
      "bg-x-teal",
      "bg-x-purple",
      "bg-x-orange",
      "bg-primary",
      "bg-x-teal",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col gap-3 transition-all duration-300">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Top Regions</h3>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </div>

      {isExpanded && (
        <div className="space-y-2 pb-2 border-b border-border/50">
          {regionData.map((region, index) => {
            const info = countryInfo[region.country] || { name: region.country, flag: "🏳️" };
            const countryCode = region.country.toLowerCase() === 'uk' ? 'gb' : region.country.toLowerCase();
            
            return (
              <div key={region.country} className="space-y-1" data-testid={`region-${region.country}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    <img 
                      src={`https://flagcdn.com/w40/${countryCode}.png`}
                      alt={info.name}
                      className="w-5 h-3.5 object-cover rounded-[2px]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <span className="hidden">{info.flag}</span>
                    {info.name}
                  </span>
                  <span className="text-muted-foreground">
                    {region.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getRegionColor(index)} transition-all duration-500`}
                    style={{ width: `${region.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground text-right">
                  {region.count} node{region.count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
          
          {regionData.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-xs">No regions data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

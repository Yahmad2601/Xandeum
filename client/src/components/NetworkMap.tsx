import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import type { Node } from "@shared/schema";

// Mock coordinates for demo purposes based on country names
// In a real app, you'd use a geolocation API or proper lat/long in DB
const countryCoordinates: Record<string, [number, number]> = {
  "USA": [-95.7129, 37.0902],
  "Germany": [10.4515, 51.1657],
  "UK": [-3.4359, 55.3781],
  "Japan": [138.2529, 36.2048],
  "Singapore": [103.8198, 1.3521],
  "Brazil": [-51.9253, -14.2350],
  "Australia": [133.7751, -25.2744],
  "Canada": [-106.3468, 56.1304],
  "India": [78.9629, 20.5937],
  "France": [2.2137, 46.2276],
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface NetworkMapProps {
  nodes: Node[];
}

export function NetworkMap({ nodes }: NetworkMapProps) {
  // Aggregate nodes by country for marker size
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach(node => {
      counts[node.country] = (counts[node.country] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const sizeScale = scaleLinear()
    .domain([0, Math.max(...Object.values(countryCounts), 1)])
    .range([4, 15]);

  return (
    <div className="w-full h-[400px] bg-card/30 rounded-2xl border border-white/5 overflow-hidden shadow-inner relative">
      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-mono text-muted-foreground border border-white/10">
        LIVE NETWORK STATUS
      </div>
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
        }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth={0.5}
                style={{
                  default: { fill: "#1e293b", outline: "none" },
                  hover: { fill: "#334155", outline: "none" },
                  pressed: { fill: "#334155", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {Object.entries(countryCounts).map(([country, count]) => {
          const coords = countryCoordinates[country] || [0, 0];
          // Add slight randomization to prevent perfect stacking if multiple markers
          // But since we aggregate by country, we just show one pulse per country
          
          return (
            <Marker key={country} coordinates={coords}>
              <circle r={sizeScale(count)} fill="rgba(59, 130, 246, 0.5)" />
              <circle r={sizeScale(count) * 0.6} fill="#3b82f6" />
              <text
                textAnchor="middle"
                y={sizeScale(count) + 12}
                style={{ fontFamily: "var(--font-mono)", fontSize: "8px", fill: "#94a3b8" }}
              >
                {country} ({count})
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}

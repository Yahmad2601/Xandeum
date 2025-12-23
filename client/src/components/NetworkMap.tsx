import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({ coordinates: [50, 0], zoom: 1 });

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

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.2 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.2 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  const mapContent = (
    <>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="#1e293b"
              stroke="#334155"
              strokeWidth={0.5}
              style={{
                default: { fill: "#1e293b", outline: "none" },
                hover: { fill: "#334155", outline: "none" },
                pressed: { fill: "#475569", outline: "none" },
              }}
            />
          ))
        }
      </Geographies>

      {Object.entries(countryCounts).map(([country, count]) => {
        const coords = countryCoordinates[country] || [0, 0];
        return (
          <Marker key={country} coordinates={coords}>
            <g transform={`scale(${sizeScale(count)/8})`}>
              <image href="/snowman.png" x="-12" y="-12" height="24" width="24" />
            </g>
            <text
              textAnchor="middle"
              y={sizeScale(count) + 12}
              style={{ fontFamily: "var(--font-mono)", fontSize: "8px", fill: "#94a3b8", textShadow: "0 1px 2px black" }}
            >
              {country} ({count})
            </text>
          </Marker>
        );
      })}
    </>
  );

  return (
    <>
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" 
          onClick={() => setIsExpanded(false)}
        />
      )}
      {isExpanded && <div className="w-full h-[500px]" />}
      <div 
        className={`bg-[#020617] border border-border overflow-hidden shadow-inner group ${
          isExpanded 
            ? "fixed top-[5vh] left-[2.5vw] w-[95vw] h-[90vh] z-[100] rounded-2xl shadow-2xl border-2 border-primary/50" 
            : "relative w-full h-[500px] rounded-2xl transition-all duration-300 ease-in-out"
        }`}
      >
      {/* Christmas Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1544084944-152696a63f72?q=80&w=1000&auto=format&fit=crop")',
        }}
      />

      {/* Christmas Snow Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-80">
        <style>{`
          @keyframes snowfall {
            0% { transform: translateY(-10px) translateX(0); opacity: 0.8; }
            100% { transform: translateY(500px) translateX(20px); opacity: 0; }
          }
        `}</style>
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animation: `snowfall ${Math.random() * 5 + 5}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: "0 0 5px rgba(255,255,255,0.8)"
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-slate-200 border border-slate-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        
        {isExpanded && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-slate-200 border border-slate-700"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-slate-200 border border-slate-700"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#0f172a]/80 backdrop-blur-sm rounded-full text-xs font-mono text-slate-400 border border-slate-800 shadow-sm flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        LIVE NETWORK STATUS
      </div>
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: isExpanded ? 200 : 120,
          center: [50, 0]
        }}
        className="w-full h-full relative z-1"
      >
        {isExpanded ? (
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            maxZoom={4}
          >
            {mapContent}
          </ZoomableGroup>
        ) : (
          mapContent
        )}
      </ComposableMap>
    </div>
    </>
  );
}

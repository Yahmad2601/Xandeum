import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Node } from "@shared/schema";

// Comprehensive location coordinates (city/country based)
// Format: [longitude, latitude]
const locationCoordinates: Record<string, [number, number]> = {
  // North America
  "USA": [-95.7129, 37.0902],
  "United States": [-95.7129, 37.0902],
  "Canada": [-106.3468, 56.1304],
  "Los Angeles": [-118.2437, 34.0522],
  "New York": [-74.0060, 40.7128],
  "Chicago": [-87.6298, 41.8781],
  "Miami": [-80.1918, 25.7617],
  "Seattle": [-122.3321, 47.6062],
  "Dallas": [-96.7970, 32.7767],
  "Atlanta": [-84.3880, 33.7490],
  "Boston": [-71.0589, 42.3601],
  "Toronto": [-79.3832, 43.6532],
  "Vancouver": [-123.1207, 49.2827],
  
  // Europe
  "Germany": [10.4515, 51.1657],
  "UK": [-3.4359, 55.3781],
  "United Kingdom": [-3.4359, 55.3781],
  "France": [2.2137, 46.2276],
  "Netherlands": [5.2913, 52.1326],
  "Sweden": [18.6435, 60.1282],
  "Switzerland": [8.2275, 46.8182],
  "Finland": [25.7482, 61.9241],
  "Spain": [-3.7038, 40.4168],
  "Romania": [24.9668, 45.9432],
  "Poland": [19.1451, 51.9194],
  "Italy": [12.5674, 41.8719],
  "Belgium": [4.4699, 50.5039],
  "Austria": [14.5501, 47.5162],
  "Norway": [8.4689, 60.4720],
  "Denmark": [9.5018, 56.2639],
  "Berlin": [13.4050, 52.5200],
  "London": [-0.1276, 51.5074],
  "Paris": [2.3522, 48.8566],
  "Amsterdam": [4.9041, 52.3676],
  "Stockholm": [18.0686, 59.3293],
  "Frankfurt": [8.6821, 50.1109],
  "Frankfurt am Main": [8.6821, 50.1109],
  "Munich": [11.5820, 48.1351],
  "Nuremberg": [11.0767, 49.4521],
  "Düsseldorf": [6.7735, 51.2277],
  "Karlsruhe": [8.4037, 49.0069],
  "Falkenstein": [12.3692, 50.4773],
  "Zurich": [8.5417, 47.3769],
  "Jona": [8.8356, 47.2289],
  "Helsinki": [24.9384, 60.1699],
  "Madrid": [-3.7038, 40.4168],
  "Barcelona": [2.1734, 41.3851],
  "Bucharest": [26.1025, 44.4268],
  "Warsaw": [21.0122, 52.2297],
  "Rome": [12.4964, 41.9028],
  "Milan": [9.1900, 45.4642],
  "Vienna": [16.3738, 48.2082],
  "Brussels": [4.3517, 50.8503],
  "Oslo": [10.7522, 59.9139],
  "Copenhagen": [12.5683, 55.6761],
  "Lauterbourg": [8.1806, 48.9747],
  "Sundbyberg": [17.9711, 59.3617],
  "Malmo": [13.0038, 55.6050],
  "Portsmouth": [-1.0872, 50.8198],
  "Poplar": [-0.0180, 51.5077],
  "Nottingham": [-1.1581, 52.9548],
  
  // Asia
  "Japan": [138.2529, 36.2048],
  "Singapore": [103.8198, 1.3521],
  "India": [78.9629, 20.5937],
  "China": [104.1954, 35.8617],
  "South Korea": [127.7669, 35.9078],
  "Hong Kong": [114.1694, 22.3193],
  "Taiwan": [120.9605, 23.6978],
  "Thailand": [100.5018, 15.8700],
  "Vietnam": [108.2772, 14.0583],
  "Indonesia": [113.9213, -0.7893],
  "Malaysia": [101.9758, 4.2105],
  "Philippines": [121.7740, 12.8797],
  "Tokyo": [139.6917, 35.6762],
  "Seoul": [126.9780, 37.5665],
  "Mumbai": [72.8777, 19.0760],
  "Bangalore": [77.5946, 12.9716],
  "Bengaluru": [77.5946, 12.9716],
  "New Delhi": [77.1025, 28.7041],
  "Surat": [72.8311, 21.1702],
  "Shanghai": [121.4737, 31.2304],
  "Beijing": [116.4074, 39.9042],
  "Taipei": [121.5654, 25.0330],
  "Bangkok": [100.5018, 13.7563],
  "Ho Chi Minh City": [106.6297, 10.8231],
  "Jakarta": [106.8650, -6.2088],
  "Kuala Lumpur": [101.6869, 3.1390],
  "Manila": [120.9842, 14.5995],
  
  // Oceania
  "Australia": [133.7751, -25.2744],
  "New Zealand": [174.8860, -40.9006],
  "Sydney": [151.2093, -33.8688],
  "Melbourne": [144.9631, -37.8136],
  "Brisbane": [153.0251, -27.4698],
  "Hamilton": [175.2528, -37.7870],
  "Perth": [115.8605, -31.9505],
  "Auckland": [174.7633, -36.8485],
  "Wellington": [174.7762, -41.2865],
  
  // South America
  "Brazil": [-51.9253, -14.2350],
  "Argentina": [-63.6167, -38.4161],
  "Chile": [-71.5430, -35.6751],
  "Colombia": [-74.2973, 4.5709],
  "Peru": [-75.0152, -9.1900],
  "Sao Paulo": [-46.6333, -23.5505],
  "Rio de Janeiro": [-43.1729, -22.9068],
  "Buenos Aires": [-58.3816, -34.6037],
  "Santiago": [-70.6693, -33.4489],
  "Bogota": [-74.0721, 4.7110],
  "Lima": [-77.0428, -12.0464],
  
  // Middle East
  "UAE": [53.8478, 23.4241],
  "Dubai": [55.2708, 25.2048],
  "Saudi Arabia": [45.0792, 23.8859],
  "Israel": [34.8516, 31.0461],
  "Turkey": [35.2433, 38.9637],
  "Tel Aviv": [34.7818, 32.0853],
  "Istanbul": [28.9784, 41.0082],
  "Ankara": [32.8597, 39.9334],
  
  // Africa
  "South Africa": [22.9375, -30.5595],
  "Nigeria": [8.6753, 9.0820],
  "Kenya": [37.9062, -0.0236],
  "Egypt": [30.8025, 26.8206],
  "Cape Town": [18.4241, -33.9249],
  "Johannesburg": [28.0473, -26.2041],
  "Port Harcourt": [7.0498, 4.8156],
  "Nairobi": [36.8219, -1.2921],
  "Cairo": [31.2357, 30.0444],
  
  // Additional US Cities
  "St Louis": [-90.1994, 38.6270],
  "Orangeburg": [-80.8557, 33.4918],
  "Bettendorf": [-90.5151, 41.5245],
  "Manassas": [-77.4753, 38.7509],
  "Washington": [-77.0369, 38.9072],
  "Vicksburg": [-90.8779, 32.3526],
  "Ashburn": [-77.4874, 39.0438],
  "Council Bluffs": [-95.8608, 41.261921],
  "Cairo": [31.2357, 30.0444]
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface NetworkMapProps {
  nodes: Node[];
}

export function NetworkMap({ nodes }: NetworkMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({ coordinates: [50, 0], zoom: 1 });
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);

  // Create individual markers for each unique city location
  const locationClusters = useMemo(() => {
    const clusters = new Map<string, { location: string; coords: [number, number]; nodes: Node[] }>();
    
    nodes.forEach((node) => {
      // Try city first
      let location = node.city && node.city !== "Unknown" ? node.city : null;
      let coords = location ? locationCoordinates[location] : null;
      
      // If city not found in coordinates, try country
      if (!coords) {
        location = node.country;
        coords = locationCoordinates[node.country];
      }
      
      // If still not found, skip this node
      if (!coords || !location) {
        console.warn(`No coordinates found for node in ${node.city || 'Unknown'}, ${node.country}`);
        return;
      }
      
      // Group by location name to cluster nodes in same city
      if (!clusters.has(location)) {
        clusters.set(location, { location, coords, nodes: [] });
      }
      
      clusters.get(location)!.nodes.push(node);
    });
    
    return Array.from(clusters.values());
  }, [nodes]);

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

      {locationClusters.map((cluster) => {
        const count = cluster.nodes.length;
        const clusterKey = `${cluster.location}-${cluster.coords[0]}-${cluster.coords[1]}`;
        const isHovered = hoveredCluster === clusterKey;
        
        return (
          <Marker key={clusterKey} coordinates={cluster.coords}>
            <g
              onMouseEnter={() => setHoveredCluster(clusterKey)}
              onMouseLeave={() => setHoveredCluster(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Default dot pointer */}
              {!isHovered && (
                <circle
                  r={4}
                  fill="#3b82f6"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))"
                  }}
                />
              )}
              
              {/* Snowman and text on hover */}
              {isHovered && (
                <>
                  <image href="/snowman.png" x="-12" y="-12" height="24" width="24" />
                  <text
                    textAnchor="middle"
                    y={18}
                    style={{ 
                      fontFamily: "var(--font-mono)", 
                      fontSize: "8px", 
                      fill: "#94a3b8", 
                      textShadow: "0 1px 2px black",
                      fontWeight: "bold"
                    }}
                  >
                    {count > 1 ? `${cluster.location} (${count})` : cluster.location}
                  </text>
                </>
              )}
            </g>
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
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden opacity-80">
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

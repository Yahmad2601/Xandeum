import React, { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface Node {
  status: string;
  uptimeScore: number;
  version: string;
  totalStorage: number;
  storageUsed: number;
}

interface NetworkHealthProps {
  nodes: Node[];
}

export function NetworkHealth({ nodes }: NetworkHealthProps) {
  // Calculate comprehensive network health score
  const calculateHealthScore = () => {
    if (nodes.length === 0) return 0;

    // 1. Online percentage (40% weight) - ratio of active nodes
    const activeNodes = nodes.filter(n => n.status === "online").length;
    const onlineScore = (activeNodes / nodes.length) * 100;

    // 2. Average uptime score (30% weight)
    const avgUptimeScore = nodes.reduce((acc, node) => acc + (node.uptimeScore || 0), 0) / nodes.length;

    // 3. Storage utilization (15% weight) - penalize if too low or too high
    const totalStorageGB = nodes.reduce((acc, n) => acc + n.totalStorage, 0);
    const usedStorageGB = nodes.reduce((acc, n) => acc + (n.storageUsed || 0) / 1024, 0);
    const utilizationPercent = totalStorageGB > 0 ? (usedStorageGB / totalStorageGB) * 100 : 0;
    // Ideal utilization: 20-80%, penalize if outside this range
    let storageScore = 100;
    if (utilizationPercent < 20) {
      storageScore = (utilizationPercent / 20) * 100; // Scale 0-20% to 0-100%
    } else if (utilizationPercent > 80) {
      storageScore = ((100 - utilizationPercent) / 20) * 100; // Scale 80-100% to 100-0%
    }

    // 4. Version uniformity (15% weight) - prefer recent versions
    const versionCounts = new Map<string, number>();
    nodes.forEach(n => {
      const count = versionCounts.get(n.version) || 0;
      versionCounts.set(n.version, count + 1);
    });
    const majorityVersionCount = Math.max(...Array.from(versionCounts.values()));
    const versionScore = (majorityVersionCount / nodes.length) * 100;

    // Weighted average
    const healthScore = (
      onlineScore * 0.40 +
      avgUptimeScore * 0.30 +
      storageScore * 0.15 +
      versionScore * 0.15
    );

    return Math.min(100, Math.max(0, healthScore));
  };

  const targetHealth = calculateHealthScore();
  const [healthPercentage, setHealthPercentage] = useState(0);

  useEffect(() => {
    const duration = 1500; // ms
    const startTime = performance.now();
    const startValue = healthPercentage;
    const change = targetHealth - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      setHealthPercentage(startValue + change * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetHealth]);
  
  const data = [
    {
      name: "Health",
      value: healthPercentage,
      fill: "url(#healthGradient)",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden min-h-[250px]">
       <h3 className="text-lg font-medium text-muted-foreground mb-2 absolute top-6 left-6">Network Health</h3>
       
       <div className="relative w-full h-[260px] mt-4">
         <ResponsiveContainer width="100%" height="100%">
           <RadialBarChart 
             cx="50%" 
             cy="50%" 
             innerRadius="70%" 
             outerRadius="100%" 
             barSize={24} 
             data={data} 
             startAngle={234} 
             endAngle={-54}
           >
             <defs>
               <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
                 <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
               </filter>
               <linearGradient id="healthGradient" x1="0" y1="0" x2="1" y2="1">
                 <stop offset="0%" stopColor="#14b8a6" />
                 <stop offset="100%" stopColor="#3b82f6" />
               </linearGradient>
             </defs>
             <RadialBar
               background
               dataKey="value"
               cornerRadius={12}
               isAnimationActive={false}
             />
             <PolarAngleAxis 
               type="number" 
               domain={[0, 100]} 
               angleAxisId={0} 
               tick={(props) => {
                 const { cx, cy, x, y } = props;
                 if (!cx || !cy) return <g />;
                 const r = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
                 const newR = r * 0.85;
                 const angle = Math.atan2(y - cy, x - cx);
                 const newX = cx + newR * Math.cos(angle);
                 const newY = cy + newR * Math.sin(angle);
                 const angleDeg = angle * (180 / Math.PI);
                 return (
                   <g transform={`translate(${newX}, ${newY}) rotate(${angleDeg})`}>
                     <path
                       d="M 14 -9 L 14 9 L -2 9 L -10 0 L -2 -9 Z"
                       fill="white"
                       filter="url(#markerShadow)"
                     />
                   </g>
                 );
               }}
               ticks={[healthPercentage] as any}
             />
           </RadialBarChart>
         </ResponsiveContainer>
         <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{healthPercentage.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground mt-1">
              {healthPercentage >= 80 ? "Excellent" : healthPercentage >= 60 ? "Good" : healthPercentage >= 40 ? "Fair" : "Poor"}
            </span>
         </div>
       </div>
       
       <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Mainnet Beta Active
       </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface NetworkHealthProps {
  activeNodes: number;
  totalNodes: number;
}

export function NetworkHealth({ activeNodes, totalNodes }: NetworkHealthProps) {
  const targetHealth = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 0;
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
            <span className="text-sm text-muted-foreground mt-1">{activeNodes}/{totalNodes} Nodes</span>
         </div>
       </div>
       
       <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Mainnet Beta Active
       </div>
    </div>
  );
}

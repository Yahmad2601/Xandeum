import React from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface NetworkHealthProps {
  activeNodes: number;
  totalNodes: number;
}

export function NetworkHealth({ activeNodes, totalNodes }: NetworkHealthProps) {
  const healthPercentage = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 0;
  
  const data = [
    {
      name: "Health",
      value: healthPercentage,
      fill: "#14b8a6", // x-teal
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
             <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
             <RadialBar
               background
               dataKey="value"
               cornerRadius={12}
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

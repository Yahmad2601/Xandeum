import React from "react";

interface NetworkHealthProps {
  activeNodes: number;
  totalNodes: number;
}

export function NetworkHealth({ activeNodes, totalNodes }: NetworkHealthProps) {
  const healthPercentage = (activeNodes / totalNodes) * 100;

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-pulse" />
            <div className="absolute inset-1 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-sm font-semibold text-emerald-400">Mainnet Beta</span>
        </div>
        <span className="text-sm font-mono text-muted-foreground">
          {activeNodes}/{totalNodes} Online
        </span>
      </div>
      <div className="w-full h-2 bg-emerald-500/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${healthPercentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Network Health: {healthPercentage.toFixed(1)}%
      </p>
    </div>
  );
}

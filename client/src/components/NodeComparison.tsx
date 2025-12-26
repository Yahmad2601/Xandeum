import React, { useState } from "react";
import { Node } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  GitCompare, 
  X, 
  TrendingUp, 
  HardDrive, 
  Coins, 
  Activity, 
  Clock, 
  Globe, 
  Server, 
  Search, 
  Check,
  Zap,
  Shield,
  Cpu,
  ArrowLeftRight,
  Trash2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NodeComparisonProps {
  nodes: Node[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const countryNames: Record<string, string> = {
  "US": "United States",
  "DE": "Germany",
  "UK": "United Kingdom",
  "GB": "United Kingdom",
  "JP": "Japan",
  "SG": "Singapore",
  "BR": "Brazil",
  "AU": "Australia",
  "CA": "Canada",
  "IN": "India",
  "FR": "France",
  "NL": "Netherlands",
  "IE": "Ireland",
  "SE": "Sweden",
  "CH": "Switzerland",
  "FI": "Finland",
  "ES": "Spain",
  "RO": "Romania",
  "NZ": "New Zealand",
  "NG": "Nigeria",
};

const XandeumLogoMark = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="xandeum-teal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#04c8c4" />
        <stop offset="100%" stopColor="#00a091" />
      </linearGradient>
      <linearGradient id="xandeum-orange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f6a21e" />
        <stop offset="100%" stopColor="#f36c1e" />
      </linearGradient>
      <linearGradient id="xandeum-purple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7a2cbc" />
        <stop offset="100%" stopColor="#c8239e" />
      </linearGradient>
    </defs>
    <polygon points="10,20 40,20 52,50 32,50" fill="url(#xandeum-teal)" />
    <polygon points="10,80 40,80 52,50 32,50" fill="url(#xandeum-orange)" />
    <polygon points="90,20 60,20 48,50 68,50" fill="url(#xandeum-orange)" />
    <polygon points="90,80 60,80 48,50 68,50" fill="url(#xandeum-teal)" />
    <polygon points="38,38 50,50 38,62 26,50" fill="url(#xandeum-purple)" />
    <polygon points="62,38 74,50 62,62 50,50" fill="url(#xandeum-purple)" />
  </svg>
);

export function NodeComparison({ nodes, open, onOpenChange }: NodeComparisonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? (open as boolean) : internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [node1, setNode1] = useState<string>("");
  const [node2, setNode2] = useState<string>("");
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  const selectedNode1 = nodes.find(n => n.pubkey === node1);
  const selectedNode2 = nodes.find(n => n.pubkey === node2);

  const ComparisonMetric = ({ 
    icon: Icon, 
    label, 
    value1, 
    value2, 
    unit = "", 
    isBetter = (a: number, b: number) => a > b 
  }: { 
    icon: any; 
    label: string; 
    value1: number | string; 
    value2: number | string; 
    unit?: string;
    isBetter?: (a: number, b: number) => boolean;
  }) => {
    const numValue1 = typeof value1 === 'number' ? value1 : parseFloat(value1.toString()) || 0;
    const numValue2 = typeof value2 === 'number' ? value2 : parseFloat(value2.toString()) || 0;
    
    const node1Better = isBetter(numValue1, numValue2);
    const node2Better = isBetter(numValue2, numValue1);
    const isEqual = numValue1 === numValue2;

    // Calculate percentage for the bar
    const total = numValue1 + numValue2;
    const p1 = total > 0 ? (numValue1 / total) * 100 : 50;
    const p2 = total > 0 ? (numValue2 / total) * 100 : 50;

    return (
      <div className="group relative py-6 border-b border-border/50 last:border-0">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "flex-1 text-right pr-8 transition-all duration-300",
            node1Better ? "text-foreground font-bold scale-105" : "text-muted-foreground"
          )}>
            <div className="text-2xl font-mono">{value1}{unit}</div>
          </div>

          <div className="flex flex-col items-center justify-center w-32 shrink-0">
            <div className="p-2 rounded-full bg-muted/50 mb-1 group-hover:bg-primary/10 transition-colors">
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center">{label}</span>
          </div>

          <div className={cn(
            "flex-1 text-left pl-8 transition-all duration-300",
            node2Better ? "text-foreground font-bold scale-105" : "text-muted-foreground"
          )}>
            <div className="text-2xl font-mono">{value2}{unit}</div>
          </div>
        </div>

        {/* Comparison Bar */}
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted/30 px-4">
          <div className="flex w-full h-full rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out",
                node1Better ? "bg-primary" : "bg-muted-foreground/30"
              )} 
              style={{ width: `${p1}%` }} 
            />
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out",
                node2Better ? "bg-primary" : "bg-muted-foreground/30"
              )} 
              style={{ width: `${p2}%` }} 
            />
          </div>
        </div>
      </div>
    );
  };

  const NodeSelector = ({ 
    node, 
    onSelect, 
    open, 
    setOpen, 
    label,
    otherNodeId 
  }: { 
    node: Node | undefined; 
    onSelect: (id: string) => void; 
    open: boolean; 
    setOpen: (open: boolean) => void;
    label: string;
    otherNodeId: string;
  }) => (
    <div className="flex-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full h-auto p-4 flex flex-col items-start gap-1 border-2 transition-all",
              node ? "border-primary/20 bg-primary/5" : "border-dashed border-muted-foreground/20 hover:border-primary/40"
            )}
          >
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</span>
            {node ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                  <Server className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="font-bold text-base truncate w-full">Node {node.ip}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {node.city || "Unknown"}, {node.country}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full py-2">
                <div className="w-10 h-10 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground font-medium">Select a node...</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by IP, location, pubkey, version..." />
            <CommandList>
              <CommandEmpty>No node found.</CommandEmpty>
              <CommandGroup>
                {nodes.filter(n => n.pubkey !== otherNodeId).map((n) => (
                  <CommandItem
                    key={n.pubkey}
                    value={`${n.ip} ${n.city} ${n.country} ${countryNames[n.country] || ""} ${n.pubkey} ${n.version} ${n.status}`}
                    onSelect={() => {
                      onSelect(n.pubkey);
                      setOpen(false);
                    }}
                    className="p-3"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">Node {n.ip}</span>
                          <Badge variant="outline" className="text-[9px] px-1 h-4 font-mono">
                            v{n.version}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {n.city || "Unknown"}, {countryNames[n.country] || n.country}
                        </span>
                      </div>
                      {node?.pubkey === n.pubkey && <Check className="ml-auto w-4 h-4 text-primary" />}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50" data-tour="comparison">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
          
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-slate-950 text-white rounded-2xl p-3 shadow-2xl transition-all hover:scale-110 hover:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-primary border border-white/10 group"
            aria-label="Compare Nodes"
          >
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-card/95 backdrop-blur-sm text-foreground px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none border border-border/50 scale-95 group-hover:scale-100">
              <span className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-primary" />
                Compare Nodes
              </span>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 rotate-45 bg-card/95 border-r border-b border-border/50" />
            </span>
          </button>
        </div>
      </div>

      {/* Comparison Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-6 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GitCompare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Node Comparison</DialogTitle>
                  <p className="text-xs text-muted-foreground">Analyze and compare performance metrics side-by-side</p>
                </div>
              </div>
              {(node1 || node2) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setNode1(""); setNode2(""); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-8">
              {/* Selection Area */}
              <div className="flex flex-col md:flex-row items-center gap-4 relative">
                <NodeSelector 
                  node={selectedNode1} 
                  onSelect={setNode1} 
                  open={open1} 
                  setOpen={setOpen1} 
                  label="First Node"
                  otherNodeId={node2}
                />
                
                <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-border shadow-lg font-black text-sm italic text-muted-foreground shrink-0">
                  VS
                </div>

                <NodeSelector 
                  node={selectedNode2} 
                  onSelect={setNode2} 
                  open={open2} 
                  setOpen={setOpen2} 
                  label="Second Node"
                  otherNodeId={node1}
                />
              </div>

              {/* Comparison Results */}
              {selectedNode1 && selectedNode2 ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          selectedNode1.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                        )} />
                        <span className="text-sm font-bold uppercase tracking-wider">
                          {selectedNode1.status}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {selectedNode1.version}
                      </Badge>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {selectedNode2.version}
                      </Badge>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold uppercase tracking-wider">
                          {selectedNode2.status}
                        </span>
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          selectedNode2.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                        )} />
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="bg-card/50 border border-border/50 rounded-3xl p-2">
                    <ComparisonMetric
                      icon={Zap}
                      label="Uptime Score"
                      value1={(selectedNode1.uptimeScore || 0).toFixed(2)}
                      value2={(selectedNode2.uptimeScore || 0).toFixed(2)}
                      unit="%"
                    />

                    <ComparisonMetric
                      icon={Clock}
                      label="Process Uptime"
                      value1={formatUptime(selectedNode1.uptime || 0)}
                      value2={formatUptime(selectedNode2.uptime || 0)}
                      isBetter={(a, b) => a > b}
                    />

                    <ComparisonMetric
                      icon={HardDrive}
                      label="Storage Committed"
                      value1={selectedNode1.totalStorage >= 1 ? selectedNode1.totalStorage.toFixed(2) : (selectedNode1.totalStorage * 1024).toFixed(0)}
                      value2={selectedNode2.totalStorage >= 1 ? selectedNode2.totalStorage.toFixed(2) : (selectedNode2.totalStorage * 1024).toFixed(0)}
                      unit={selectedNode1.totalStorage >= 1 || selectedNode2.totalStorage >= 1 ? " GB" : " MB"}
                    />

                    <ComparisonMetric
                      icon={Shield}
                      label="Storage Used"
                      value1={(selectedNode1.storageUsed || 0).toFixed(2)}
                      value2={(selectedNode2.storageUsed || 0).toFixed(2)}
                      unit=" MB"
                    />

                    <ComparisonMetric
                      icon={Coins}
                      label="STOINC Earnings"
                      value1={(selectedNode1.stoincEarnings || 0).toFixed(2)}
                      value2={(selectedNode2.stoincEarnings || 0).toFixed(2)}
                      unit=" STOINC"
                    />

                    <ComparisonMetric
                      icon={TrendingUp}
                      label="STOINC Generated"
                      value1={(selectedNode1.stoincGenerated || 0).toFixed(2)}
                      value2={(selectedNode2.stoincGenerated || 0).toFixed(2)}
                      unit=" STOINC"
                    />

                    <ComparisonMetric
                      icon={Globe}
                      label="Reliability Rank"
                      value1={selectedNode1.reliabilityRank || "N/A"}
                      value2={selectedNode2.reliabilityRank || "N/A"}
                      isBetter={(a, b) => a < b} // Lower rank is better
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
                    <GitCompare className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ready for Battle?</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Select two nodes from the network to compare their performance, earnings, and reliability.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t border-border/50 bg-muted/10 flex justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close Comparison
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


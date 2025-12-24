import React, { useState } from "react";
import { Node } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  LayoutGrid, 
  List as ListIcon, 
  RefreshCw, 
  Filter, 
  Bookmark, 
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

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
};

interface NodeListProps {
  nodes: Node[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function NodeList({ nodes, onRefresh, isRefreshing }: NodeListProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [, setLocation] = useLocation();
  const itemsPerPage = 15;

  const filteredNodes = nodes.filter(node => 
    node.ip.includes(filter) || 
    node.pubkey.toLowerCase().includes(filter.toLowerCase()) ||
    node.country.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNodes = filteredNodes.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = nodes.filter(n => n.status === "active").length;

  // Helper functions
  const getShortId = (pubkey: string) => pubkey.substring(0, 4).toUpperCase();
  const getXdnScore = (node: Node) => Math.floor(node.uptimeScore || 0);
  const truncateVersion = (version: string) => {
    if (version.length <= 20) return version;
    // Show first 12 chars and last 6 chars with ... in between
    return `${version.substring(0, 12)}...${version.substring(version.length - 6)}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search nodes..." 
              className="pl-9 bg-background/50 border-input"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" className="border-input bg-background/50 gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Stats & View Toggle */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
          <div>
            <h3 className="font-semibold text-lg">
              {activeCount}/{nodes.length} Active
            </h3>
            <p className="text-sm text-muted-foreground">
              Fetched {nodes.length} nodes in 0.41s
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-background border border-input rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-8 w-8 p-0 rounded-md ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-8 w-8 p-0 rounded-md ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="border-input bg-background/50 gap-2"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh in 25s
            </Button>
            
            <Button variant="outline" className="border-input bg-background/50">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "list" ? (
          <div className="rounded-xl border border-border overflow-hidden bg-background/30 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-6 py-4 font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Location</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Uptime</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Latency</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Storage <span className="text-xs bg-muted px-1 rounded ml-1">TB</span></th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Last Seen</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedNodes.map((node) => (
                    <tr 
                      key={node.id} 
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/node/${node.pubkey}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">
                            Node {node.ip} ({getShortId(node.pubkey)})
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-0 text-[10px] px-1.5 py-0 h-5 rounded">
                              Registered
                            </Badge>
                            <Badge variant="secondary" className="bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 border-0 text-[10px] px-1.5 py-0 h-5 rounded">
                              XDN: {getXdnScore(node)}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                        {node.city || "Unknown"}, {countryNames[node.country] || node.country || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`
                          ${node.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}
                        `}>
                          {node.status === 'active' ? 'Active' : 'Offline'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        -
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        -
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground font-mono">
                            <span>0.00 / {(node.totalStorage / 1000).toFixed(2)} TB</span>
                          </div>
                          <Progress value={Math.random() * 10} className="h-1 bg-muted" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(node.lastUpdated), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-sm">
                        {truncateVersion(node.version)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedNodes.map((node) => (
              <div 
                key={node.id} 
                className="bg-background/30 border border-border rounded-xl p-5 space-y-4 hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => setLocation(`/node/${node.pubkey}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">Node {node.ip} ({getShortId(node.pubkey)})</h3>
                    <p className="text-sm text-muted-foreground mt-1">{node.city || "Unknown"}, {countryNames[node.country] || node.country || "Unknown"}</p>
                  </div>
                  <Badge variant="outline" className={`
                    ${node.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}
                  `}>
                    {node.status === 'active' ? 'Active' : 'Offline'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                    <p className="font-mono text-sm">-</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Latency</p>
                    <p className="font-mono text-sm">-</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">XDN Score</p>
                    <p className="font-mono text-sm">{getXdnScore(node)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">CPU</p>
                    <p className="font-mono text-sm">0.0%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Memory</p>
                    <p className="font-mono text-sm">-</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Storage</p>
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-sm">0.00 TB</p>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-0 text-xs rounded">
                    Registered
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select defaultValue="15">
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue placeholder="15" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredNodes.length)} of {filteredNodes.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Previous Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {(() => {
              const pages: number[] = [];
              const maxVisible = 5;
              
              if (totalPages <= maxVisible) {
                // Show all pages
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Show current page in center with 2 on each side
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, start + maxVisible - 1);
                
                // Adjust if we're near the end
                if (end === totalPages) {
                  start = Math.max(1, end - maxVisible + 1);
                }
                
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
              }
              
              return pages.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ));
            })()}

            {/* Next Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
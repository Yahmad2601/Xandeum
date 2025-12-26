import React, { useState } from "react";
import { Node } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Key,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface NodeListProps {
  nodes: Node[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type PresetFilter = "all" | "topStorage" | "topCredits" | "highestUptime";

export function NodeList({ nodes, onRefresh, isRefreshing }: NodeListProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "grid";
    }
    return "list";
  });
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preset, setPreset] = useState<PresetFilter>("all");
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const effectiveViewMode = isMobile ? "grid" : viewMode;

  const query = filter.trim().toLowerCase();

  const baseFilteredNodes = nodes.filter((node) => {
    if (!query) return true;

    const locationText = [node.city, countryNames[node.country], node.country]
      .filter(Boolean)
      .join(" ");

    const candidateValues = [
      `node ${node.ip}`,
      node.ip,
      node.pubkey,
      node.version,
      locationText,
      node.status,
      node.isPublic ? "public" : "private",
      node.reliabilityRank?.toString(),
    ];

    return candidateValues.some((value) =>
      value?.toLowerCase().includes(query)
    );
  });

  const applyPresetFilter = (list: Node[]): Node[] => {
    if (preset === "all") return list;

    const topSlice = Math.max(1, Math.ceil(list.length * 0.2));

    if (preset === "topStorage") {
      return [...list]
        .sort((a, b) => (b.totalStorage ?? 0) - (a.totalStorage ?? 0))
        .slice(0, topSlice);
    }

    if (preset === "topCredits") {
      return [...list]
        .sort((a, b) => (b.stoincEarnings ?? 0) - (a.stoincEarnings ?? 0))
        .slice(0, topSlice);
    }

    return [...list]
      .sort((a, b) => (b.uptimeScore ?? 0) - (a.uptimeScore ?? 0))
      .slice(0, topSlice);
  };

  const filteredNodes = applyPresetFilter(baseFilteredNodes);

  const totalPages = Math.ceil(filteredNodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNodes = filteredNodes.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = nodes.filter(n => n.status === "online").length;

  // Helper functions
  const getShortId = (pubkey: string) => pubkey.substring(0, 4).toUpperCase();
  const truncateVersion = (version: string) => {
    if (version.length <= 20) return version;
    // Show first 12 chars and last 6 chars with ... in between
    return `${version.substring(0, 12)}...${version.substring(version.length - 6)}`;
  };

  const exportToCSV = () => {
    // CSV headers
    const headers = [
      'Node ID',
      'Public Key',
      'IP Address',
      'Location',
      'Status',
      'Version',

      'Uptime Score (%)',
      'Storage (GB)',
      'STOINC Earnings',
      'Reliability Rank',
      'Last Updated'
    ];

    // Convert nodes to CSV rows
    const rows = filteredNodes.map(node => [
      `Node ${node.ip}`,
      node.pubkey,
      node.ip,
      `${node.city || 'Unknown'}, ${countryNames[node.country] || node.country || 'Unknown'}`,
      node.status,
      node.version,
      node.uptimeScore || 0,
      node.totalStorage,
      node.stoincEarnings,
      node.reliabilityRank || 'N/A',
      new Date(node.lastUpdated).toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `xandeum-nodes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <div className="relative w-full" data-tour="search-bar">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search nodes..." 
              className="pl-9 h-12 text-base bg-background/50 border-input rounded-xl"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>

        {/* Stats & View Toggle */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
          <div>
            <h3 className="font-semibold text-lg">
              {activeCount}/{nodes.length} Online
            </h3>
            <p className="text-sm text-muted-foreground">
              Fetched {nodes.length} nodes in 0.41s
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:flex-row md:w-auto md:items-center md:justify-end" data-tour="filters">
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-center border-input bg-background/50 gap-2 hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-auto"
                  >
                    <Filter className="w-4 h-4" />
                    {preset === "all"
                      ? "All Nodes"
                      : preset === "topStorage"
                      ? "Top Storage"
                      : preset === "topCredits"
                      ? "Top Credits"
                      : "Highest Uptime"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => {
                      setPreset("all");
                      setCurrentPage(1);
                    }}
                  >
                    All Nodes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPreset("topStorage");
                      setCurrentPage(1);
                    }}
                  >
                    Top Storage Providers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPreset("topCredits");
                      setCurrentPage(1);
                    }}
                  >
                    Top Credit Earners
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPreset("highestUptime");
                      setCurrentPage(1);
                    }}
                  >
                    Highest Uptime
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="w-full justify-center border-input bg-background/50 gap-2 hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-auto"
                onClick={exportToCSV}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center border-input bg-background/50 gap-2 hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-auto"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <div className="hidden items-center bg-background border border-input rounded-lg p-1 md:flex">
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
          </div>
        </div>

        {/* Content */}
        {effectiveViewMode === "list" ? (
          <div className="rounded-xl border border-border overflow-hidden bg-background/30 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-6 py-4 font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Location</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Uptime</th>
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
                          <Badge variant="secondary" className={`${
                            node.isPublic 
                              ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                          } border-0 text-[10px] px-1.5 py-0 h-5 rounded w-fit`}>
                            {node.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                        {node.city || "Unknown"}, {countryNames[node.country] || node.country || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`
                          ${node.status === 'online' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}
                        `}>
                          {node.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {formatUptime(node.uptime || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground font-mono">
                            <span>
                              {node.totalStorage === 0 ? (
                                <span className="text-muted-foreground/50">No storage allocated</span>
                              ) : (
                                <>
                                  {node.storageUsed && node.storageUsed >= 1024 
                                    ? `${(node.storageUsed / 1024).toFixed(2)} GB` 
                                    : `${(node.storageUsed || 0).toFixed(2)} MB`} / {node.totalStorage >= 1000 
                                    ? `${(node.totalStorage / 1000).toFixed(2)} TB`
                                    : node.totalStorage >= 1
                                    ? `${node.totalStorage.toFixed(0)} GB`
                                    : `${(node.totalStorage * 1024).toFixed(0)} MB`}
                                </>
                              )}
                            </span>
                          </div>
                          <Progress value={node.storageUsed && node.totalStorage ? (node.storageUsed / 1024 / node.totalStorage) * 100 : 0} className="h-1 bg-muted" />
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
                    <div className="flex items-start gap-1 mt-0.5">
                      <Key className="w-3 h-3 text-muted-foreground/60" />
                      <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
                        {node.pubkey}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{node.city || "Unknown"}, {countryNames[node.country] || node.country || "Unknown"}</p>
                  </div>
                  <Badge variant="outline" className={`
                    ${node.status === 'online' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}
                  `}>
                    {node.status === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                    <p className="font-mono text-sm">{formatUptime(node.uptime || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Storage Used</p>
                    <p className={`font-mono text-sm ${node.totalStorage === 0 ? 'text-muted-foreground/50' : ''}`}>
                      {node.totalStorage === 0 
                        ? 'No storage' 
                        : node.storageUsed 
                        ? `${node.storageUsed.toFixed(2)} MB` 
                        : '0 MB'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Storage</p>
                    <p className={`font-mono text-sm ${node.totalStorage === 0 ? 'text-muted-foreground/50' : ''}`}>
                      {node.totalStorage === 0 
                        ? 'No storage' 
                        : node.totalStorage >= 1 
                        ? `${node.totalStorage} GB` 
                        : `${(node.totalStorage * 1024).toFixed(0)} MB`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Version</p>
                    <p className="font-mono text-sm">{truncateVersion(node.version)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">STOINC Earnings</p>
                    <p className="font-mono text-sm">{(node.stoincEarnings ?? 0).toFixed(2)} STOINC</p>
                  </div>
                </div>


                <div className="pt-2 border-t border-border/50">
                  <Badge variant="secondary" className={`${
                    node.isPublic 
                      ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                  } border-0 text-xs rounded w-fit`}>
                    {node.isPublic ? 'Public' : 'Private'}
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
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
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
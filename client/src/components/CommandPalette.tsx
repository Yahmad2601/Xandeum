import * as React from "react";
import { Command } from "cmdk";
import { Search, Server, Globe } from "lucide-react";
import { useLocation } from "wouter";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  nodes: any[]; // Using any just for filter ease, better with type Node
}

export function CommandPalette({ open, setOpen, nodes }: CommandPaletteProps) {
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true); // Changed to true directly instead of toggle
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-lg bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent" loop>
          <div className="flex items-center border-b border-white/5 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input 
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search nodes by pubkey or country..."
            />
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Nodes">
              {nodes.slice(0, 5).map((node) => (
                <Command.Item
                  key={node.pubkey}
                  onSelect={() => {
                    setLocation(`/node/${node.pubkey}`);
                    setOpen(false);
                  }}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                >
                  <Server className="mr-2 h-4 w-4" />
                  <span className="font-mono">{node.pubkey.substring(0, 12)}...</span>
                  <span className="ml-auto text-xs text-muted-foreground">{node.country}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Countries">
              {Array.from(new Set(nodes.map(n => n.country))).slice(0, 5).map(country => (
                <Command.Item
                  key={country as string}
                  onSelect={() => {
                    // In a real app, this would filter the view
                    setOpen(false);
                  }}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  <span>{country as string}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

interface TourGuideProps {
  onComplete?: () => void;
}

const tourSteps: TourStep[] = [
  {
    target: "network-stats",
    title: "Network Overview",
    content: "View real-time statistics including total nodes, online status, storage capacity, and STOINC rewards across the entire network.",
    position: "bottom",
  },
  {
    target: "network-map",
    title: "Global Network Map",
    content: "Visualize the geographic distribution of all Xandeum nodes across the globe. Each marker represents a node location.",
    position: "bottom",
  },
  {
    target: "node-list",
    title: "Node Explorer",
    content: "Browse and search through all registered nodes. View detailed information about each node's performance and earnings.",
    position: "top",
  },
  {
    target: "filters",
    title: "Smart Filters",
    content: "Use powerful filters to find top storage providers, highest earners, or best uptime performers in the network.",
    position: "top",
  },
  {
    target: "comparison",
    title: "Node Comparison",
    content: "Compare multiple nodes side by side to analyze their performance metrics, uptime, and earnings.",
    position: "left",
  },
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourGuide({ onComplete }: TourGuideProps) {
  const [showIntro, setShowIntro] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [elementRect, setElementRect] = useState<ElementRect | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tourCompleted = localStorage.getItem("xandeum-tour-completed");
    if (!tourCompleted) {
      const timer = setTimeout(() => setShowIntro(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateElementPosition = useCallback(() => {
    if (currentStep < 0 || currentStep >= tourSteps.length) {
      setElementRect(null);
      return;
    }

    const step = tourSteps[currentStep];
    const element = document.querySelector(`[data-tour="${step.target}"]`);

    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      // Use viewport-relative coordinates for fixed positioning
      setElementRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      setElementRect(null);
    }
  }, [currentStep]);

  // Effect to handle step changes
  useEffect(() => {
    if (currentStep < 0) return;

    const step = tourSteps[currentStep];
    let attempts = 0;
    const maxAttempts = 30;

    const findElement = () => {
      const element = document.querySelector(`[data-tour="${step.target}"]`);
      
      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Wait for scroll to complete, then update position
        setTimeout(() => {
          updateElementPosition();
        }, 400);
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(findElement, 100);
      } else {
        // Element not found, skip to next
        console.log(`Tour: Skipping step "${step.title}" - element not found`);
        if (currentStep < tourSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          handleComplete();
        }
      }
    };

    findElement();
  }, [currentStep, updateElementPosition]);

  // Continuously update position on scroll/resize
  useEffect(() => {
    if (currentStep < 0) return;

    const updateLoop = () => {
      updateElementPosition();
      rafRef.current = requestAnimationFrame(updateLoop);
    };

    rafRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [currentStep, updateElementPosition]);

  const handleStartTour = () => {
    setShowIntro(false);
    setCurrentStep(0);
  };

  const handleSkip = useCallback(() => {
    setShowIntro(false);
    setCurrentStep(-1);
    setElementRect(null);
    localStorage.setItem("xandeum-tour-completed", "true");
    onComplete?.();
  }, [onComplete]);

  const handleComplete = useCallback(() => {
    setCurrentStep(-1);
    setElementRect(null);
    localStorage.setItem("xandeum-tour-completed", "true");
    onComplete?.();
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!elementRect) return { display: "none" };

    const step = tourSteps[currentStep];
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const gap = 16;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top: number;
    let left: number;

    // Calculate available space
    const spaceAbove = elementRect.top;
    const spaceBelow = viewportHeight - (elementRect.top + elementRect.height);
    const spaceLeft = elementRect.left;
    const spaceRight = viewportWidth - (elementRect.left + elementRect.width);

    if (step.position === "bottom" || step.position === "top") {
      // Prefer bottom, but use top if not enough space
      if (spaceBelow > tooltipHeight + gap || spaceBelow > spaceAbove) {
        top = elementRect.top + elementRect.height + gap;
      } else {
        top = elementRect.top - tooltipHeight - gap;
      }
      // Center horizontally
      left = elementRect.left + (elementRect.width - tooltipWidth) / 2;
    } else if (step.position === "left") {
      // Position to the left
      top = elementRect.top + (elementRect.height - tooltipHeight) / 2;
      left = elementRect.left - tooltipWidth - gap;
      
      // Fall back to right if not enough space
      if (left < 16) {
        left = elementRect.left + elementRect.width + gap;
      }
    } else {
      // Position to the right
      top = elementRect.top + (elementRect.height - tooltipHeight) / 2;
      left = elementRect.left + elementRect.width + gap;
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, viewportHeight - tooltipHeight - 16));

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10002,
    };
  };

  // Intro dialog
  if (showIntro) {
    return (
      <Dialog open={showIntro} onOpenChange={setShowIntro}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPin className="w-6 h-6 text-primary" />
              Welcome to XandeumScan
            </DialogTitle>
            <DialogDescription className="pt-4 text-base">
              Explore the Xandeum network with our interactive dashboard. Get real-time insights 
              into node performance, storage capacity, and network health.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleStartTour} className="w-full">
              Take a Quick Tour
            </Button>
            <Button variant="outline" onClick={handleSkip} className="w-full">
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Active tour step
  if (currentStep >= 0 && currentStep < tourSteps.length && elementRect) {
    const step = tourSteps[currentStep];

    return (
      <>
        {/* Dark overlay with spotlight cutout using CSS clip-path */}
        <div
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{
            background: "rgba(0, 0, 0, 0.75)",
            clipPath: `polygon(
              0% 0%,
              0% 100%,
              ${elementRect.left}px 100%,
              ${elementRect.left}px ${elementRect.top}px,
              ${elementRect.left + elementRect.width}px ${elementRect.top}px,
              ${elementRect.left + elementRect.width}px ${elementRect.top + elementRect.height}px,
              ${elementRect.left}px ${elementRect.top + elementRect.height}px,
              ${elementRect.left}px 100%,
              100% 100%,
              100% 0%
            )`,
          }}
        />

        {/* Highlight border around element */}
        <div
          className="fixed pointer-events-none z-[10001] rounded-lg"
          style={{
            top: elementRect.top,
            left: elementRect.left,
            width: elementRect.width,
            height: elementRect.height,
            border: "2px solid hsl(var(--primary))",
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)",
          }}
        />

        {/* Tooltip */}
        <div
          className="bg-card border border-border rounded-xl shadow-2xl p-5 pointer-events-auto"
          style={getTooltipStyle()}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg text-foreground">{step.title}</h3>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{step.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button size="sm" variant="outline" onClick={handlePrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
                {currentStep < tourSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? "bg-primary w-4"
                    : idx < currentStep
                    ? "bg-primary/60"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return null;
}

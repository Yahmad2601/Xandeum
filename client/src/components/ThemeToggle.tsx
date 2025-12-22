import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Contrast, Zap } from "lucide-react";

type Theme = "light" | "light-high-contrast" | "dark" | "dark-high-contrast";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "dark-high-contrast";
    }
    return "dark-high-contrast";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "light-high-contrast", "dark", "dark-high-contrast");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "light-high-contrast", "dark", "dark-high-contrast"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case "light": return <Sun className="h-5 w-5 transition-all" />;
      case "light-high-contrast": return <Zap className="h-5 w-5 transition-all" />;
      case "dark": return <Moon className="h-5 w-5 transition-all" />;
      case "dark-high-contrast": return <Contrast className="h-5 w-5 transition-all" />;
    }
  };

  const getLabel = () => {
     switch (theme) {
      case "light": return "Light";
      case "light-high-contrast": return "Light High Contrast";
      case "dark": return "Dark";
      case "dark-high-contrast": return "Dark High Contrast";
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={cycleTheme} 
      className="w-9 h-9 rounded-full border border-transparent hover:border-border hover:bg-accent"
      title={`Current theme: ${getLabel()}`}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

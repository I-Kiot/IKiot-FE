"use client";

import React from "react";
import {
  Palette,
  RotateCcw,
  Settings,
  X,
  Dices,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useThemeManager } from "@/hooks/use-theme-manager";
import { useCircularTransition } from "@/hooks/use-circular-transition";
import { colorThemes, tweakcnThemes } from "@/config/theme-data";
import { radiusOptions } from "@/config/theme-customizer-constants";
import { cn } from "@/lib/utils";
import "@/components/theme-customizer/circular-transition.css";

interface LandingThemeCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LandingThemeCustomizer({
  open,
  onOpenChange,
}: LandingThemeCustomizerProps) {
  const { isDarkMode, resetTheme, applyRadius, applyTheme } = useThemeManager();

  const { toggleTheme } = useCircularTransition();

  const [selectedTheme, setSelectedTheme] = React.useState("default");
  const [selectedRadius, setSelectedRadius] = React.useState("0.5rem");

  // Load from local storage on mount
  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme-preset");
      const savedRadius = localStorage.getItem("theme-radius");
      if (savedTheme) setSelectedTheme(savedTheme);
      if (savedRadius) setSelectedRadius(savedRadius);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleReset = () => {
    // Reset all state variables to initial values
    setSelectedTheme("default");
    setSelectedRadius("0.5rem");

    // Reset theme and radius to defaults
    resetTheme();
    applyRadius("0.5rem");
    try {
      localStorage.setItem("theme-preset", "default");
      localStorage.setItem("theme-radius", "0.5rem");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRandomTheme = () => {
    // Apply a random theme from all presets
    const allThemes = [...colorThemes, ...tweakcnThemes];
    const randomTheme = allThemes[Math.floor(Math.random() * allThemes.length)];
    setSelectedTheme(randomTheme.value);
    applyTheme(randomTheme.value, isDarkMode);
    try {
      localStorage.setItem("theme-preset", randomTheme.value);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRadiusSelect = (radius: string) => {
    setSelectedRadius(radius);
    applyRadius(radius);
    try {
      localStorage.setItem("theme-radius", radius);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLightMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDarkMode === false) return;
    toggleTheme(event);
  };

  const handleDarkMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDarkMode === true) return;
    toggleTheme(event);
  };

  // Re-apply themes when theme mode changes
  React.useEffect(() => {
    if (selectedTheme) {
      applyTheme(selectedTheme, isDarkMode);
    }
  }, [isDarkMode, selectedTheme, applyTheme]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side="right"
          className="w-[400px] p-0 gap-0 pointer-events-auto [&>button]:hidden overflow-hidden flex flex-col"
        >
          <SheetHeader className="space-y-0 p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <SheetTitle className="text-lg font-semibold">
                Theme Customizer
              </SheetTitle>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  className="cursor-pointer h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SheetDescription className="text-sm text-muted-foreground">
              Customize the theme and colors of your landing page.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Mode Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={!isDarkMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleLightMode}
                  className="cursor-pointer mode-toggle-button relative overflow-hidden"
                >
                  <Sun className="h-4 w-4 mr-1 transition-transform duration-300" />
                  Light
                </Button>
                <Button
                  variant={isDarkMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleDarkMode}
                  className="cursor-pointer mode-toggle-button relative overflow-hidden"
                >
                  <Moon className="h-4 w-4 mr-1 transition-transform duration-300" />
                  Dark
                </Button>
              </div>
            </div>

            <Separator />

            {/* Theme Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Theme Presets</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRandomTheme}
                  className="cursor-pointer"
                >
                  <Dices className="h-3.5 w-3.5 mr-1.5" />
                  Random
                </Button>
              </div>

              <Select
                value={selectedTheme}
                onValueChange={(value) => {
                  setSelectedTheme(value);
                  applyTheme(value, isDarkMode);
                  try {
                    localStorage.setItem("theme-preset", value);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Choose Theme" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="p-2">
                    <SelectGroup>
                      <SelectLabel>Shadcn UI Themes</SelectLabel>
                      {colorThemes.map((theme) => (
                        <SelectItem
                          key={theme.value}
                          value={theme.value}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.primary,
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.secondary,
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.accent,
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.muted,
                                }}
                              />
                            </div>
                            <span>{theme.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator className="my-1" />
                    <SelectGroup>
                      <SelectLabel>Tweakcn Themes</SelectLabel>
                      {tweakcnThemes.map((theme) => (
                        <SelectItem
                          key={theme.value}
                          value={theme.value}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.primary,
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.secondary,
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.accent,
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-border/20"
                                style={{
                                  backgroundColor:
                                    theme.preset.styles.light.muted,
                                }}
                              />
                            </div>
                            <span>{theme.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </div>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Radius Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Radius</Label>
              <div className="grid grid-cols-5 gap-2">
                {radiusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-md p-3 border transition-colors ${
                      selectedRadius === option.value
                        ? "border-primary"
                        : "border-border hover:border-border/60"
                    }`}
                    onClick={() => handleRadiusSelect(option.value)}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium">{option.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Floating trigger button for landing page
export function LandingThemeCustomizerTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer right-4",
      )}
    >
      <Settings className="h-5 w-5" />
    </Button>
  );
}

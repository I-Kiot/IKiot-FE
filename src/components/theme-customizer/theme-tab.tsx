"use client";

import { Dices, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import React from "react";
import "./circular-transition.css";

interface ThemeTabProps {
  selectedTheme: string;
  setSelectedTheme: (theme: string) => void;
  selectedRadius: string;
  setSelectedRadius: (radius: string) => void;
}

export function ThemeTab({
  selectedTheme,
  setSelectedTheme,
  selectedRadius,
  setSelectedRadius,
}: ThemeTabProps) {
  const { isDarkMode, applyTheme, applyRadius, applyBorder } = useThemeManager();
  const { toggleTheme } = useCircularTransition();

  const [selectedBorder, setSelectedBorder] = React.useState("thick");

  React.useEffect(() => {
    try {
      const savedBorder = localStorage.getItem("theme-border") || "thick";
      setSelectedBorder(savedBorder);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleBorderSelect = (border: string, themeVal = selectedTheme) => {
    setSelectedBorder(border);
    applyBorder(border, themeVal, isDarkMode);
    try {
      localStorage.setItem("theme-border", border);
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

  return (
    <div className="p-4 space-y-6">
      {/* Theme Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Chủ đề</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRandomTheme}
            className="cursor-pointer"
          >
            <Dices className="h-3.5 w-3.5 mr-1.5" />
            Ngẫu nhiên
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
            <SelectValue placeholder="Chọn chủ đề" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <div className="p-2">
              <SelectGroup>
                <SelectLabel>Chủ đề Shadcn UI</SelectLabel>
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
                            backgroundColor: theme.preset.styles.light.primary,
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
                            backgroundColor: theme.preset.styles.light.accent,
                          }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-border/20"
                          style={{
                            backgroundColor: theme.preset.styles.light.muted,
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
                <SelectLabel>Chủ đề Tweakcn</SelectLabel>
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
                            backgroundColor: theme.preset.styles.light.primary,
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
                            backgroundColor: theme.preset.styles.light.accent,
                          }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-border/20"
                          style={{
                            backgroundColor: theme.preset.styles.light.muted,
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
        <Label className="text-sm font-medium">Bo góc</Label>
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

      <Separator />

      {/* Border Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Đường viền</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Không viền", value: "none" },
            { name: "Mặc định", value: "thin" },
            { name: "Viền dày", value: "thick" },
          ].map((option) => (
            <div
              key={option.value}
              className={`relative cursor-pointer rounded-md p-3 border transition-colors ${
                selectedBorder === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/60"
              }`}
              onClick={() => handleBorderSelect(option.value)}
            >
              <div className="text-center">
                <div className="text-xs font-medium">{option.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Mode Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Chế độ hiển thị</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={!isDarkMode ? "secondary" : "outline"}
            size="lg"
            onClick={handleLightMode}
            className="cursor-pointer"
          >
            <Sun className="h-4 w-4 mr-1" />
            Sáng
          </Button>
          <Button
            variant={isDarkMode ? "secondary" : "outline"}
            size="lg"
            onClick={handleDarkMode}
            className="cursor-pointer"
          >
            <Moon className="h-4 w-4 mr-1" />
            Tối
          </Button>
        </div>
      </div>
    </div>
  );
}

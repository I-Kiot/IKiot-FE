"use client"

import React from "react"
import { useThemeManager } from "@/hooks/use-theme-manager"

export function ThemePresetInitializer() {
  const { applyTheme, applyRadius, isDarkMode } = useThemeManager()

  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme-preset") || "twitter"
      const savedRadius = localStorage.getItem("theme-radius") || "1rem"
      
      applyTheme(savedTheme, isDarkMode)
      applyRadius(savedRadius)
    } catch (e) {
      console.error(e)
    }
  }, [isDarkMode, applyTheme, applyRadius])

  return null
}

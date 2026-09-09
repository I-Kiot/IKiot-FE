"use client"

import React from 'react'
import { useTheme } from '@/hooks/use-theme'
import { colorThemes, tweakcnThemes } from '@/config/theme-data'

export function useThemeManager() {
  const { theme, setTheme } = useTheme()

  // Simple, reliable theme detection - just follow the theme provider
  const isDarkMode = React.useMemo(() => {
    if (theme === "dark") return true
    if (theme === "light") return false
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  }, [theme])

  const resetTheme = React.useCallback(() => {
    // Comprehensive reset of ALL possible CSS variables that could be set by themes
    const root = document.documentElement
    const allPossibleVars = [
      // Standard shadcn/ui variables
      'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
      'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
      'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input',
      'ring', 'radius',
      
      // Chart variables
      'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
      
      // Sidebar variables
      'sidebar', 'sidebar-background', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground', 
      'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
      
      // Font variables that might be in imported themes
      'font-sans', 'font-serif', 'font-mono',
      
      // Shadow variables from imported themes
      'shadow-2xs', 'shadow-xs', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
      
      // Spacing variables
      'spacing', 'tracking-normal',
      
      // Additional variables that might be set by advanced themes
      'card-header', 'card-content', 'card-footer', 'muted-background', 'accent-background',
      'destructive-background', 'warning', 'warning-foreground', 'success', 'success-foreground',
      'info', 'info-foreground'
    ]
    
    // Remove all possible CSS variables
    allPossibleVars.forEach(varName => {
      root.style.removeProperty(`--${varName}`)
    })
    
    // Also remove any inline styles that might have been set (comprehensive cleanup)
    const inlineStyles = root.style
    for (let i = inlineStyles.length - 1; i >= 0; i--) {
      const property = inlineStyles[i]
      if (property.startsWith('--')) {
        root.style.removeProperty(property)
      }
    }
  }, [])

  const applyBorder = React.useCallback((borderStyle: string, themeValue: string, darkMode: boolean) => {
    const theme = colorThemes.find(t => t.value === themeValue) || tweakcnThemes.find(t => t.value === themeValue)
    const styles = theme ? (darkMode ? theme.preset.styles.dark : theme.preset.styles.light) : null
    const root = document.documentElement
    const fallbackBorder = darkMode ? 'oklch(1 0 0 / 10%)' : 'oklch(0.922 0 0)'

    // Remove thick border class from root
    root.classList.remove('border-thick')

    if (borderStyle === 'none' || !styles) {
      // Clear borders
      root.style.setProperty('--border', 'transparent')
      root.style.setProperty('--sidebar-border', 'transparent')
      root.style.setProperty('--input', 'transparent')
    } else if (borderStyle === 'thin') {
      // Thin / Default borders
      root.style.setProperty('--border', styles.border || fallbackBorder)
      root.style.setProperty('--sidebar-border', styles['sidebar-border'] || styles.border || fallbackBorder)
      root.style.setProperty('--input', styles.input || styles.border || fallbackBorder)
    } else if (borderStyle === 'thick') {
      // Thick borders (2px)
      root.style.setProperty('--border', styles.border || fallbackBorder)
      root.style.setProperty('--sidebar-border', styles['sidebar-border'] || styles.border || fallbackBorder)
      root.style.setProperty('--input', styles.input || styles.border || fallbackBorder)
      
      // Add thick border class to root
      root.classList.add('border-thick')
    }
  }, [])

  const applyTheme = React.useCallback((themeValue: string, darkMode: boolean) => {
    const theme = colorThemes.find(t => t.value === themeValue) || tweakcnThemes.find(t => t.value === themeValue)
    if (!theme) return

    // Reset and apply theme variables
    resetTheme()
    const styles = darkMode ? theme.preset.styles.dark : theme.preset.styles.light
    const root = document.documentElement

    Object.entries(styles).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    // Retrieve active radius style from localStorage (default to '1rem') and apply it
    let radiusStyle = '1rem'
    try {
      radiusStyle = localStorage.getItem("theme-radius") || "1rem"
    } catch (e) {
      console.error(e)
    }
    root.style.setProperty('--radius', radiusStyle)

    // Retrieve active border style from localStorage (default to 'thick') and apply it
    let borderStyle = 'thick'
    try {
      borderStyle = localStorage.getItem("theme-border") || "thick"
    } catch (e) {
      console.error(e)
    }
    applyBorder(borderStyle, themeValue, darkMode)
  }, [resetTheme, applyBorder])

  const applyRadius = (radius: string) => {
    document.documentElement.style.setProperty('--radius', radius)
  }

  return {
    theme,
    setTheme,
    isDarkMode,
    resetTheme,
    applyTheme,
    applyRadius,
    applyBorder,
  }
}

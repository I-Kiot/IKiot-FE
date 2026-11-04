"use client"

import React from 'react'
import { useTheme } from '@/hooks/use-theme'
import { colorThemes, tweakcnThemes } from '@/config/theme-data'

export function useThemeManager() {
  const { theme, setTheme } = useTheme()

  // Theo theme của provider; khi là system thì hỏi media query.
  const isDarkMode = React.useMemo(() => {
    if (theme === "dark") return true
    if (theme === "light") return false
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  }, [theme])

  const resetTheme = React.useCallback(() => {
    // Xoá mọi CSS var theme có thể đã set, tránh theme cũ còn sót lại khi đổi theme.
    const root = document.documentElement
    const allPossibleVars = [
      'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
      'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
      'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input',
      'ring', 'radius',
      
      'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
      
      'sidebar', 'sidebar-background', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground', 
      'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
      
      'font-sans', 'font-serif', 'font-mono',
      
      'shadow-2xs', 'shadow-xs', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
      
      'spacing', 'tracking-normal',
      
      'card-header', 'card-content', 'card-footer', 'muted-background', 'accent-background',
      'destructive-background', 'warning', 'warning-foreground', 'success', 'success-foreground',
      'info', 'info-foreground'
    ]
    
    allPossibleVars.forEach(varName => {
      root.style.removeProperty(`--${varName}`)
    })
    
    // Quét thêm mọi biến --* inline nằm ngoài danh sách trên.
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

    root.classList.remove('border-thick')

    if (borderStyle === 'none' || !styles) {
      root.style.setProperty('--border', 'transparent')
      root.style.setProperty('--sidebar-border', 'transparent')
      root.style.setProperty('--input', 'transparent')
    } else if (borderStyle === 'thin') {
      root.style.setProperty('--border', styles.border || fallbackBorder)
      root.style.setProperty('--sidebar-border', styles['sidebar-border'] || styles.border || fallbackBorder)
      root.style.setProperty('--input', styles.input || styles.border || fallbackBorder)
    } else if (borderStyle === 'thick') {
      // Viền dày 2px, cần class border-thick ở root.
      root.style.setProperty('--border', styles.border || fallbackBorder)
      root.style.setProperty('--sidebar-border', styles['sidebar-border'] || styles.border || fallbackBorder)
      root.style.setProperty('--input', styles.input || styles.border || fallbackBorder)
      
      root.classList.add('border-thick')
    }
  }, [])

  const applyTheme = React.useCallback((themeValue: string, darkMode: boolean) => {
    const theme = colorThemes.find(t => t.value === themeValue) || tweakcnThemes.find(t => t.value === themeValue)
    if (!theme) return

    resetTheme()
    const styles = darkMode ? theme.preset.styles.dark : theme.preset.styles.light
    const root = document.documentElement

    Object.entries(styles).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    let radiusStyle = '1rem'
    try {
      radiusStyle = localStorage.getItem("theme-radius") || "1rem"
    } catch (e) {
      console.error(e)
    }
    root.style.setProperty('--radius', radiusStyle)

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

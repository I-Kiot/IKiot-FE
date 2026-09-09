"use client"

import * as React from "react"

export interface SidebarConfig {
  variant: "sidebar" | "floating" | "inset"
  collapsible: "offcanvas" | "icon" | "none"
  side: "left" | "right"
}

export interface SidebarContextValue {
  config: SidebarConfig
  updateConfig: (config: Partial<SidebarConfig>) => void
}

export const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<SidebarConfig>({
    variant: "inset",
    collapsible: "offcanvas", 
    side: "left"
  })

  // Load from local storage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-layout-config")
      if (saved) {
        setConfig(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const updateConfig = React.useCallback((newConfig: Partial<SidebarConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig }
      try {
        localStorage.setItem("sidebar-layout-config", JSON.stringify(updated))
      } catch (e) {
        console.error(e)
      }
      return updated
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ config, updateConfig }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarConfig() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarConfig must be used within a SidebarConfigProvider")
  }
  return context
}

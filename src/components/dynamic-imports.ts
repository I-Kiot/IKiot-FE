import dynamic from 'next/dynamic'
import React from 'react'

// Component nặng, nên import động
export const DynamicThemeCustomizer = dynamic(() => import('./theme-customizer').then(mod => ({ default: mod.ThemeCustomizer })), {
  ssr: false,
  loading: () => React.createElement('div', { className: "h-8 w-8 animate-pulse bg-muted rounded" })
})

export const DynamicColorPicker = dynamic(() => import('./color-picker').then(mod => ({ default: mod.ColorPicker })), {
  ssr: false,
  loading: () => React.createElement('div', { className: "h-8 w-8 animate-pulse bg-muted rounded" })
})

"use client"

import { useRef, useCallback } from "react"
import { useTheme } from "@/hooks/use-theme"

interface CircularTransitionHook {
  startTransition: (coords: { x: number; y: number }, callback: () => void) => void
  toggleTheme: (event: React.MouseEvent) => void
  isTransitioning: () => boolean
}

export function useCircularTransition(): CircularTransitionHook {
  const { theme, setTheme } = useTheme()
  const isTransitioningRef = useRef(false)

  const startTransition = useCallback((coords: { x: number; y: number }, callback: () => void) => {
    if (isTransitioningRef.current) return

    isTransitioningRef.current = true

    // Tâm hiệu ứng reveal tròn lưu qua CSS var --x/--y, cách làm giống tweakcn.
    const x = (coords.x / window.innerWidth) * 100
    const y = (coords.y / window.innerHeight) * 100

    document.documentElement.style.setProperty('--x', `${x}%`)
    document.documentElement.style.setProperty('--y', `${y}%`)

    if ('startViewTransition' in document) {
      const transition = (document as Document & { startViewTransition: (callback: () => void) => { finished: Promise<void> } }).startViewTransition(() => {
        callback()
      })

      transition.finished.finally(() => {
        isTransitioningRef.current = false
      })
    } else {
      // Trình duyệt không có View Transitions API: đổi theme ngay, mở khóa sau 400ms.
      callback()
      setTimeout(() => {
        isTransitioningRef.current = false
      }, 400)
    }
  }, [])

  const toggleTheme = useCallback((event: React.MouseEvent) => {
    // Toạ độ click (clientX/Y) làm tâm hiệu ứng, giống tweakcn.
    const coords = {
      x: event.clientX,
      y: event.clientY
    }

    startTransition(coords, () => {
      setTheme(theme === "dark" ? "light" : "dark")
    })
  }, [theme, setTheme, startTransition])

  const isTransitioning = useCallback(() => {
    return isTransitioningRef.current
  }, [])

  return {
    startTransition,
    toggleTheme,
    isTransitioning
  }
}

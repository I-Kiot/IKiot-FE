import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = typeof window !== "undefined" ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`) : null
    const onChange = () => {
      setIsMobile(typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false)
    }

    if (mql) {
      mql.addEventListener("change", onChange)
    }
    
    // Defer check to avoid synchronous state updates during react's render phase
    Promise.resolve().then(() => {
      setIsMobile(typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false)
    })

    return () => {
      if (mql) {
        mql.removeEventListener("change", onChange)
      }
    }
  }, [])

  return !!isMobile
}

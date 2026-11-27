"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

/** Chặn sự kiện cuộn ở popover để danh sách bên trong cuộn được khi dialog đang mở. */
function stopScrollLock(node: HTMLElement | null) {
  if (!node) return
  const stop = (e: Event) => e.stopPropagation()
  node.addEventListener("wheel", stop, { passive: true })
  node.addEventListener("touchmove", stop, { passive: true })
  return () => {
    node.removeEventListener("wheel", stop)
    node.removeEventListener("touchmove", stop)
  }
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
      const cleanup = stopScrollLock(node)
      return () => {
        cleanup?.()
        if (typeof ref === "function") ref(null)
        else if (ref) ref.current = null
      }
    },
    [ref]
  )
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={composedRef}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

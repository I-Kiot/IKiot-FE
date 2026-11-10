"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A dialog whose className leaves the padding and layout alone is "scroll layout": the
 * content box itself scrolls (capped at the viewport) and DialogHeader / DialogFooter stick
 * to its top and bottom, so the title, the close button and the action buttons stay on
 * screen however long the form is. Dialogs that set their own padding, flex layout or
 * overflow already manage scrolling themselves and are left exactly as they were.
 */
const CUSTOM_LAYOUT = /(^|\s)(p|px|py|pt|pb|pl|pr)-|(^|\s)(flex|overflow-hidden)(\s|$)/

const DialogLayoutContext = React.createContext<{
  scrollLayout: boolean
  showCloseButton: boolean
}>({ scrollLayout: false, showCloseButton: false })

function DialogCloseButton({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      className={cn(
        "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
    >
      <XIcon />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  )
}

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const scrollLayout = !CUSTOM_LAYOUT.test(className ?? "")
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "group/dialog bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          scrollLayout && "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          className
        )}
        {...props}
      >
        <DialogLayoutContext.Provider value={{ scrollLayout, showCloseButton }}>
          {children}
        </DialogLayoutContext.Provider>
        {showCloseButton && (
          // Hidden when a sticky DialogHeader carries its own copy, so it doesn't scroll away.
          <DialogCloseButton className="group-has-data-[slot=dialog-header-close]/dialog:hidden" />
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// Sticky bleed: the negative margins equal the content box's p-6 and the padding puts the
// same space back. The sticky offset is -6 too, because a sticky box sticks at the scroll
// container's padding edge, so top-0 would leave a 24px strip of content showing above it.
// Layout is unchanged until it sticks; the fade covers the gap below the header.
const STICKY_HEADER =
  "sticky -top-6 z-10 -mx-6 -mt-6 bg-background px-6 pt-6 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-gradient-to-b after:from-background after:to-transparent"
const STICKY_FOOTER =
  "sticky -bottom-6 z-10 -mx-6 -mb-6 bg-background px-6 pb-6 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-3 before:bg-gradient-to-t before:from-background before:to-transparent"

function DialogHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { scrollLayout, showCloseButton } = React.useContext(DialogLayoutContext)
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2 text-center sm:text-left",
        scrollLayout && STICKY_HEADER,
        className
      )}
      {...props}
    >
      {children}
      {scrollLayout && showCloseButton && (
        <span data-slot="dialog-header-close" className="contents">
          <DialogCloseButton />
        </span>
      )}
    </div>
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { scrollLayout } = React.useContext(DialogLayoutContext)
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        scrollLayout && STICKY_FOOTER,
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

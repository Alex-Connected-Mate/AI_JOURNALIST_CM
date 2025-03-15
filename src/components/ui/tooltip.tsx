import * as React from "react"
import { cn } from "@/lib/utils"

// Context for tooltip state
const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null)

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  )
}

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block">{children}</div>
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ asChild, children, ...props }, forwardedRef) => {
    const context = React.useContext(TooltipContext)
    
    if (!context) {
      throw new Error("TooltipTrigger must be used within a TooltipProvider")
    }

    const { setOpen } = context

    return (
      <button
        ref={forwardedRef}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TooltipTrigger.displayName = "TooltipTrigger"

export const TooltipContent = ({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  const context = React.useContext(TooltipContext)
  
  if (!context) {
    throw new Error("TooltipContent must be used within a TooltipProvider")
  }

  const { open } = context

  if (!open) return null

  return (
    <div
      className={cn(
        "z-50 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded bg-gray-900 text-white text-sm shadow-lg",
        "after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-t-gray-900 after:border-r-transparent after:border-b-transparent after:border-l-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 
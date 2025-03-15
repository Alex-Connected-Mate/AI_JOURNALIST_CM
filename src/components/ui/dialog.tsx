import * as React from "react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null)

export function Dialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ 
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(DialogContext)
  
  if (!context) {
    throw new Error("DialogTrigger must be used within a Dialog")
  }
  
  const { setOpen } = context
  
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
}

export function DialogContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DialogContext)
  
  if (!context) {
    throw new Error("DialogContent must be used within a Dialog")
  }
  
  const { open, setOpen } = context
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "relative bg-white rounded-lg p-6 shadow-xl max-w-md w-full max-h-[85vh] overflow-auto",
          className
        )}
        {...props}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold", className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export function DialogDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-gray-500", className)}
      {...props}
    >
      {children}
    </p>
  )
} 
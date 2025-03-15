import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <div className="relative inline-flex h-6 w-11 items-center rounded-full">
      <input
        type="checkbox"
        className="peer sr-only"
        ref={ref}
        {...props}
      />
      <span
        className={cn(
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "absolute inset-0 cursor-pointer rounded-full bg-gray-200 transition-colors duration-200 ease-in-out peer-checked:bg-blue-600",
          className
        )}
      />
      <span
        className="peer pointer-events-none absolute mx-1 my-1 h-4 w-4 rounded-full bg-white shadow-lg transition duration-200 ease-in-out peer-checked:translate-x-5"
        aria-hidden="true"
      />
    </div>
  )
)
Switch.displayName = "Switch"

export { Switch } 
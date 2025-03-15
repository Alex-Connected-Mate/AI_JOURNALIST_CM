import * as React from "react"

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  onClose?: () => void;
};

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void;
  toasts: ToastProps[];
  dismissToast: (index: number) => void;
} | null>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])
  
  const toast = (props: ToastProps) => {
    setToasts((prev) => [...prev, props])
    
    if (props.duration !== undefined) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((_, i) => i !== toasts.length))
      }, props.duration)
    }
  }
  
  const dismissToast = (index: number) => {
    setToasts((prev) => prev.filter((_, i) => i !== index))
  }
  
  return (
    <ToastContext.Provider value={{ toast, toasts, dismissToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast, index) => (
          <div
            key={index}
            className={`p-4 rounded shadow-md ${
              toast.variant === "destructive" ? "bg-red-100 border border-red-200" : "bg-white"
            }`}
          >
            {toast.title && (
              <h3 className={`font-medium ${toast.variant === "destructive" ? "text-red-700" : "text-gray-900"}`}>
                {toast.title}
              </h3>
            )}
            {toast.description && (
              <p className={`text-sm ${toast.variant === "destructive" ? "text-red-600" : "text-gray-500"}`}>
                {toast.description}
              </p>
            )}
            <button
              className="absolute top-1 right-1 text-sm text-gray-400 hover:text-gray-600"
              onClick={() => {
                toast.onClose?.()
                dismissToast(index)
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  
  return context
} 
import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { cn } from "../../lib/utils"
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react"

const ToastProvider = ToastPrimitive.Provider

export type ToastMessage = {
  title: string
  description: string
  variant: ToastVariant
}

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-6 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[450px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

type ToastVariant = "neutral" | "success" | "error"

interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant
}

const toastVariants: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode }> = {
  neutral: {
    bg: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    border: "border-blue-400",
    icon: <Info className="h-5 w-5 text-blue-100" />
  },
  success: {
    bg: "bg-gradient-to-r from-emerald-500 to-green-600 text-white",
    border: "border-emerald-400", 
    icon: <CheckCircle className="h-5 w-5 text-emerald-100" />
  },
  error: {
    bg: "bg-gradient-to-r from-red-500 to-red-600 text-white",
    border: "border-red-400",
    icon: <AlertTriangle className="h-5 w-5 text-red-100" />
  }
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = "neutral", ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border-2 p-6 pr-8 shadow-2xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-sm",
      toastVariants[variant].bg,
      toastVariants[variant].border,
      className
    )}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white/20 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitive.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-lg p-1 text-white/70 opacity-80 transition-opacity hover:opacity-100 hover:bg-white/20 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-5 w-5" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-base font-bold text-white leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm text-white/90 opacity-90 leading-relaxed mt-1", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

// Enhanced Toast component with icon
const EnhancedToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps & { children: React.ReactNode }
>(({ className, variant = "neutral", children, ...props }, ref) => (
  <Toast ref={ref} variant={variant} className={className} {...props}>
    <div className="flex items-start space-x-3 flex-1">
      {toastVariants[variant].icon}
      <div className="flex-1 space-y-1">
        {children}
      </div>
    </div>
    <ToastClose />
  </Toast>
))
EnhancedToast.displayName = "EnhancedToast"

export type { ToastProps, ToastVariant }
export {
  ToastProvider,
  ToastViewport,
  Toast,
  EnhancedToast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription
}
// src/components/ui/dialog.tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-300",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 duration-300",
        "bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl",
        "border border-slate-600/40 rounded-2xl shadow-2xl shadow-slate-900/60",
        "p-8 gap-6",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-48%",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-48%",
        className
      )}
      {...props}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-slate-900/10 rounded-2xl" />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Enhanced close button */}
      <DialogPrimitive.Close className="absolute right-6 top-6 rounded-xl bg-slate-800/60 border border-slate-600/40 p-2 text-slate-400 hover:text-white hover:bg-slate-700/80 hover:border-slate-500/60 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-3 text-center sm:text-left mb-6",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-3",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-tight tracking-tight text-white mb-2",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-slate-400 leading-relaxed",
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogClose = DialogPrimitive.Close

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
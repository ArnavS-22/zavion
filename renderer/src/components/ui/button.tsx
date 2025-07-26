import * as React from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  default: [
    "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg",
    "hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5",
    "active:from-blue-800 active:to-blue-900 active:shadow-md active:translate-y-0",
    "border border-blue-600 font-semibold",
    "transition-all duration-300 ease-out"
  ].join(" "),
  
  outline: [
    "border-2 border-gray-400 bg-white text-gray-800 shadow-md",
    "hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 hover:shadow-lg hover:-translate-y-0.5",
    "active:border-blue-600 active:bg-blue-100 active:shadow-sm active:translate-y-0",
    "font-medium",
    "transition-all duration-300 ease-out"
  ].join(" "),
  
  ghost: [
    "bg-transparent text-gray-700 font-medium",
    "hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm hover:-translate-y-0.5",
    "active:bg-gray-200 active:translate-y-0",
    "transition-all duration-300 ease-out"
  ].join(" "),
  
  destructive: [
    "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg",
    "hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:-translate-y-0.5",
    "active:from-red-800 active:to-red-900 active:shadow-md active:translate-y-0",
    "border border-red-600 font-semibold",
    "transition-all duration-300 ease-out"
  ].join(" "),
  
  link: [
    "bg-transparent underline-offset-4 text-blue-600 p-0 h-auto font-medium",
    "hover:text-blue-800 hover:underline",
    "transition-colors duration-200"
  ].join(" ")
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none h-12 px-6 py-3",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
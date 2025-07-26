import * as React from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800",
  ghost: "bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  link: "bg-transparent underline text-blue-600 hover:text-blue-800 p-0 h-auto"
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button }; 
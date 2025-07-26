import * as React from "react";
import { cn } from "../../lib/utils";

export interface LoaderProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeVariants = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

const Loader = React.forwardRef<SVGSVGElement, LoaderProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div className="inline-flex items-center justify-center">
      <svg
        ref={ref}
        className={cn(
          "animate-spin text-blue-600 drop-shadow-sm",
          sizeVariants[size],
          className
        )}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Loading"
        {...props}
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
        <circle
          className="opacity-40"
          cx="12"
          cy="12"
          r="6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  )
);
Loader.displayName = "Loader";

export { Loader };
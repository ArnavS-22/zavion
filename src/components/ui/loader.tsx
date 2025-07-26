import * as React from "react";
import { cn } from "../../lib/utils";

export interface LoaderProps extends React.HTMLAttributes<SVGSVGElement> {}

const Loader = React.forwardRef<SVGSVGElement, LoaderProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn("animate-spin h-5 w-5 text-blue-600", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
);
Loader.displayName = "Loader";

export { Loader }; 
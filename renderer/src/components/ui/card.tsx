import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "ghost";
}

const cardVariants: Record<NonNullable<CardProps["variant"]>, string> = {
  default: [
    "bg-white",
    "border border-gray-200 shadow-xl",
    "hover:shadow-2xl hover:border-gray-300 hover:-translate-y-1",
    "transition-all duration-300 ease-out"
  ].join(" "),
  
  outline: [
    "bg-white border-2 border-gray-300",
    "shadow-lg",
    "hover:border-blue-400 hover:shadow-xl hover:-translate-y-1",
    "transition-all duration-300 ease-out"
  ].join(" "),
  
  ghost: [
    "bg-gray-50/50 border-transparent shadow-sm",
    "hover:bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-1",
    "transition-all duration-300 ease-out"
  ].join(" ")
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border text-gray-900 backdrop-blur-sm",
        cardVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-3 p-8 pb-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-bold leading-tight tracking-tight text-gray-900", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-base text-gray-600 leading-relaxed mt-2", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-8 pt-0 space-y-4", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-8 pt-0 mt-6", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
};
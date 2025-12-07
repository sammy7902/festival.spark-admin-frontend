import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 transition-colors";

const getVariantClasses = (variant: ButtonVariant): string => {
  if (variant === "secondary") {
    return "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50";
  }

  if (variant === "outline") {
    return "bg-transparent text-gray-900 border border-gray-300 hover:bg-gray-50";
  }

  if (variant === "ghost") {
    return "bg-transparent text-gray-900 hover:bg-gray-100";
  }

  return "bg-gray-900 text-white hover:bg-gray-800";
};

const getSizeClasses = (size: ButtonSize): string => {
  if (size === "sm") {
    return "h-8 px-3 text-xs";
  }

  if (size === "lg") {
    return "h-11 px-6 text-sm";
  }

  return "h-10 px-4 text-sm";
};

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  asChild,
  type,
  ...props
}) => {
  const Component = asChild ? Slot : "button";
  const buttonType = type || "button";

  return (
    <Component
      type={buttonType}
      className={cn(baseClasses, getVariantClasses(variant), getSizeClasses(size), className)}
      {...props}
    />
  );
};



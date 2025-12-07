import React from "react";
import { cn } from "../../utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm px-4 py-3 md:px-6 md:py-4",
        className
      )}
      {...props}
    />
  );
};



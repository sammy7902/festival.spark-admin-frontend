import React from "react";
import { cn } from "../../utils/cn";

export type TabValue = string;

type TabsProps = {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
  options: Array<{ value: TabValue; label: string }>;
};

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, options }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, next: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onValueChange(next);
    }
  };

  return (
    <div className="inline-flex rounded-2xl border border-border bg-zinc-100 p-1">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "min-w-[5rem] rounded-2xl px-3 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100",
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "bg-transparent text-zinc-600 hover:bg-zinc-200"
            )}
            aria-pressed={isActive}
            aria-label={option.label}
            tabIndex={0}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};



import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel: string;
  disabled?: boolean;
};

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  disabled = false
}) => {
  // Filter out options with empty string values (Radix UI doesn't allow them)
  const validOptions = options.filter(opt => opt.value !== '');
  
  // Use undefined for empty values to show placeholder
  const selectValue = value === '' || value === 'none' ? undefined : value;

  return (
    <SelectPrimitive.Root 
      value={selectValue} 
      onValueChange={onValueChange} 
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 mt-1 max-h-60 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-gray-200 bg-white text-sm shadow-lg">
          <SelectPrimitive.Viewport className="p-1">
            {validOptions.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-gray-800 outline-none focus:bg-gray-100 transition-colors"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};



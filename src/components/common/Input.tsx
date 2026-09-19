import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors",
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300 dark:border-gray-700",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
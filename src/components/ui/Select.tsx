import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, children, options, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 font-body-md text-body-md text-[#0b1c30] focus:border-[#4e45d5] focus:outline-none focus:ring-2 focus:ring-[#4e45d5]/20 disabled:cursor-not-allowed disabled:bg-[#f1f5f9] disabled:opacity-60 transition-colors shadow-2xs',
            error && 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="font-body-sm text-body-sm text-[#ba1a1a] font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

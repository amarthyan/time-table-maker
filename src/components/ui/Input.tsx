import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 font-body-md text-body-md text-[#0b1c30] placeholder:text-[#76777d] focus:border-[#4e45d5] focus:outline-none focus:ring-2 focus:ring-[#4e45d5]/20 disabled:cursor-not-allowed disabled:bg-[#f1f5f9] disabled:opacity-60 transition-colors shadow-2xs',
            error && 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20',
            className
          )}
          {...props}
        />
        {error && <p className="font-body-sm text-body-sm text-[#ba1a1a] font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

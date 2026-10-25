import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'brand' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-label-md text-label-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4e45d5]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg cursor-pointer';

    const variants = {
      primary: 'bg-[#131b2e] text-white shadow-sm hover:bg-[#000000] active:scale-[0.98]',
      brand: 'bg-[#4e45d5] text-white shadow-md hover:bg-[#6860ef] active:scale-[0.98]',
      secondary: 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] active:scale-[0.98] border border-[#d3e4fe]',
      outline: 'border border-[#cbd5e1] bg-white text-[#334155] hover:bg-[#f8f9ff] active:scale-[0.98] shadow-xs',
      ghost: 'text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]',
      danger: 'bg-[#fee2e2] text-[#991b1b] border border-[#fecdd3] hover:bg-[#fecdd3] active:scale-[0.98]',
      success: 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-[#d1fae5] active:scale-[0.98]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

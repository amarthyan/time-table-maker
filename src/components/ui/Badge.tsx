import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline'
    | 'purple'
    | 'theory'
    | 'lab'
    | 'secondary';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#eff4ff] text-[#45464d] border-[#d3e4fe]',
    success: 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]',
    warning: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
    danger: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3]',
    info: 'bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]',
    purple: 'bg-[#f5f3ff] text-[#6d28d9] border-[#ddd6fe]',
    theory: 'bg-[#f0f9ff] text-[#0369a1] border-[#0284c7] font-bold uppercase',
    lab: 'bg-[#f5f3ff] text-[#6d28d9] border-[#7c3aed] font-bold uppercase',
    secondary: 'bg-[#e3dfff] text-[#100069] border-[#c3c0ff]',
    outline: 'border border-[#cbd5e1] text-[#334155] bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-label-sm text-label-sm tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

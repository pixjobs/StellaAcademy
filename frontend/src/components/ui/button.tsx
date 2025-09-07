import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base classes applied to all buttons for consistency
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // --- THIS IS THE NEW "LIQUID GLASS" STYLE ---
        // It's translucent, has a subtle border, and a backdrop blur for a frosted effect.
        default:
          'bg-white/10 border border-white/10 backdrop-blur-md shadow-lg text-slate-50 hover:bg-white/20',

        // A solid, theme-appropriate red for destructive actions. No glass effect for clarity.
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent',

        // --- THE "LIQUID GLASS" OUTLINE STYLE ---
        // Starts transparent and gains a subtle glass background on hover.
        outline:
          'border border-white/10 backdrop-blur-md text-slate-300 hover:bg-white/10 hover:text-slate-100',
        
        // A solid, subtle button for secondary actions that don't need the glass effect.
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
        
        // No background or border until hovered. The hover state uses the theme's accent color.
        ghost:
          'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
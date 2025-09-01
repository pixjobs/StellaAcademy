import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define the button styles using cva
const buttonVariants = cva(
  // Base classes applied to all buttons
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Main call-to-action button
        default: 'bg-sky-500 text-primary-foreground hover:bg-sky-500/90',
        // Destructive action button
        destructive: 'bg-red-700 text-destructive-foreground hover:bg-red-700/90',
        // Subtle, secondary button
        secondary: 'bg-slate-700 text-secondary-foreground hover:bg-slate-700/80',
        // Button with a visible border
        outline: 'border border-input bg-transparent hover:bg-slate-800 hover:text-accent-foreground',
        // Used for links that look like buttons
        ghost: 'hover:bg-slate-800 hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10', // For buttons that only contain an icon
      },
    },
    // Default variants if none are specified
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Define the props for the Button component
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean; // Optional prop for polymorphism
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
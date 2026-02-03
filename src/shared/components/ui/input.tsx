import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  cyber?: boolean;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      leftIcon,
      rightIcon,
      cyber,
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPasswordToggle ? (isVisible ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5 focus-within:z-20">
        {label && (
          <label
            className={cn(
              'ml-1 block',
              cyber
                ? 'font-mono text-[10px] tracking-[0.2em] text-[#00B37A] uppercase'
                : 'text-sm leading-none font-medium'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="text-muted-foreground pointer-events-none absolute left-3 flex items-center justify-center group-focus-within:text-[#00FF88]">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              (rightIcon || (isPassword && showPasswordToggle)) && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              cyber &&
                'rounded-xl border-[#00FF88]/20 bg-[#000000]/40 font-mono text-white placeholder:text-[#00B37A]/30 focus:border-[#00FF88]',
              className
            )}
            ref={ref}
            {...props}
          />
          {(rightIcon || (isPassword && showPasswordToggle)) && (
            <div className="text-muted-foreground absolute right-3 flex items-center justify-center">
              {isPassword && showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className="transition-colors hover:text-[#00FF88] focus:ring-0 focus:outline-none"
                  tabIndex={-1}
                >
                  {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        {error && (
          <p
            className={cn(
              'text-sm',
              cyber
                ? 'font-mono text-[10px] tracking-widest text-red-500 uppercase'
                : 'text-destructive'
            )}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

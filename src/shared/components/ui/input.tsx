import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  cyber?: boolean
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, cyber, showPasswordToggle = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPasswordToggle ? (isVisible ? 'text' : 'password') : type

    return (
      <div className="w-full space-y-1.5 focus-within:z-20">
        {label && (
          <label className={cn(
            "block ml-1",
            cyber
              ? "text-[10px] font-mono text-[#00B37A] uppercase tracking-[0.2em]"
              : "text-sm font-medium leading-none"
          )}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center justify-center pointer-events-none text-muted-foreground group-focus-within:text-[#00FF88]">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-black ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
              leftIcon && "pl-10",
              (rightIcon || (isPassword && showPasswordToggle)) && "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              cyber && "bg-[#000000]/40 border-[#00FF88]/20 focus:border-[#00FF88] text-white placeholder:text-[#00B37A]/30 font-mono rounded-xl",
              className
            )}
            ref={ref}
            {...props}
          />
          {(rightIcon || (isPassword && showPasswordToggle)) && (
            <div className="absolute right-3 flex items-center justify-center text-muted-foreground">
              {isPassword && showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className="hover:text-[#00FF88] transition-colors focus:outline-none focus:ring-0"
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
          <p className={cn(
            "text-sm",
            cyber ? "font-mono text-[10px] uppercase tracking-widest text-red-500" : "text-destructive"
          )}>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

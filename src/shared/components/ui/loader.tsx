'use client';

import React from 'react';
import { cn } from '@lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ size = 'md', className }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl',
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      {/* Spinning ring */}
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#00FF88]" />

      {/* Green G letter */}
      <span className="animate-pulse font-bold text-[#00FF88]">G</span>
    </div>
  );
}

// Full page loader with centered positioning
export function PageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <Loader size="lg" />
    </div>
  );
}

// Inline loader for buttons
export function ButtonLoader({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex h-4 w-4 items-center justify-center', className)}>
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-current" />
      <span className="text-xs font-bold">G</span>
    </div>
  );
}

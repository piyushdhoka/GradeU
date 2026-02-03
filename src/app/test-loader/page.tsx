'use client';

import { Loader, PageLoader, ButtonLoader } from '@components/ui/loader';
import { Button } from '@components/ui/button';
import { useState } from 'react';

export default function TestLoaderPage() {
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleButtonClick = () => {
    setIsButtonLoading(true);
    setTimeout(() => setIsButtonLoading(false), 2000);
  };

  if (showPageLoader) {
    return (
      <div className="relative">
        <PageLoader message="Loading your content..." />
        <button
          onClick={() => setShowPageLoader(false)}
          className="fixed top-4 right-4 z-50 rounded bg-red-500 px-4 py-2 text-white"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] p-8 text-white">
      <h1 className="mb-8 text-3xl font-bold">Loader Test Page</h1>

      {/* Size Variants */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-[#00FF88]">Size Variants</h2>
        <div className="flex items-center gap-12">
          <div className="text-center">
            <Loader size="sm" />
            <p className="mt-2 text-sm text-zinc-400">Small</p>
          </div>
          <div className="text-center">
            <Loader size="md" />
            <p className="mt-2 text-sm text-zinc-400">Medium</p>
          </div>
          <div className="text-center">
            <Loader size="lg" />
            <p className="mt-2 text-sm text-zinc-400">Large</p>
          </div>
        </div>
      </section>

      {/* Button Loader */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-[#00FF88]">Button Loader</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleButtonClick} isLoading={isButtonLoading}>
            Click to Load
          </Button>
          <Button variant="cyber" isLoading>
            Always Loading
          </Button>
          <button className="flex items-center gap-2 rounded bg-zinc-800 px-4 py-2">
            <ButtonLoader />
            <span>Custom Button</span>
          </button>
        </div>
      </section>

      {/* Page Loader */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-[#00FF88]">Page Loader</h2>
        <Button onClick={() => setShowPageLoader(true)} variant="outline">
          Show Full Page Loader
        </Button>
      </section>

      {/* Inline Usage */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-[#00FF88]">Inline Usage</h2>
        <div className="flex items-center gap-3 rounded-lg border border-[#00FF88]/20 bg-[#0A0F0A] px-6 py-4">
          <Loader size="sm" />
          <span>Syncing data...</span>
        </div>
      </section>

      {/* Card Loading State */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-[#00FF88]">Card Loading State</h2>
        <div className="flex h-48 w-64 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
          <Loader size="md" />
        </div>
      </section>
    </div>
  );
}

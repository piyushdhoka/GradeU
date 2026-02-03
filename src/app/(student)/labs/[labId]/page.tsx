'use client';
import { use, Suspense } from 'react';
import { LabViewer } from '@student/components/Labs/LabViewer';
import { useRouter } from 'next/navigation';

function LabViewerContent({ labId }: { labId: string }) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/labs');
  };

  return <LabViewer labId={labId} onBack={handleBack} />;
}

function LabViewerPageContent({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = use(params);

  return <LabViewerContent labId={labId} />;
}

export default function LabViewerPage({ params }: { params: Promise<{ labId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#00FF88]"></div>
            <p className="text-[#00FF88]">Loading lab...</p>
          </div>
        </div>
      }
    >
      <LabViewerPageContent params={params} />
    </Suspense>
  );
}

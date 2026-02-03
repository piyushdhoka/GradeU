'use client';
import { use, Suspense } from 'react';
import { LabViewer } from '@student/components/Labs/LabViewer';
import { useRouter } from 'next/navigation';
import { Loader } from '@components/ui/loader';

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
            <Loader size="lg" />
            <p className="mt-4 text-[#00FF88]">Loading lab...</p>
          </div>
        </div>
      }
    >
      <LabViewerPageContent params={params} />
    </Suspense>
  );
}

'use client';
import { use } from 'react';
import { CourseDetail } from '@student/components/Courses/CourseDetail';
import { useRouter } from 'next/navigation';

function CourseDetailContent({ id }: { id: string }) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/courses');
  };

  return <CourseDetail courseId={id} onBack={handleBack} />;
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <CourseDetailContent id={id} />;
}

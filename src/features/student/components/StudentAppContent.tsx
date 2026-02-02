"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { LandingPage } from './Landing/LandingPage';
import { Dashboard } from './Dashboard/Dashboard';
import { DashboardHeader } from "@shared/components/layout/DashboardHeader"
import { ProctoringDemo } from './Proctoring/ProctoringDemo';
import { CourseList } from './Courses/CourseList';
import { CourseDetail } from './Courses/CourseDetail';
import { LabsList } from './Labs/LabsList';
import { LabViewer } from './Labs/LabViewer';
import { Certificates } from './Certificates/Certificates';
import { Profile } from './Profile/Profile';
import { VideoLibrary } from './Video/VideoLibrary';

import { CommunityPage } from './Community/CommunityPage';
import { SidebarInset, SidebarProvider } from "@shared/components/ui/sidebar"
import { AppSidebar } from "@shared/components/layout/AppSidebar"
import { StickyBanner } from '@shared/components/ui/sticky-banner';
import '../styles/student.css';

interface StudentAppContentProps {
  initialTab?: string;
}

export const StudentAppContent: React.FC<StudentAppContentProps> = ({ initialTab }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleNavigateToTab = (e: CustomEvent<{ tab: string; labId?: string }>) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
        setSelectedCourseId(null);
        if (e.detail.labId) {
          setSelectedLabId(e.detail.labId);
        } else {
          setSelectedLabId(null);
        }
      }
    };

    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);
    return () => {
      window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
    };
  }, []);

  if (!user) {
    return <LandingPage />;
  }

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleLabSelect = (labId: string) => {
    setSelectedLabId(labId);
  };

  const renderContent = () => {
    if (activeTab === 'courses' && selectedCourseId) {
      return <CourseDetail courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
    }

    if (activeTab === 'labs' && selectedLabId) {
      return <LabViewer labId={selectedLabId} onBack={() => setSelectedLabId(null)} />;
    }

    if (activeTab === 'landing') {
      return <LandingPage />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;

      case 'proctor-demo':
        return <ProctoringDemo />;
      case 'courses':
        return <CourseList onCourseSelect={handleCourseSelect} />;
      case 'videos':
        return <VideoLibrary />;
      case 'labs':
        return <LabsList onLabSelect={handleLabSelect} />;

      case 'certificates':
        return <Certificates />;
      case 'profile':
        return <Profile />;
      case 'community':
        return <CommunityPage onBack={() => setActiveTab('dashboard')} />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  const isFullPage = ['community', 'landing'].includes(activeTab);

  if (isFullPage) {
    return <main className="min-h-screen">{renderContent()}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50">
        <StickyBanner className="bg-blue-600 border-none shrink-0 pointer-events-auto">
          <p className="text-xs font-medium text-white tracking-wide text-center px-4">
            Announcing the GradeU Community. Connect with fellow students and share knowledge.{" "}
            <button
              onClick={() => setActiveTab('community')}
              className="text-white font-black hover:underline ml-2 uppercase tracking-tighter"
            >
              Join Community &rarr;
            </button>
          </p>
        </StickyBanner>
      </div>
      <SidebarProvider className="dark w-full bg-background text-foreground">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset>
          <div className="sticky top-0 z-40">
            <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {renderContent()}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

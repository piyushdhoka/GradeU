import { useState } from 'react';
import { Header } from '@components/layout/Header';
import { TeachersList } from './admin/TeachersList';
import { StudentsList } from './admin/StudentsList';
import { CoursesList } from './admin/CoursesList';
import { AnalyticsView } from './admin/AnalyticsView';
import { AuditLogs } from './admin/AuditLogs';

type View = 'teachers' | 'students' | 'courses' | 'analytics' | 'logs';

export const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState<View>('teachers');

  const menuItems = [
    { id: 'teachers', label: 'Teachers' },
    { id: 'students', label: 'Students' },
    { id: 'courses', label: 'Courses' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'logs', label: 'Audit Logs' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 bg-black border-r border-white/5 hidden md:flex flex-col">
          <nav className="flex-1 px-4 py-8 space-y-1">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-all duration-200
                    ${isActive
                      ? 'text-white border-l-2 border-white bg-white/5'
                      : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-black relative">
          <div className="max-w-6xl mx-auto p-8 lg:p-12">
            <header className="mb-12">
              <h1 className="text-xl font-light uppercase tracking-[0.3em] text-white">
                {currentView}
              </h1>
              <div className="h-px w-24 bg-white/20 mt-4" />
            </header>

            <div className="animate-fade-in">
              {currentView === 'teachers' && <TeachersList />}
              {currentView === 'students' && <StudentsList />}
              {currentView === 'courses' && <CoursesList />}
              {currentView === 'analytics' && <AnalyticsView />}
              {currentView === 'logs' && <AuditLogs />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
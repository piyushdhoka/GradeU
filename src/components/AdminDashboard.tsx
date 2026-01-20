import { useState } from 'react';
import { Header } from '@components/layout/Header';
import { TeachersList } from './admin/TeachersList';
import { StudentsList } from './admin/StudentsList';
import { CoursesList } from './admin/CoursesList';
import { AnalyticsView } from './admin/AnalyticsView';
import { AuditLogs } from './admin/AuditLogs';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  FileText
} from 'lucide-react';

type View = 'teachers' | 'students' | 'courses' | 'analytics' | 'logs';

export const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState<View>('teachers');

  const menuItems = [
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <Header />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-card/50 backdrop-blur-xl border-r border-border hidden md:flex flex-col">
          <div className="p-6">
            <h2 className="text-xs uppercase text-muted-foreground font-bold tracking-widest">Admin Control</h2>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:translate-x-1'
                    }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              CyberCoach Admin v1.0
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          {/* Background Glow Effect */}
          <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent capitalize tracking-tight flex items-center gap-3">
                {menuItems.find(i => i.id === currentView)?.icon && (
                  <div className="p-2 rounded-lg bg-secondary/50 border border-white/5">
                    {(() => {
                      const Icon = menuItems.find(i => i.id === currentView)?.icon;
                      return Icon && <Icon className="h-6 w-6 text-primary" />;
                    })()}
                  </div>
                )}
                {currentView} Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">Manage your platform resources and monitor activity.</p>
            </header>

            <div className="relative z-10 space-y-6 animate-fade-in">
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
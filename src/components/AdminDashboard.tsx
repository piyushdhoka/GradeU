import { useState, useEffect } from 'react';
import { Users, BookOpen, Eye, Crown, GraduationCap, TrendingUp, Activity } from 'lucide-react';
import { adminService } from '@services/adminService';
import { supabase } from '@lib/supabase';
import type { User } from '@types';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Header } from '@components/layout/Header';
import { AdminSidebar } from './AdminSidebar';

type Role = 'student' | 'teacher' | 'admin';
type View = 'overview' | 'users' | 'courses' | 'analytics' | 'settings';

interface DashboardStats {
  users: { teachers: number; students: number; total: number };
  courses: { total: number; published: number; draft: number };
  enrollments: { total: number; thisMonth: number };
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  enrollment_count: number;
  teacher?: { id: string; name: string } | null;
}

export const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<View>('overview');
  const [users, setUsers] = useState<(User & { role?: Role; created_at?: string | Date; level?: 'beginner' | 'intermediate' | 'advanced' })[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_enrollments' }, () => loadDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [usersData, coursesData, statsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllCourses(),
        adminService.getDashboardStats()
      ]);

      setUsers(usersData);
      setCourses(coursesData as any);
      setStats(statsData as any);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleCourseStatusToggle = async (courseId: string, isPublished: boolean) => {
    try {
      await adminService.updateCourseStatus(courseId, isPublished);
      setCourses(courses.map(c => (c.id === courseId ? { ...c, is_published: isPublished } : c)));
    } catch (error) {
      console.error('Failed to update course status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="flex">
        <AdminSidebar activeTab={activeView} onTabChange={(tab) => setActiveView(tab as View)} />
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold bg-linear-to-r from-white via-white/80 to-white/60 bg-clip-text text-transparent">Admin Dashboard</h1>
                  <Badge variant="destructive" className="animate-pulse">Live</Badge>
                </div>
              </div>
            </div>

            {/* Overview */}
            {activeView === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card variant="cyber" hover className="relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Students</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stats?.users?.students || 0}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <GraduationCap className="h-8 w-8 text-emerald-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="cyber" hover className="relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Teachers</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stats?.users?.teachers || 0}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Users className="h-8 w-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="cyber" hover className="relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Published Courses</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stats?.courses?.published || 0}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <BookOpen className="h-8 w-8 text-amber-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="cyber" hover className="relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Enrollments</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stats?.enrollments?.total || 0}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <TrendingUp className="h-8 w-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card variant="glass" className="border-white/5 bg-white/2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            user.role === 'teacher' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                            {user.role === 'admin' ? <Crown className="h-5 w-5" /> :
                              user.role === 'teacher' ? <Users className="h-5 w-5" /> :
                                <GraduationCap className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium">{user.name}</p>
                            <p className="text-muted-foreground text-sm">Joined as <span className="capitalize">{user.role}</span></p>
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {new Date(user.created_at ?? Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Management */}
            {activeView === 'users' && (
              <Card variant="glass" className="border-white/5 bg-white/2">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Level</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Joined</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  user.role === 'teacher' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>
                                  {(user?.name ?? 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-foreground font-medium">{user?.name ?? 'Unknown'}</p>
                                  <p className="text-muted-foreground text-xs">{user?.email ?? ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={user.role ?? 'student'}
                                onChange={(e) => handleRoleChange(user.id as string, e.target.value as Role)}
                                className="bg-background text-foreground rounded-lg px-3 py-1 text-sm border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant={
                                user.level === 'advanced' ? 'destructive' :
                                  user.level === 'intermediate' ? 'warning' :
                                    'success'
                              }>
                                {user.level}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground text-sm">
                              {new Date(user.created_at ?? Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Courses Management */}
            {activeView === 'courses' && (
              <Card variant="glass" className="border-white/5 bg-white/2">
                <CardHeader>
                  <CardTitle>Course Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {courses.map((course) => (
                      <div key={course.id} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-primary/30 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-bold text-foreground">{course.title}</h3>
                              <Badge variant={course.is_published ? 'success' : 'warning'}>
                                {course.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{course.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Teacher: {course.teacher?.name || 'Unknown'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {course.difficulty}
                              </Badge>
                              <span>
                                {course.enrollment_count} enrolled
                              </span>
                            </div>
                          </div>
                          <Button
                            variant={course.is_published ? 'warning' : 'success'}
                            size="sm"
                            onClick={() => handleCourseStatusToggle(course.id, !course.is_published)}
                          >
                            {course.is_published ? 'Unpublish' : 'Publish'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analytics */}
            {activeView === 'analytics' && (
              <div className="space-y-8">
                <Card variant="glass" className="border-white/5 bg-white/2">
                  <CardHeader>
                    <CardTitle>Platform Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-foreground mb-4">User Growth</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">This Month</span>
                            <span className="text-green-400 font-medium">+{stats?.enrollments?.thisMonth || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Users</span>
                            <span className="text-foreground font-medium">{stats?.users?.total || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-foreground mb-4">Course Statistics</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Published</span>
                            <span className="text-green-400 font-medium">{stats?.courses?.published || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Draft</span>
                            <span className="text-yellow-400 font-medium">{stats?.courses?.draft || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings */}
            {activeView === 'settings' && (
              <div className="space-y-8">
                <Card variant="glass" className="border-white/5 bg-white/2">
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-foreground mb-4">General Settings</h3>
                        <p className="text-muted-foreground">Platform configuration settings coming soon.</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-foreground mb-4">Security Settings</h3>
                        <p className="text-muted-foreground">Security and authentication settings coming soon.</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-foreground mb-4">Email Notifications</h3>
                        <p className="text-muted-foreground">Email notification configuration coming soon.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
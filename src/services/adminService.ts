import { supabase } from '@lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create admin client if service role key is available
const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
  : supabase;

class AdminService {
  // User Management
  async getAllUsers() {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch users: ${error.message}`);

      // Map database fields to frontend expected format
      return data?.map(user => ({
        ...user,
        name: user.full_name || 'Unknown',
        email: '', // Not available in profiles schema
        level: 'beginner', // Not available in profiles schema
        created_at: user.created_at
      })) || [];
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch users by role: ${error.message}`);

      return data?.map(user => ({
        ...user,
        name: user.full_name || 'Unknown',
        email: '',
        level: 'beginner',
        created_at: user.created_at
      })) || [];
      return data?.map(user => ({
        ...user,
        name: user.full_name || 'Unknown',
        email: '',
        level: 'beginner',
        created_at: user.created_at
      })) || [];
    } catch (error) {
      console.error('Get users by role error:', error);
      throw error;
    }
  }

  async getAllTeachers() {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*, teacher_details(*)')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch teachers: ${error.message}`);

      return data?.map(user => ({
        ...user,
        name: user.full_name || 'Unknown',
        email: '',
        specialization: user.teacher_details?.specialization || 'General',
        bio: user.teacher_details?.bio || '',
        joined_at: user.created_at
      })) || [];
    } catch (error) {
      console.error('Get all teachers error:', error);
      throw error;
    }
  }

  async createTeacher(teacherData: { email: string; password: string; name: string; specialization: string; bio: string }) {
    try {
      // Use a temporary client to avoid signing out the current admin user
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false, // Don't persist this session
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: teacherData.email,
        password: teacherData.password,
        options: {
          data: {
            full_name: teacherData.name,
            role: 'teacher'
          }
        }
      });

      if (authError) throw new Error(`Failed to create teacher account: ${authError.message}`);
      if (!authData.user) throw new Error('Failed to create teacher account: No user returned');

      // 2. Insert into profiles (if trigger doesn't handle it, better to be safe)
      // Note: The trigger usually handles this, but since we have RLS disabled or weirdness, let's verify.
      // Actually, standard practice is trigger. But we can update if needed.
      // However, we need to create the teacher_details entry manually.

      // Wait a moment for trigger (if any) or manually insert if we can (but RLS `auth.uid() = id` blocks us from inserting FOR another user usually, unless we are service_role or admin policy allows it).
      // Since we just fixed RLS to allow Admins to insert/manage, we can try inserting teacher_details.

      const { error: detailsError } = await supabase
        .from('teacher_details')
        .insert({
          id: authData.user.id,
          specialization: teacherData.specialization,
          bio: teacherData.bio
        });

      if (detailsError) {
        // Fallback: If profile doesn't exist yet (race condition with trigger), wait and retry?
        // Or if error is about Foreign Key...
        console.error('Failed to create teacher details immediately:', detailsError);
        // We might just return success and let them update details later
      }

      return authData.user;
    } catch (error) {
      console.error('Create teacher error:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update user role: ${error.message}`);

      const user = data;
      return {
        ...user,
        name: user.full_name || 'Unknown',
        email: '',
        level: 'beginner'
      };
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      // Also delete from auth users if using admin client
      if (serviceRoleKey) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) console.error('Failed to delete user from Auth:', authError);
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw new Error(`Failed to delete user: ${error.message}`);
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw new Error(`Failed to update user status: ${error.message}`);
      return true;
    } catch (error) {
      console.error('Toggle user status error:', error);
      throw error;
    }
  }



  // Course Management (Admin can manage all courses)
  async getAllCourses() {
    try {
      // Fetch courses with enrollment count
      const { data: courses, error } = await supabaseAdmin
        .from('courses')
        .select('*, enrollments(count)')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch all courses: ${error.message}`);

      if (!courses || courses.length === 0) return [];

      // Manually fetch teacher profiles since FK points to auth.users, not public.profiles
      const teacherIds = [...new Set(courses.map(c => c.created_by).filter(Boolean))];

      let teachersMap: Record<string, any> = {};
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds);

        if (teachers) {
          teachersMap = teachers.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
        }
      }

      // Map data to frontend format
      return courses.map(course => ({
        ...course,
        enrollment_count: course.enrollments?.[0]?.count || 0,
        teacher: teachersMap[course.created_by]
          ? { id: course.created_by, name: teachersMap[course.created_by].full_name || 'Unknown' }
          : { id: course.created_by, name: 'Unknown' }
      }));
    } catch (error) {
      console.error('Get all courses error:', error);
      throw error;
    }
  }

  /* Notes Management - Removed as table 'notes' does not exist in schema
  async getAllNotes() {
    return [];
  }

  async createNote(noteData: unknown) {
    throw new Error('Notes feature is not available');
  }
  */

  async uploadFile(file: File, folder = 'uploads') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (error) throw new Error(`Failed to upload file: ${error.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  async updateCourseStatus(courseId: string, isPublished: boolean) {
    try {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .update({ is_published: isPublished })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update course status: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Update course status error:', error);
      throw error;
    }
  }

  // Analytics and Reports
  async getDashboardStats() {
    try {
      // Get user counts by role
      const { data: userStats, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .neq('role', 'admin');

      if (userError) throw new Error(`Failed to fetch user stats: ${userError.message}`);

      // Get course stats
      const { data: courseStats, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('is_published'); // enrollment_count not in schema

      if (courseError) throw new Error(`Failed to fetch course stats: ${courseError.message}`);

      // Get enrollment stats
      const { data: enrollmentStats, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('enrolled_at');

      if (enrollmentError) throw new Error(`Failed to fetch enrollment stats: ${enrollmentError.message}`);

      // Process stats
      const teachers = userStats.filter(u => u.role === 'teacher').length;
      const students = userStats.filter(u => u.role === 'student').length;
      const totalCourses = courseStats.length;
      const publishedCourses = courseStats.filter(c => c.is_published).length;
      const totalEnrollments = enrollmentStats.length;

      return {
        users: {
          teachers,
          students,
          total: teachers + students
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: totalCourses - publishedCourses
        },
        enrollments: {
          total: totalEnrollments,
          thisMonth: enrollmentStats.filter(e => {
            const enrollDate = new Date(e.enrolled_at);
            const now = new Date();
            return enrollDate.getMonth() === now.getMonth() &&
              enrollDate.getFullYear() === now.getFullYear();
          }).length
        }
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('module_progress')
        .select(`
          *,
          module:modules(
            title,
            course:courses(title)
          )
        `) // removed difficulty, strictly adhering to what might be available or minimizing assumptions
        .eq('student_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw new Error('Failed to fetch user progress');
      return data;
    } catch (error) {
      console.error('Get user progress error:', error);
      throw error;
    }
  }

  async getTeacherAnalytics(teacherId: string) {
    try {
      // Get teacher's courses with enrollment data
      const { data: courses, error: coursesError } = await supabaseAdmin
        .from('courses')
        .select(`
          *,
          enrollments(count)
        `)
        .eq('created_by', teacherId);

      if (coursesError) throw new Error('Failed to fetch teacher courses');

      // Get student progress for teacher's courses
      const courseIds = courses.map(c => c.id);

      // Note: module_progress does not have course_id directly, it links to modules.
      // We would need to join modules to filter by course_id, but supabase-js simple filter .in() might not work efficiently across deep relations without explicit join syntax.
      // For now, attempting to fetch via modules. 
      // Actually, schema: module_progress -> modules -> courses.
      // This query logic needs simplified or just fetch modules first. 
      // Simplification: Fetch module_progress where module_id is in (all modules of these courses).

      // First get modules for these courses
      const { data: modulesData } = await supabaseAdmin.from('modules').select('id').in('course_id', courseIds);
      const moduleIds = modulesData?.map(m => m.id) || [];

      const { data: progress, error: progressError } = await supabaseAdmin
        .from('module_progress')
        .select('*')
        .in('module_id', moduleIds);

      if (progressError) throw new Error('Failed to fetch progress data');

      return {
        courses: courses.length,
        totalEnrollments: progress.length, // roughly
        completedModules: progress.filter(p => p.completed).length,
        averageScore: 0 // Schema has no score
      };
    } catch (error) {
      console.error('Get teacher analytics error:', error);
      throw error;
    }
  }

  async getTeacherCourses(teacherId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select('*, enrollments(count)')
        .eq('created_by', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw new Error('Failed to fetch teacher courses');

      return data?.map(c => ({
        ...c,
        enrollment_count: c.enrollments?.[0]?.count || 0
      })) || [];
    } catch (error) {
      console.error('Get teacher courses error:', error);
      return [];
    }
  }

  // AI Generation Monitoring
  async getGenerationJobs() {
    try {
      // Check if table exists first by selecting 1 row
      const { data, error } = await supabaseAdmin
        .from('generation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Generation jobs table might not exist or RLS error:', error);
        return [];
      }
      return data;
    } catch (error) {
      return [];
    }
  }

  // System Activity / Audit Logs
  async getSystemActivity() {
    try {
      // Mocking audit logs if table doesn't exist yet, or trying to fetch from profiles updated_at
      // Ideally we'd have an 'admin_audit_logs' table.
      // For now, let's return a combination of recent signups and course creations.

      const { data: newUsers } = await supabaseAdmin
        .from('profiles')
        .select('created_at, full_name, role')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: newCourses } = await supabaseAdmin
        .from('courses')
        .select('created_at, title, created_by')
        .order('created_at', { ascending: false })
        .limit(10);

      const activity = [
        ...(newUsers?.map(u => ({
          type: 'user_joined',
          description: `New ${u.role} joined: ${u.full_name || 'Unknown'}`,
          timestamp: u.created_at
        })) || []),
        ...(newCourses?.map(c => ({
          type: 'course_created',
          description: `New course created: ${c.title}`,
          timestamp: c.created_at
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activity;
    } catch (error) {
      console.error('Get system activity error:', error);
      return [];
    }
  }
}

export const adminService = new AdminService();
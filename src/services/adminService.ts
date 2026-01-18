import { supabase } from '@lib/supabase';

class AdminService {
  // User Management
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch users: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch users by role: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Get users by role error:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update user role: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw new Error(`Failed to delete user: ${error.message}`);
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Course Management (Admin can manage all courses)
  async getAllCourses() {
    try {
      // Avoid relationship join to prevent errors if FK/relationship isn't configured
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch all courses: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Get all courses error:', error);
      throw error;
    }
  }

  // Notes Management
  async getAllNotes() {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch notes: ${error.message}`);
      return data || [];
    } catch (error) {
      console.error('Get notes error:', error);
      throw error;
    }
  }

  async createNote(noteData: unknown) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single();

      if (error) throw new Error(`Failed to create note: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Create note error:', error);
      throw error;
    }
  }

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
      const { data, error } = await supabase
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
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('role')
        .neq('role', 'admin');

      if (userError) throw new Error(`Failed to fetch user stats: ${userError.message}`);

      // Get course stats
      const { data: courseStats, error: courseError } = await supabase
        .from('courses')
        .select('is_published, enrollment_count');

      if (courseError) throw new Error(`Failed to fetch course stats: ${courseError.message}`);

      // Get enrollment stats
      const { data: enrollmentStats, error: enrollmentError } = await supabase
        .from('course_enrollments')
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
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          course:courses(title, difficulty),
          module:course_modules(title)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

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
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_enrollments(count)
        `)
        .eq('teacher_id', teacherId);

      if (coursesError) throw new Error('Failed to fetch teacher courses');

      // Get student progress for teacher's courses
      const courseIds = courses.map(c => c.id);
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .in('course_id', courseIds);

      if (progressError) throw new Error('Failed to fetch progress data');

      return {
        courses: courses.length,
        totalEnrollments: progress.length,
        completedModules: progress.filter(p => p.completed).length,
        averageScore: progress.length > 0 
          ? progress.reduce((sum, p) => sum + p.quiz_score, 0) / progress.length 
          : 0
      };
    } catch (error) {
      console.error('Get teacher analytics error:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
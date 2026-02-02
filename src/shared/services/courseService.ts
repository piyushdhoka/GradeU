import { supabase } from '@lib/supabase';
import { getApiUrl } from '@lib/apiConfig';
import type { Course, Module } from '@types';

/**
 * Fetch with timeout and retry for CDN content
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @param retries - Number of retries (default: 2)
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
  retries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-network errors
      if (lastError.name !== 'AbortError' && !lastError.message.includes('fetch')) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Normalizes a module object to ensure it has an 'id' field and consistent structure.
 * Handles both Supabase (id) and MongoDB (_id) formats.
 */
function normalizeModule(module: any): Module {
  if (!module) return module;
  const id = (module.id || module._id || '').toString();
  return {
    ...module,
    id,
    content: module.content || module.content_markdown || '',
    order: module.order ?? module.module_order ?? 0
  };
}

/**
 * Normalizes a course object to ensure it has an 'id' field and consistent module structure.
 */
function normalizeCourse(course: any): Course {
  if (!course) return course;
  const modules = (course.modules || course.course_modules || [])
    .map(normalizeModule);

  return {
    ...course,
    id: (course.id || course._id || '').toString(),
    modules,
    module_count: modules.length
  };
}

class CourseService {
  // Course Management
  async createCourse(courseData: Omit<Partial<Course>, 'modules'> & { modules?: Partial<Module>[] }) {
    try {
      console.log('Creating course with data:', courseData);

      let contentJsonUrl = null;

      // Hybrid Storage: Upload content to bucket if modules exist
      if (courseData.modules && courseData.modules.length > 0) {
        const courseContent = {
          title: courseData.title,
          description: courseData.description,
          modules: courseData.modules,
          generatedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(courseContent)], { type: 'application/json' });
        const fileName = `course_${Date.now()}_${Math.random().toString(36).substring(7)}.json`;

        const { error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(fileName, blob);

        if (uploadError) {
          console.error('Failed to upload course content:', uploadError);
          // Continue with DB creation, but warn
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('course-content')
            .getPublicUrl(fileName);
          contentJsonUrl = publicUrl;
        }
      }
      const { data: resultData, error } = await supabase
        .from('courses')
        .insert([{
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          difficulty: courseData.difficulty,
          estimated_hours: courseData.estimated_hours || 0,
          // is_published: removed
          enrollment_count: 0,
          rating: 0,
          content_json_url: contentJsonUrl
        }])
        .select()
        .limit(1);

      const data = resultData?.[0];

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create course: ${error.message}`);
      }

      console.log('Course created successfully:', data);

      // Return full course object with modules
      return {
        ...data,
        modules: courseData.modules || []
      };
    } catch (error) {
      console.error('Create course error:', error);
      throw error;
    }
  }

  async updateCourse(id: string, updates: Omit<Partial<Course>, 'modules'> & { modules?: Partial<Module>[] }) {
    try {
      // Hybrid Storage Update: Re-upload content if modules are provided
      if (updates.modules && updates.modules.length > 0) {
        const courseContent = {
          title: updates.title, // Note: might need to fetch existing title if not in updates, but assuming full update usually
          description: updates.description,
          modules: updates.modules,
          updatedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(courseContent)], { type: 'application/json' });
        const fileName = `course_${id}_${Date.now()}.json`; // Use ID to keep it related? Or just new file. New file avoids cache.

        const { error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(fileName, blob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('course-content')
            .getPublicUrl(fileName);

          // Add the new URL to the updates object for the DB update
          (updates as any).content_json_url = publicUrl;
        } else {
          console.error('Failed to upload updated course content:', uploadError);
        }
      }

      const { data: resultData, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .limit(1);

      const data = resultData?.[0];

      if (error) throw new Error(`Failed to update course: ${error.message}`);

      // Return full course object with modules (if updated)
      return {
        ...data,
        modules: updates.modules || [] // Note: might need existing modules if not updated, but for now this is safer than nothing
      };
    } catch (error) {
      console.error('Update course error:', error);
      throw error;
    }
  }

  async deleteCourse(id: string) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to delete course: ${error.message}`);
      return true;
    } catch (error) {
      console.error('Delete course error:', error);
      throw error;
    }
  }



  async getVUStudent(email: string): Promise<any> {
    try {
      // Attempt to match with static web security course data if applicable
      // valid emails for demo
      const validEmails = ['demo@vu.com', 'test@example.com', email];

      if (validEmails.includes(email)) {
        // Return a mock student object that matches what Profile.tsx expects
        return {
          name: 'VU Student',
          email: email,
          progress: [
            { course_id: 'vu-web-security', completed: true }
          ]
        };
      }
      return null;
    } catch (error) {
      console.error('Get VU Student error:', error);
      return null;
    }
  }

  async getAllCourses(): Promise<Course[]> {
    try {
      // Primary: Fetch from backend API (MongoDB) for consistency with getCourseById
      const response = await fetch(getApiUrl('/api/student/courses'));

      if (response.ok) {
        const courses = await response.json();
        return (courses || []).map(normalizeCourse);
      }

      // Fallback: Fetch from Supabase if backend is unavailable
      console.log('Backend unavailable, falling back to Supabase...');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch courses: ${error.message}`);

      return (data || []).map((course: any) => ({
        ...course,
        module_count: 0,
        modules: [],
        skills: []
      }));
    } catch (error) {
      console.error('Get all courses error:', error);
      return [];
    }
  }

  async getCourseById(id: string): Promise<Course | null> {
    // 0. Static Override for VU Course
    if (id === 'vu-web-security') {
      const { vuWebSecurityCourse } = await import('@data/vu-courses/web-application-security');
      return vuWebSecurityCourse;
    }

    try {
      // 1. Fetch from Backend API (MongoDB)
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`/api/student/courses/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        // Fallback or just return null
        if (response.status === 404) return null;
        console.error('Backend API error:', response.statusText);
        // Fallback to Supabase if API fails? No, data mismatch risk.
        return null;
      }

      const courseData = await response.json();
      return normalizeCourse(courseData);

    } catch (error) {
      console.error('Get course by id error:', error);
      return null;
    }
  }

  async getModuleCount(courseId: string): Promise<number> {
    if (courseId === 'vu-web-security') return 12;
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (error) throw new Error(`Failed to count modules: ${error.message}`);
      return data?.length || 0;
    } catch (error) {
      console.error('Get module count error:', error);
      throw error;
    }
  }  // Module Management
  async createModule(moduleData: Partial<Module>) {
    try {
      // Check current module count
      const currentCount = await this.getModuleCount(moduleData.course_id!);

      if (currentCount >= 10) {
        throw new Error('Maximum module limit (10) reached for this course');
      }

      const { data: resultData, error } = await supabase
        .from('modules')
        .insert([{
          ...moduleData,
          module_order: currentCount + 1
          // is_published: false // Removed
        }])
        .select()
        .limit(1);

      const data = resultData?.[0];

      if (error) throw new Error(`Failed to create module: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Create module error:', error);
      throw error;
    }
  }

  async updateModule(id: string, updates: Partial<Module>) {
    try {
      const { data: resultData, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .limit(1);

      const data = resultData?.[0];

      if (error) throw new Error(`Failed to update module: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Update module error:', error);
      throw error;
    }
  }

  async getModulesByCourse(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order', { ascending: true });

      if (error) throw new Error(`Failed to fetch modules: ${error.message}`);

      // Resolve content for modules that have a file path
      const resolvedModules = await Promise.all((data || []).map(async (module: any) => {
        let content = module.content_markdown || '';

        // If content_markdown is a file path (ends with .md), fetch it from CDN
        if (content.endsWith('.md')) {
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('courses')
              .getPublicUrl(content);

            const response = await fetchWithRetry(publicUrl);
            if (response.ok) {
              content = await response.text();
            } else {
              console.error(`CDN returned HTTP ${response.status} for ${content}`);
              content = `## ⚠️ Content Unavailable\n\nThe module content could not be loaded (HTTP ${response.status}). Please try refreshing the page or contact support if the issue persists.`;
            }
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Unknown error';
            console.error(`Failed to fetch module content from CDN for ${module.id}:`, e);
            content = `## ⚠️ Connection Error\n\nFailed to load module content: ${errorMsg.includes('abort') ? 'Request timed out' : errorMsg}. Please check your internet connection and refresh the page.`;
          }
        }

        return normalizeModule({
          ...module,
          content: content
        });
      }));

      return resolvedModules;
    } catch (error) {
      console.error('Get modules error:', error);
      throw error;
    }
  }

  // Progress Tracking


  async getUserProgress(userId: string) {
    try {
      // For all courses, fetch from module_progress
      const { data, error } = await supabase
        .from('module_progress')
        .select('*')
        .eq('student_id', userId);

      if (error) throw new Error(`Failed to fetch user progress: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Get user progress error:', error);
      throw error;
    }
  }

  async getCourseProgress(courseId: string) {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      if (!token) return [];

      const response = await fetch(getApiUrl(`/api/student/progress/${courseId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch course progress from backend:', response.statusText);
        return [];
      }

      const progressData = await response.json();
      // Backend returns a map object where keys are moduleIds.
      // Convert to array format similar to getUserProgress for consistency
      return Object.entries(progressData).map(([moduleId, prog]: [string, any]) => ({
        module_id: moduleId,
        completed: prog.completed,
        quiz_score: prog.quizScore,
        completedTopics: prog.completedTopics || []
      }));
    } catch (error) {
      console.error('Get course progress error:', error);
      return [];
    }
  }

  async updateProgress(userId: string, moduleId: string, completed: boolean, quizScore?: number, courseId?: string, completedTopics?: string[]) {
    try {
      // Try to update via backend API first (handles both MongoDB and Supabase)
      // This ensures unified storage strategy
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      if (courseId && token) {
        try {
          const response = await fetch(getApiUrl(`/api/student/progress/${courseId}/${moduleId}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              completed,
              quizScore,
              completedTopics
            })
          });

          if (response.ok) {
            // Backend update succeeded (handles both MongoDB and Supabase)
            return;
          }
        } catch (apiError) {
          console.warn('Backend progress update failed, falling back to Supabase:', apiError);
          // Fall through to Supabase update
        }
      }
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleId);

      if (!isUUID) {
        // For non-UUID IDs (like MongoDB ObjectIDs), Supabase sync is skipped 
        // because the module_id column expects a UUID. 
        // Normal behavior as primary progress storage for these is MongoDB.
        return;
      }

      // Save progress to Supabase
      const updates: any = {
        student_id: userId,
        module_id: moduleId,
        completed,
        completed_at: new Date().toISOString()
      };

      if (quizScore !== undefined) {
        updates.quiz_score = quizScore;
      }

      const { error } = await supabase
        .from('module_progress')
        .upsert([updates]);

      if (error) {
        throw new Error(`Supabase progress update failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Update progress error:', error);
      // Don't throw, just log. This prevents UI from breaking if sync fails.
    }
  }

  // Enrollment Management
  async enrollInCourse(userId: string, courseId: string) {
    try {
      // Handle static VU courses - store in Supabase instead of localStorage
      if (courseId === 'vu-web-security') {
        // Check if already enrolled in Supabase
        const { data: existingData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('student_id', userId)
          .eq('course_id', courseId)
          .limit(1);

        const existing = existingData?.[0];

        if (existing) {
          return existing;
        }

        // Create enrollment in Supabase
        const { data: insertedData, error } = await supabase
          .from('enrollments')
          .insert([{ student_id: userId, course_id: courseId }])
          .select()
          .limit(1);

        const enrollment = insertedData?.[0];

        if (error) {
          console.error('Error enrolling in VU course:', error);
          // Fallback: return mock enrollment
          return { user_id: userId, course_id: courseId, enrolled_at: new Date().toISOString() };
        }

        return enrollment;
      }

      // Avoid double-enrollments
      const { data: existingData, error: existingErr } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .limit(1);

      const existing = existingData?.[0];

      if (existingErr) {
        console.warn('Error checking existing enrollment:', existingErr.message);
      }

      if (existing) return existing;

      const { data: insertedData, error: insertErr } = await supabase
        .from('enrollments')
        .insert([{ student_id: userId, course_id: courseId }])
        .select()
        .limit(1);

      return insertedData?.[0];
    } catch (error) {
      console.error('Enroll in course error:', error);
      throw error;
    }
  }

  async getUserEnrollments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *
          )
        `)
        .eq('student_id', userId)
        .order('enrolled_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch enrollments: ${error.message}`);

      // VU courses are now stored in Supabase, so they'll be included in the data above
      // No need to check localStorage anymore

      return data;
    } catch (error) {
      console.error('Get user enrollments error:', error);
      throw error;
    }
  }

  // File Upload
  async uploadFile(file: File, folder = 'courses') {
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
  // Assessment Submission
  async submitAssessment(moduleId: string, answers: Record<string, number>, proctoringSessionId?: string) {
    try {
      // Get the current session token from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/student/assessment/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          moduleId,
          answers,
          proctoringSessionId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Submission failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Submit assessment error:', error);
      throw error;
    }
  }
}

export const courseService = new CourseService();
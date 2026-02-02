import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getStudentDashboardSummary } from '../services/studentService.js';
import { markLabAsCompleted, getLabStats, isLabCompleted } from '../services/labService.js';
import trackingRoutes from './trackingRoutes.js';
import labSyncRoutes from './labSyncRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import supportRoutes from './supportRoutes.js';
import communityRoutes from './community.routes.js';
import { authenticateUser, AuthenticatedRequest } from '../../../shared/middleware/auth.js';
import { validateObjectId } from '../../../shared/middleware/validation.js';
import { Course } from '../../../shared/models/Course.js';
import { logger } from '../../../shared/lib/logger.js';
import { ProgressService } from '../../../shared/services/progressService.js';
import { cache, CacheKeys } from '../../../shared/lib/cache.js';
import VUStudent from '../../../shared/models/VUStudent.js';
import { sendEmail } from '../../../shared/lib/email.js';

const router = Router();

router.use('/track', trackingRoutes);
router.use('/labs', labSyncRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/support', supportRoutes);
router.use('/community', communityRoutes);

router.get('/overview', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user?.id;
  const studentEmail = req.user?.email;
  const supabaseClient = req.supabase;
  if (!studentId || !studentEmail || !supabaseClient) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Trigger Welcome Email logic using Supabase Profiles Table Tracking
  try {
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('welcome_email_sent, full_name')
      .eq('id', studentId)
      .limit(1);

    const profile = profiles?.[0];

    if (profileError) {
      logger.error(`Failed to fetch profile for ${studentEmail} from Supabase:`, profileError);
    } else if (profile && !profile.welcome_email_sent) {
      logger.info(`Welcome email not yet sent for ${studentEmail}. Attempting to send...`);

      const studentName = profile.full_name || studentEmail.split('@')[0] || 'Student';

      const welcomeSubject = 'Welcome to GradeU! 🛡️';
      const welcomeText = `
        Hello ${studentName},
        
        Welcome to GradeU! We're thrilled to have you on board.
        
        Your journey into academic excellence starts here. Explore your dashboard, dive into interactive labs, and master new skills at your own pace.
        
        Happy Learning!
        The GradeU Team
      `;
      const welcomeHtml = `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #6EDB80; text-transform: uppercase; letter-spacing: 2px;">Welcome to Grade<span style="color: #333;">U</span>! 🛡️</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>We're thrilled to have you on board! Your journey into excellence starts right now.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">🚀 <strong>What's Next?</strong></p>
            <ul style="margin-top: 10px;">
              <li>Explore your customized learning paths.</li>
              <li>Get hands-on with realistic labs.</li>
              <li>Track your progress and earn achievements.</li>
            </ul>
          </div>
          <p>Happy Learning!<br><strong>The GradeU Team</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #777;">If you have any questions, just reply to this email or use the support feature in the app.</p>
        </div>
      `;

      await sendEmail(studentEmail, welcomeSubject, welcomeText, welcomeHtml);

      // Update the profiles table in Supabase
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ welcome_email_sent: true })
        .eq('id', studentId);

      if (updateError) {
        logger.error(`Failed to update welcome_email_sent for ${studentEmail} in Supabase:`, updateError);
      } else {
        logger.info(`Welcome email sent and Supabase profile updated for ${studentEmail}`);
      }
    } else {
      logger.info(`Welcome email already sent or profile not found for ${studentEmail}`);
    }
  } catch (error) {
    logger.error('Error in welcome email trigger logic (Supabase Schema tracking)', error instanceof Error ? error : new Error(String(error)));
  }

  const summary = await getStudentDashboardSummary(studentId, studentEmail);
  res.json(summary);
});

// -- Courses --
router.get('/courses', async (_req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = CacheKeys.courseList();
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Fetch from database
    const courses = await Course.find({ published: true }).select('-teacherEmail');

    // Cache for 5 minutes
    cache.set(cacheKey, courses, 5 * 60 * 1000);

    res.json(courses);
  } catch (error) {
    logger.error('Error fetching courses', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/courses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Check cache first
    const cacheKey = CacheKeys.course(id);
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Fetch from database
    let course;
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id);
    } else {
      course = await Course.findOne({ code: id });
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Cache for 5 minutes
    cache.set(cacheKey, course, 5 * 60 * 1000);

    res.json(course);
  } catch (error) {
    logger.error('Error fetching course', error instanceof Error ? error : new Error(String(error)), { courseId: id });
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Lab endpoints - require authentication
router.post('/labs/:labId/complete', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { labId } = req.params;
    const studentId = req.user?.id;
    const authClient = req.supabase;

    if (!studentId || !authClient) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!labId || typeof labId !== 'string' || labId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid labId' });
    }

    const completion = await markLabAsCompleted(authClient, studentId, labId.trim());
    res.json({
      success: true,
      message: `Lab ${labId} marked as completed`,
      completion,
    });
  } catch (error) {
    logger.error('Error marking lab as completed', error instanceof Error ? error : new Error(String(error)), {
      labId: req.params.labId,
      studentId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to mark lab as completed' });
  }
});

router.get('/labs/stats', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const authClient = req.supabase;

    if (!studentId || !authClient) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await getLabStats(authClient, studentId);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching lab stats', error instanceof Error ? error : new Error(String(error)), {
      studentId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to fetch lab stats' });
  }
});

router.get('/labs/:labId/status', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { labId } = req.params;
    const studentId = req.user?.id;
    const authClient = req.supabase;

    if (!studentId || !authClient) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!labId || typeof labId !== 'string' || labId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid labId' });
    }

    const completed = await isLabCompleted(authClient, studentId, labId.trim());
    res.json({
      labId,
      completed,
      studentId,
    });
  } catch (error) {
    logger.error('Error fetching lab status', error instanceof Error ? error : new Error(String(error)), {
      labId: req.params.labId,
      studentId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to fetch lab status' });
  }
});

// -- Progress Endpoints --
router.get('/progress/:courseId/:moduleId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, moduleId } = req.params;
    const studentId = req.user?.id;
    const studentEmail = req.user?.email || '';

    if (!studentId || !studentEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check cache first (shorter TTL for progress data - 1 minute)
    const cacheKey = CacheKeys.moduleProgress(studentId, courseId, moduleId);
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const progress = await ProgressService.getModuleProgress(
      studentId,
      studentEmail,
      moduleId,
      courseId
    );

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    // Cache for 1 minute (progress changes frequently)
    cache.set(cacheKey, progress, 60 * 1000);

    res.json(progress);
  } catch (error) {
    logger.error('Error fetching module progress', error instanceof Error ? error : new Error(String(error)), {
      courseId: req.params.courseId,
      moduleId: req.params.moduleId,
      studentId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to fetch module progress' });
  }
});

router.get('/progress/:courseId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.id;
    const studentEmail = req.user?.email || '';

    if (!studentId || !studentEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const progressMap = await ProgressService.getCourseProgress(
      studentId,
      studentEmail,
      courseId
    );

    // Convert Map to object for JSON response
    const progressObject: Record<string, any> = {};
    progressMap.forEach((value, key) => {
      progressObject[key] = value;
    });

    res.json(progressObject);
  } catch (error) {
    logger.error('Error fetching course progress', error instanceof Error ? error : new Error(String(error)), {
      courseId: req.params.courseId,
      studentId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
});

router.put('/progress/:courseId/:moduleId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, moduleId } = req.params;
    const { completed, quizScore, completedTopics } = req.body;
    const studentId = req.user?.id;
    const studentEmail = req.user?.email || '';

    if (!studentId || !studentEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }

    await ProgressService.updateProgress(
      studentId,
      studentEmail,
      moduleId,
      courseId,
      completed,
      quizScore,
      completedTopics
    );

    // Invalidate cache for this progress entry
    const cacheKey = CacheKeys.moduleProgress(studentId, courseId, moduleId);
    cache.delete(cacheKey);

    // Also invalidate course progress cache
    const courseProgressKey = CacheKeys.courseProgress(studentId, courseId);
    cache.delete(courseProgressKey);

    res.json({ success: true, message: 'Progress updated successfully' });
  } catch (error) {
    logger.error('Error updating module progress', error instanceof Error ? error : new Error(String(error)), {
      courseId: req.params.courseId,
      moduleId: req.params.moduleId,
      studentId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to update module progress' });
  }
});

// Experience-based completion validation endpoint
router.get('/experience/:courseId/:moduleId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, moduleId } = req.params;
    const studentId = req.user?.id || '';

    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { StudentExperience } = await import('../models/StudentExperience.js');
    const experience = await StudentExperience.findOne({
      studentId,
      courseId
    });

    if (!experience) {
      return res.json({
        timeSpent: 0,
        scrollDepth: 0,
        canComplete: false,
        reason: 'No experience data found'
      });
    }

    const moduleStat = experience.moduleStats.find((stat: any) => stat.moduleId === moduleId);

    if (!moduleStat) {
      return res.json({
        timeSpent: 0,
        scrollDepth: 0,
        canComplete: false,
        reason: 'Module not accessed yet'
      });
    }

    const MIN_TIME_SPENT = 60; // Minimum 60 seconds (1 minute)
    const MIN_SCROLL_DEPTH = 50; // Minimum 50% scroll depth

    const timeSpent = moduleStat.timeSpent || 0;
    const scrollDepth = moduleStat.scrollDepth || 0;
    const canComplete = timeSpent >= MIN_TIME_SPENT && scrollDepth >= MIN_SCROLL_DEPTH;

    res.json({
      timeSpent,
      scrollDepth,
      canComplete,
      minTimeSpent: MIN_TIME_SPENT,
      minScrollDepth: MIN_SCROLL_DEPTH,
      reason: canComplete ? 'Engagement requirements met' :
        timeSpent < MIN_TIME_SPENT ? `Minimum ${MIN_TIME_SPENT} seconds required (spent ${Math.round(timeSpent)}s)` :
          `Minimum ${MIN_SCROLL_DEPTH}% scroll depth required (reached ${Math.round(scrollDepth)}%)`
    });
  } catch (error) {
    logger.error('Error fetching experience data', error instanceof Error ? error : new Error(String(error)), {
      courseId: req.params.courseId,
      moduleId: req.params.moduleId,
      studentId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to fetch experience data' });
  }
});

export default router;

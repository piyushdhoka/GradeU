import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client for storage operations that bypass RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TopicInput = {
  title?: unknown;
  name?: unknown;
  content?: unknown;
  path?: unknown;
};

const COURSE_RESPONSE_CACHE_CONTROL = 'public, max-age=0, s-maxage=120, must-revalidate';

function buildEtag(payload: unknown): string {
  const hash = createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  return `"${hash}"`;
}

function buildCacheHeaders(etag: string): HeadersInit {
  return {
    'Cache-Control': COURSE_RESPONSE_CACHE_CONTROL,
    ETag: etag,
  };
}

function isStoragePath(content: string): boolean {
  return content.includes('/') && !content.includes('\n') && !content.includes('#');
}

function asNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function topicTitleFromPath(path: string): string {
  const file = path.split('/').pop() || '';
  const withoutExt = file.replace(/\.md$/i, '');
  const decoded = decodeURIComponent(withoutExt);
  const title = decoded.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return title || 'Topic';
}

async function readMarkdownFromBucket(path: string): Promise<string> {
  const cleanPath = path.trim().replace(/^\/+/, '');
  if (!cleanPath) return '';

  const { data, error } = await supabaseAdmin.storage.from('courses').download(cleanPath);

  if (error || !data) {
    console.error(`[courses/[id]] Failed to download markdown: ${cleanPath}`, error);
    return '';
  }

  try {
    return await data.text();
  } catch (textError) {
    console.error(`[courses/[id]] Failed to decode markdown: ${cleanPath}`, textError);
    return '';
  }
}

async function resolveModuleContent(contentMarkdown: string): Promise<string> {
  const content = asNonEmptyString(contentMarkdown);
  if (!content) return '';

  if (!isStoragePath(content) && !content.toLowerCase().endsWith('.md')) {
    // Already inline markdown.
    return content;
  }

  if (content.toLowerCase().endsWith('.md')) {
    return await readMarkdownFromBucket(content);
  }

  const folderPath = content.endsWith('/') ? content.slice(0, -1) : content;
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from('courses')
    .list(folderPath);

  if (listError) {
    console.error(`[courses/[id]] Error listing folder ${folderPath}:`, listError);
    return '';
  }

  const mdFiles = (files || [])
    .filter((f) => f.name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (mdFiles.length === 0) return '';

  const contents = await Promise.all(
    mdFiles.map(async (file) => readMarkdownFromBucket(`${folderPath}/${file.name}`))
  );

  return contents.filter(Boolean).join('\n\n---\n\n');
}

async function resolveTopics(rawTopics: unknown): Promise<{ title: string; content: string }[]> {
  if (!Array.isArray(rawTopics)) return [];

  const resolved = await Promise.all(
    rawTopics.map(async (topic: unknown) => {
      if (typeof topic === 'string') {
        const title = topic.trim();
        return title ? { title, content: '' } : null;
      }

      if (!topic || typeof topic !== 'object') return null;

      const t = topic as TopicInput;
      const titleCandidate = asNonEmptyString(t.title) || asNonEmptyString(t.name);
      const embeddedContent = asNonEmptyString(t.content);
      const path = asNonEmptyString(t.path);

      let content = embeddedContent;
      if (!content && path) {
        content = await readMarkdownFromBucket(path);
      }

      if (!titleCandidate && !content && !path) return null;

      return {
        title: titleCandidate || (path ? topicTitleFromPath(path) : 'Topic'),
        content: content || '',
      };
    })
  );

  return resolved.filter((t): t is { title: string; content: string } => !!t);
}

// GET a specific course by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log(`[courses/[id]] Fetching course: ${id}`);

    // 1) Fetch course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(
        'id, title, description, is_published, certificate_enabled, created_at, category, estimated_hours'
      )
      .eq('id', id)
      .single();

    if (courseError) {
      console.error('[courses/[id]] Course query error:', courseError);
      if (courseError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch course', details: courseError.message },
        { status: 500 }
      );
    }

    // 2) Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, content_markdown, module_order, topics, type')
      .eq('course_id', id)
      .order('module_order', { ascending: true });

    if (modulesError) {
      console.error('[courses/[id]] Modules query error:', modulesError);
      return NextResponse.json(
        { error: 'Failed to fetch modules', details: modulesError.message },
        { status: 500 }
      );
    }

    // 3) Resolve module markdown + topics
    const resolvedModules = await Promise.all(
      (modules || []).map(async (module) => {
        const content = await resolveModuleContent(module.content_markdown || '');
        const topics = await resolveTopics(module.topics);

        return {
          ...module,
          content_markdown: content,
          topics,
        };
      })
    );

    // 4) Fetch quizzes for all modules
    const moduleIds = resolvedModules.map((m) => m.id);
    let quizzes: any[] = [];

    if (moduleIds.length > 0) {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id, module_id, question, options, correct_option')
        .in('module_id', moduleIds);

      if (quizError) {
        console.error('[courses/[id]] Quizzes query error:', quizError);
      } else {
        quizzes = quizData || [];
      }
    }

    // 5) Normalize response
    const normalizedModules = resolvedModules.map((m) => {
      const normalizedTopics = Array.isArray(m.topics)
        ? m.topics.filter((t) => asNonEmptyString(t.title) || asNonEmptyString(t.content))
        : [];

      return {
        id: m.id,
        title: m.title,
        content: m.content_markdown || '',
        topics: normalizedTopics,
        type: m.type || 'lecture',
        order: m.module_order,
        quiz: quizzes
          .filter((q) => q.module_id === m.id)
          .map((quiz) => ({
            id: quiz.id,
            question: quiz.question,
            options: quiz.options,
            correctAnswer: quiz.correct_option,
          })),
      };
    });

    const response = {
      id: course.id,
      title: course.title,
      description: course.description,
      certificate_enabled: course.certificate_enabled,
      category: course.category,
      estimated_hours: course.estimated_hours,
      module_count: normalizedModules.length,
      modules: normalizedModules,
      createdAt: course.created_at,
    };

    const etag = buildEtag(response);
    const headers = buildCacheHeaders(etag);
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    return NextResponse.json(response, { headers });
  } catch (error: any) {
    console.error('[courses/[id]] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

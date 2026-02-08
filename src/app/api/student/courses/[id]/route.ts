import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { slugify } from '@shared/utils/slug';

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

function normalizeMarkdownName(value: string): string {
  return decodeURIComponent(value)
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function markdownTokens(value: string): Set<string> {
  return new Set(
    decodeURIComponent(value)
      .replace(/\.md$/i, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length > 2)
  );
}

function splitStoragePath(cleanPath: string): { folderPath: string; fileName: string } {
  const slashIndex = cleanPath.lastIndexOf('/');
  if (slashIndex < 0) return { folderPath: '', fileName: cleanPath };

  return {
    folderPath: cleanPath.slice(0, slashIndex),
    fileName: cleanPath.slice(slashIndex + 1),
  };
}

async function resolveFallbackMarkdownPath(cleanPath: string): Promise<string | null> {
  if (!cleanPath.toLowerCase().endsWith('.md')) return null;

  const { folderPath, fileName } = splitStoragePath(cleanPath);
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from('courses')
    .list(folderPath);

  if (listError || !files?.length) {
    return null;
  }

  const mdFiles = files.filter((file) => file.name.toLowerCase().endsWith('.md'));
  if (!mdFiles.length) return null;

  const requestedNameLower = fileName.toLowerCase();
  const exactCaseInsensitive = mdFiles.find(
    (file) => file.name.toLowerCase() === requestedNameLower
  );
  if (exactCaseInsensitive) {
    return folderPath ? `${folderPath}/${exactCaseInsensitive.name}` : exactCaseInsensitive.name;
  }

  const normalizedRequested = normalizeMarkdownName(fileName);
  const normalizedMatch = mdFiles.find(
    (file) => normalizeMarkdownName(file.name) === normalizedRequested
  );
  if (normalizedMatch) {
    return folderPath ? `${folderPath}/${normalizedMatch.name}` : normalizedMatch.name;
  }

  const fuzzyMatch = mdFiles.find((file) => {
    const normalized = normalizeMarkdownName(file.name);
    return normalized.includes(normalizedRequested) || normalizedRequested.includes(normalized);
  });
  if (fuzzyMatch) {
    return folderPath ? `${folderPath}/${fuzzyMatch.name}` : fuzzyMatch.name;
  }

  const requestedTokens = markdownTokens(fileName);
  let bestByToken: { name: string; score: number } | null = null;
  for (const file of mdFiles) {
    const fileTokens = markdownTokens(file.name);
    let overlap = 0;
    for (const token of fileTokens) {
      if (requestedTokens.has(token)) overlap += 1;
    }
    if (overlap > 0 && (!bestByToken || overlap > bestByToken.score)) {
      bestByToken = { name: file.name, score: overlap };
    }
  }

  return bestByToken ? (folderPath ? `${folderPath}/${bestByToken.name}` : bestByToken.name) : null;
}

async function readMarkdownFromBucket(path: string): Promise<string> {
  const cleanPath = path.trim().replace(/^\/+/, '');
  if (!cleanPath) return '';

  const { data, error } = await supabaseAdmin.storage.from('courses').download(cleanPath);

  if (error || !data) {
    const fallbackPath = await resolveFallbackMarkdownPath(cleanPath);
    if (fallbackPath && fallbackPath !== cleanPath) {
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin.storage
        .from('courses')
        .download(fallbackPath);

      if (!fallbackError && fallbackData) {
        try {
          console.warn(
            `[courses/[id]] Using fallback markdown path "${fallbackPath}" for requested "${cleanPath}"`
          );
          return await fallbackData.text();
        } catch (fallbackTextError) {
          console.warn(
            `[courses/[id]] Failed to decode fallback markdown "${fallbackPath}":`,
            fallbackTextError
          );
        }
      }
    }

    console.warn(
      `[courses/[id]] Failed to download markdown "${cleanPath}": ${error?.message || 'Unknown storage error'}`
    );
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

const COURSE_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

function getCachedCourse(idOrSlug: string) {
  const entry = COURSE_CACHE.get(idOrSlug);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCachedCourse(idOrSlug: string, data: any) {
  COURSE_CACHE.set(idOrSlug, { data, timestamp: Date.now() });
}

// GET a specific course by ID or slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isLazy = searchParams.get('lazy') === 'true';

    console.log(`[courses/[id]] Fetching course: ${id} (lazy=${isLazy})`);

    // 1) Check Cache first (only if not lazy or we want to serve structure from cache)
    const cached = getCachedCourse(id);
    if (cached) {
      console.log(`[courses/[id]] Serving from cache: ${id}`);
      // If lazy, we return the cached structure but without contents
      if (isLazy) {
        return NextResponse.json({
          ...cached,
          modules: cached.modules.map((m: any) => ({ ...m, content: '', topics: [] })),
        });
      }
      return NextResponse.json(cached);
    }

    // Detect if id is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const column = isUUID ? 'id' : 'slug';

    // 2) Fetch course by ID or slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(
        'id, slug, title, description, is_published, certificate_enabled, created_at, category, estimated_hours'
      )
      .eq(column, id)
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

    // 3) Fetch modules using the course's actual UUID
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, content_markdown, module_order, topics, type')
      .eq('course_id', course.id)
      .order('module_order', { ascending: true });

    if (modulesError) {
      console.error('[courses/[id]] Modules query error:', modulesError);
      return NextResponse.json(
        { error: 'Failed to fetch modules', details: modulesError.message },
        { status: 500 }
      );
    }

    // 4) Fetch quizzes for all modules
    const moduleIds = (modules || []).map((m) => m.id);
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

    // 5) Resolve module contents (ONLY if not lazy)
    const normalizedModules = await Promise.all(
      (modules || []).map(async (m) => {
        let content = '';
        let topics: any[] = [];

        if (!isLazy) {
          content = await resolveModuleContent(m.content_markdown || '');
          topics = await resolveTopics(m.topics);
        }

        return {
          id: m.id,
          title: m.title,
          content: content,
          topics: topics,
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
      })
    );

    const response = {
      id: course.id,
      slug: course.slug || slugify(course.title),
      title: course.title,
      description: course.description,
      certificate_enabled: course.certificate_enabled,
      category: course.category,
      estimated_hours: course.estimated_hours,
      module_count: normalizedModules.length,
      modules: normalizedModules,
      createdAt: course.created_at,
    };

    // 6) Cache the FULL result if it wasn't a lazy request
    if (!isLazy) {
      setCachedCourse(course.id, response);
      if (course.slug) setCachedCourse(course.slug, response);
    }

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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Normalization helpers (copied from main course route for consistency)
 */
function isStoragePath(content: string): boolean {
  return content.includes('/') && !content.includes('\n') && !content.includes('#');
}

function asNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function readMarkdownFromBucket(path: string): Promise<string> {
  const cleanPath = path.trim().replace(/^\/+/, '');
  if (!cleanPath) return '';

  const { data, error } = await supabaseAdmin.storage.from('courses').download(cleanPath);
  if (error || !data) return '';
  try {
    return await data.text();
  } catch (e) {
    return '';
  }
}

async function resolveModuleContent(contentMarkdown: string): Promise<string> {
  const content = asNonEmptyString(contentMarkdown);
  if (!content) return '';

  if (!isStoragePath(content) && !content.toLowerCase().endsWith('.md')) {
    return content;
  }

  if (content.toLowerCase().endsWith('.md')) {
    return await readMarkdownFromBucket(content);
  }

  const folderPath = content.endsWith('/') ? content.slice(0, -1) : content;
  const { data: files } = await supabaseAdmin.storage.from('courses').list(folderPath);

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
    rawTopics.map(async (topic: any) => {
      const titleCandidate = asNonEmptyString(topic.title) || asNonEmptyString(topic.name);
      const embeddedContent = asNonEmptyString(topic.content);
      const path = asNonEmptyString(topic.path);

      let content = embeddedContent;
      if (!content && path) {
        content = await readMarkdownFromBucket(path);
      }

      return {
        title: titleCandidate || 'Topic',
        content: content || '',
      };
    })
  );

  return resolved.filter((t) => !!t.title);
}

// GET module content by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { moduleId } = await params;

    // 1) Fetch module structure from DB
    const { data: module, error: moduleError } = await supabaseAdmin
      .from('modules')
      .select('id, title, content_markdown, topics, type')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // 2) Resolve Content & Topics from Storage
    const content = await resolveModuleContent(module.content_markdown || '');
    const topics = await resolveTopics(module.topics);

    return NextResponse.json({
      id: module.id,
      title: module.title,
      type: module.type,
      content,
      topics,
    });
  } catch (error: any) {
    console.error('[modules/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ImageKit Video Service - Fetches videos from ImageKit folder
// Just upload videos to your ImageKit folder and they'll appear in the UI

export interface ImageKitVideo {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  thumbnail: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  uploadDate: string;
  videoUrl: string;
  fileSize: number;
}

interface ImageKitFile {
  fileId: string;
  name: string;
  filePath: string;
  url: string;
  fileType: string;
  height?: number;
  width?: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  customMetadata?: {
    title?: string;
    description?: string;
    instructor?: string;
    category?: string;
    difficulty?: string;
    duration?: string;
  };
  tags?: string[];
}

// Extract video info from filename
// Format: CategoryName_DifficultyLevel_VideoTitle.mp4
// Example: OWASP_beginner_Introduction-to-SQL-Injection.mp4
function parseVideoFilename(filename: string): { title: string; category: string; difficulty: 'beginner' | 'intermediate' | 'advanced' } {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const parts = nameWithoutExt.split('_');

  if (parts.length >= 3) {
    const category = parts[0].replace(/-/g, ' ');
    const difficulty = (parts[1].toLowerCase() as 'beginner' | 'intermediate' | 'advanced') || 'beginner';
    const title = parts.slice(2).join(' ').replace(/-/g, ' ');
    return { title, category, difficulty };
  }

  // Fallback: use filename as title
  return {
    title: nameWithoutExt.replace(/-/g, ' ').replace(/_/g, ' '),
    category: 'General',
    difficulty: 'beginner'
  };
}

// Fetch videos from ImageKit via backend proxy (works both locally and on Vercel)
export async function fetchVideosFromImageKit(folderPath: string = '/gradeu'): Promise<ImageKitVideo[]> {
  try {
    const response = await fetch(`/api/imagekit/videos?folder=${encodeURIComponent(folderPath)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`);
    }

    const files: ImageKitFile[] = await response.json();

    // Filter only video files
    const videoFiles = files.filter(file =>
      file.fileType === 'video' ||
      file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)
    );

    return videoFiles.map((file) => {
      const parsed = parseVideoFilename(file.name);
      const customMeta = file.customMetadata || {};

      return {
        id: file.fileId,
        title: customMeta.title || parsed.title,
        description: customMeta.description || `Learn about ${parsed.title} in this GradeU training video.`,
        instructor: customMeta.instructor || 'GradeU Academy',
        duration: customMeta.duration || 'N/A',
        thumbnail: `${file.url}/tr:w-640,h-360,fo-auto`, // ImageKit thumbnail transformation
        category: customMeta.category || parsed.category,
        difficulty: (customMeta.difficulty as 'beginner' | 'intermediate' | 'advanced') || parsed.difficulty,
        views: Math.floor(Math.random() * 10000) + 500, // Placeholder - you can track this in DB
        uploadDate: file.createdAt.split('T')[0],
        videoUrl: file.url,
        fileSize: file.size
      };
    });
  } catch (error) {
    console.error('Error fetching videos from ImageKit:', error);
    return [];
  }
}

// Get video URL with optional transformations
export function getVideoUrl(fileUrl: string, options?: {
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm';
}): string {
  if (!options) return fileUrl;

  const transforms: string[] = [];

  if (options.quality) {
    const qualityMap = { low: 50, medium: 70, high: 90, auto: 80 };
    transforms.push(`q-${qualityMap[options.quality]}`);
  }

  if (options.format) {
    transforms.push(`f-${options.format}`);
  }

  if (transforms.length === 0) return fileUrl;

  return `${fileUrl}/tr:${transforms.join(',')}`;
}

// Get thumbnail with transformations
export function getThumbnailUrl(videoUrl: string, width: number = 640, height: number = 360): string {
  return `${videoUrl}/tr:w-${width},h-${height},fo-auto`;
}

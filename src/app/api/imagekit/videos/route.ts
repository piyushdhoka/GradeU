import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '/gradeu';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      return NextResponse.json({ error: 'ImageKit not configured' }, { status: 503 });
    }

    // Use ImageKit REST API directly
    const response = await fetch('https://api.imagekit.io/v1/files', {
      headers: {
        Authorization: `Basic ${Buffer.from(privateKey + ':').toString('base64')}`,
      },
      // @ts-ignore - Next.js fetch supports this
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`ImageKit API error: ${response.status}`);
    }

    const files = await response.json();

    // Filter for video files in the specified folder
    const videos = files.filter(
      (file: any) =>
        file.filePath?.startsWith(folder) &&
        (file.fileType === 'video' || file.name?.match(/\.(mp4|webm|mov|avi|mkv)$/i))
    );

    return NextResponse.json(videos);
  } catch (error) {
    console.error('ImageKit videos API error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

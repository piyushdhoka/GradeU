import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ProctoringLog } from '@/lib/models/ProctoringLog';

const normalizeEventType = (value: unknown): string => {
  if (typeof value !== 'string') return 'unknown_event';
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return normalized || 'unknown_event';
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, courseId, attemptId, eventType, details, timestamp } = body ?? {};

    const sid = typeof studentId === 'string' ? studentId.trim().slice(0, 200) : '';
    if (!sid) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    const cid =
      typeof courseId === 'string' && courseId.trim()
        ? courseId.trim().slice(0, 200)
        : 'unknown-course';
    const aid =
      typeof attemptId === 'string' && attemptId.trim()
        ? attemptId.trim().slice(0, 200)
        : 'unknown-attempt';

    const safeDetails =
      details && typeof details === 'object' ? JSON.parse(JSON.stringify(details)) : {};

    await connectDB();

    await ProctoringLog.create({
      studentId: sid,
      courseId: cid,
      attemptId: aid,
      eventType: normalizeEventType(eventType),
      details: safeDetails,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    console.error('Proctoring ingestion error:', error);
    return NextResponse.json({ error: 'Failed to ingest log' }, { status: 500 });
  }
}

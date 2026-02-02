import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ProctoringLog } from '@/lib/models/ProctoringLog';

// Proctoring log ingestion - store in MongoDB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, courseId, attemptId, eventType, details } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    await connectDB();

    // Sanitize inputs
    const sanitizedDetails = details && typeof details === 'object'
      ? JSON.parse(JSON.stringify(details))
      : {};

    const log = new ProctoringLog({
      studentId: String(studentId).trim().substring(0, 200),
      courseId: String(courseId).trim().substring(0, 200),
      attemptId: String(attemptId).trim().substring(0, 200),
      eventType,
      details: sanitizedDetails,
      timestamp: new Date()
    });

    await log.save();

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    console.error('Proctoring ingestion error:', error);
    return NextResponse.json({ error: 'Failed to ingest log' }, { status: 500 });
  }
}

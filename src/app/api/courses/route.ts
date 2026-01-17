import { NextResponse } from 'next/server';

export async function GET() {
    // Mock list of courses
    const courses = [
        { id: '1', title: 'Intro to Python', description: 'Basics of Python programming' },
        { id: '2', title: 'Advanced React', description: 'Deep dive into React hooks and patterns' },
    ];

    return NextResponse.json({ success: true, data: courses });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Mock course creation
        const newCourse = {
            id: Date.now().toString(),
            ...body,
            createdAt: new Date().toISOString()
        };

        return NextResponse.json({ success: true, data: newCourse });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to create course' },
            { status: 500 }
        );
    }
}

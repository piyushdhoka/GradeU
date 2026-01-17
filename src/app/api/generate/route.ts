import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt, modules } = await req.json();

        // Mock AI Generation delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simple mock response logic
        const generatedContent = `
# Course Generated for: ${prompt}

## Introduction
This is a generated introduction based on the prompt.

## Content
Here is some content for the modules provided.
`;

        return NextResponse.json({
            success: true,
            data: generatedContent
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to generate course' },
            { status: 500 }
        );
    }
}

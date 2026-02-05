import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.GROQ_API) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert AI Tutor for the "GradeU" educational platform.
Your goal is to help students understand the course material they are currently viewing.
You are helpful, encouraging, and concise.
You have access to the following context about what the student is looking at:

Course: ${context.courseTitle}
Module: ${context.moduleTitle}
Current Content/Topic: ${context.topicContent || context.moduleDescription || 'No specific topic content available.'}

Instructions:
1. Answer the student's questions based on the provided context.
2. If the question is unrelated to the course, gently steer them back to the topic.
3. Keep answers short and easy to read (use markdown).
4. Do not make up information if it's not in the context or general knowledge about the subject.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch response from AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI Tutor API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

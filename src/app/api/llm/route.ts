import { NextRequest, NextResponse } from 'next/server';
import { getStaffUser } from '@/lib/auth';

// Server-side only API keys (not exposed to client)
const GEMINI_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

const GROQ_KEYS = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

async function callGemini(prompt: string, retryCount = 0): Promise<string> {
    if (GEMINI_KEYS.length === 0) {
        throw new Error('No Gemini API keys configured on server');
    }

    const apiKey = GEMINI_KEYS[currentKeyIndex % GEMINI_KEYS.length];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                topP: 0.95,
                topK: 40
            }
        })
    });

    if (response.status === 429 && retryCount < GEMINI_KEYS.length) {
        console.warn(`[LLM API] Rate limit hit for key ${currentKeyIndex}. Rotating...`);
        currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
        return callGemini(prompt, retryCount + 1);
    }

    if (response.status === 503 && retryCount < 5) {
        console.warn(`[LLM API] Model overloaded (503). Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callGemini(prompt, retryCount + 1);
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(prompt: string): Promise<string> {
    if (GROQ_KEYS.length === 0) {
        throw new Error('No Groq API keys configured on server');
    }

    const apiKey = GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)];
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            // llama3-70b-8192 was retired by Groq; gpt-oss is a reasoning model, keep reasoning low
            model: 'openai/gpt-oss-120b',
            reasoning_effort: 'low',
            temperature: 0.7,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
    // Spends our Gemini/Groq quota, so only signed-in teachers/admins may call it
    if (!(await getStaffUser())) {
        return NextResponse.json({ error: 'Teacher access required' }, { status: 401 });
    }

    try {
        const { prompt, provider } = await request.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid prompt' }, { status: 400 });
        }

        let result: string;

        if (provider === 'groq' && GROQ_KEYS.length > 0) {
            result = await callGroq(prompt);
        } else if (GEMINI_KEYS.length > 0) {
            result = await callGemini(prompt);
        } else {
            return NextResponse.json({ error: 'No API keys configured on server' }, { status: 500 });
        }

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('[LLM API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

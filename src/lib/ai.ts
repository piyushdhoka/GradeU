export async function callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing Gemini API Key');

    // Using gemini-2.0-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

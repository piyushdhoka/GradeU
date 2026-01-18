const GEMINI_KEYS = [
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

export async function callGeminiAPI(prompt: string, retryCount = 0): Promise<string> {
    if (GEMINI_KEYS.length === 0) throw new Error('No Gemini API keys found');

    const apiKey = GEMINI_KEYS[currentKeyIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
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
            console.warn(`[!] Rate limit hit for key ${currentKeyIndex}. Rotating...`);
            currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
            return callGeminiAPI(prompt, retryCount + 1);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        if (retryCount < GEMINI_KEYS.length) {
            console.warn(`[!] Request failed with key ${currentKeyIndex}. Rotating...`);
            currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
            return callGeminiAPI(prompt, retryCount + 1);
        }
        throw error;
    }
}

export async function generateGeminiEmbedding(text: string, retryCount = 0): Promise<number[]> {
    if (GEMINI_KEYS.length === 0) throw new Error('No Gemini API keys found');

    const apiKey = GEMINI_KEYS[currentKeyIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text }] }
            })
        });

        if (response.status === 429 && retryCount < GEMINI_KEYS.length) {
            console.warn(`[!] Rate limit hit for embedding (key ${currentKeyIndex}). Rotating...`);
            currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
            return generateGeminiEmbedding(text, retryCount + 1);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini Embedding Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.embedding.values;
    } catch (error) {
        if (retryCount < GEMINI_KEYS.length) {
            console.warn(`[!] Embedding failed with key ${currentKeyIndex}. Rotating...`);
            currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
            return generateGeminiEmbedding(text, retryCount + 1);
        }
        throw error;
    }
}

import { debug } from '@/lib/debug';

/**
 * AI Code Analysis Service
 * Uses Google Gemini (via Backend Proxy) to provide feedback on candidate code submissions.
 */
export async function analyzeCode(
    question: string,
    code: string,
    language: string
): Promise<string> {
    try {
        debug.log('🚀 Sending code to Gemini...');
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/interviews/analyze-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                code,
                language
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.feedback;

    } catch (error: any) {
        debug.error('❌ Gemini API Error:', error);
        return "Code analysis temporarily unavailable.";
    }
}

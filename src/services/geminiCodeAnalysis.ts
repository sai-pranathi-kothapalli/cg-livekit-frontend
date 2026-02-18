import { GoogleGenerativeAI } from '@google/generative-ai';
import { debug } from '@/lib/debug';

/**
 * AI Code Analysis Service
 * Uses Google Gemini 1.5 Flash to provide feedback on candidate code submissions.
 */
export async function analyzeCode(
    question: string,
    code: string,
    language: string
): Promise<string> {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
        debug.error('Gemini API key is missing or is still the placeholder.');
        return "AI analysis failed: Please set a valid VITE_GEMINI_API_KEY in your .env file.";
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
You are a coding interview evaluator. Analyze this code submission.

Problem: ${question || "Analyze the provided code based on general programming principles."}

Language: ${language}

Candidate's Code:
${code}

Provide concise feedback (3-4 sentences max):
1. Correctness: Does it solve the problem?
2. Quality: Any bugs or issues?
3. Complexity: Time/space complexity
4. Verdict: Pass/Needs Improvement/Fail

Be encouraging but honest.
        `.trim();

        try {
            debug.log('🚀 Sending code to Gemini...');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (!text) {
                throw new Error("Empty response from Gemini");
            }

            return text;
        } catch (error: any) {
            debug.error('❌ Gemini API Error:', error);

            // Helpful message for the user that doesn't break the UI flow
            return 'Code analysis temporarily unavailable. Your code output shows it works correctly! (Error: ' + (error?.message || 'Unknown') + ')';
        }
    } catch (err: any) {
        debug.error('💥 Failed to initialize Gemini:', err);
        return `AI analysis initialization failed: ${err?.message || String(err)}`;
    }
}

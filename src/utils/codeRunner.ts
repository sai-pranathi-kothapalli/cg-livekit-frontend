import { debug } from '@/lib/debug';
import { API_BASE_URL } from '@/lib/api/client';

/**
 * Code Execution Utility
 * 
 * Uses OneCompiler API via backend proxy to execute code in multiple languages:
 * Python, Java, C, C++, SQL, and more.
 */
export async function runCode(code: string, language: string): Promise<{
    output: string;
    error?: string;
    executionTime: number;
}> {
    const startTime = performance.now();
    let output = "";
    let error: string | undefined;

    try {
        debug.log(`🏃 Executing ${language} code via compiler API...`);
        
        const response = await fetch(`${API_BASE_URL}/api/compiler/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: language,
                code: code,
                stdin: ''
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Combine stdout and stderr
        if (result.stderr && result.stderr.trim()) {
            error = result.stderr;
            output = result.stdout || '';
        } else {
            output = result.stdout || '';
        }

        debug.log(`✅ Code execution completed: ${output.length} chars output`);
        
    } catch (err: any) {
        debug.error('❌ Code execution failed:', err);
        error = err.message || String(err);
    }

    const endTime = performance.now();
    return {
        output,
        error,
        executionTime: Math.round(endTime - startTime),
    };
}

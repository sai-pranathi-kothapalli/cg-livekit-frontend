import { debug } from '@/lib/debug';

// We'll load Pyodide from CDN or the package if possible, but let's try to handle it gracefully
let pyodide: any = null;

async function loadPyodideInstance() {
    if (pyodide) return pyodide;

    debug.log('🐍 Loading Pyodide...');
    try {
        // @ts-ignore
        if (typeof window.loadPyodide === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
            document.head.appendChild(script);
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }

        // @ts-ignore
        pyodide = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        debug.log('✅ Pyodide loaded successfully');
        return pyodide;
    } catch (err) {
        debug.error('❌ Failed to load Pyodide:', err);
        throw err;
    }
}

/**
 * Code Execution Utility
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
        if (language === 'javascript') {
            output = await runJavaScript(code);
        } else if (language === 'python') {
            output = await runPython(code);
        } else {
            error = `Execution for ${language} is not supported in the browser yet.`;
        }
    } catch (err: any) {
        error = err.message || String(err);
    }

    const endTime = performance.now();
    return {
        output,
        error,
        executionTime: Math.round(endTime - startTime),
    };
}

async function runJavaScript(code: string): Promise<string> {
    let logs: string[] = [];
    const originalLog = console.log;

    // Capture console.log
    console.log = (...args) => {
        logs.push(args.map(a =>
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        ).join(' '));
        originalLog(...args);
    };

    try {
        // Use a timeout to prevent infinite loops (rough approximation for eval)
        const result = await Promise.race([
            eval(code),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Execution timeout (5s)")), 5000)
            )
        ]);

        if (result !== undefined && logs.length === 0) {
            return String(result);
        }
    } finally {
        console.log = originalLog;
    }

    return logs.join('\n');
}

async function runPython(code: string): Promise<string> {
    const instance = await loadPyodideInstance();

    // Redirect stdout to a variable
    instance.runPython(`
import sys
import io
sys.stdout = io.StringIO()
    `);

    try {
        // Run the code
        await Promise.race([
            instance.runPythonAsync(code),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Execution timeout (5s)")), 5000)
            )
        ]);

        // Capture stdout
        const stdout = instance.runPython("sys.stdout.getvalue()");
        return stdout;
    } catch (err: any) {
        throw new Error(err.message || String(err));
    }
}

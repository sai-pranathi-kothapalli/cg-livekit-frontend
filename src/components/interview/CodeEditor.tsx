import { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, Send, ChevronDown, Terminal, Code2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/livekit/button';
import type { Room } from 'livekit-client';
import { debug } from '@/lib/debug';

interface CodeEditorProps {
    language: string;
    initialCode: string;
    isSubmitted?: boolean;
    initialOutput?: { text: string; isError: boolean } | null;
    question: string;
    onCodeSubmit: (code: string, output?: string) => void;
    onRunCode: (code: string, language: string) => Promise<{ output: string; error?: string }>;
    onCodeChange?: (code: string) => void;
    onOutputChange?: (output: { text: string; isError: boolean } | null) => void;
    room?: Room;
}

const LANGUAGES = [
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C', value: 'c' },
    { label: 'C++', value: 'cpp' },
    { label: 'SQL', value: 'sql' },
];

export function CodeEditor({
    language: initialLanguage = 'python',
    initialCode = '',
    question,
    isSubmitted = false,
    initialOutput = null,
    onCodeSubmit,
    onRunCode,
    onCodeChange,
    onOutputChange,
    room
}: CodeEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [language, setLanguage] = useState(initialLanguage);
    const [output, setOutput] = useState<{ text: string; isError: boolean } | null>(initialOutput);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [observationCount, setObservationCount] = useState(0);
    const [startTime] = useState(Date.now());
    const [submitted, setSubmitted] = useState(isSubmitted);
    const editorRef = useRef<any>(null);

    // Debounce and observation state
    const lastObservationTimeRef = useRef<number>(0);
    const observationTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;

        // Properly disable Copy, Paste, and Cut within the Monaco instance
        editor.onKeyDown((e: any) => {
            const { ctrlKey, metaKey } = e;
            const isModifier = ctrlKey || metaKey;

            // KeyCodes: C=33, V=52, X=54 (in Monaco's internal representation)
            // But it's safer to use the standard browser key codes if possible, 
            // or better yet, Monaco's built-in constants if available.
            // Standard: C=67, V=86, X=88
            if (isModifier && (e.browserEvent.keyCode === 67 || e.browserEvent.keyCode === 86 || e.browserEvent.keyCode === 88)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        editor.focus();
    };

    const sendCodeObservation = useCallback(async (currentCode: string) => {
        const now = Date.now();
        const lines = currentCode.trim().split('\n').length;

        // Strict Limits
        if (!room?.localParticipant || submitted) return;
        if (observationCount >= 3) return;
        if (lines < 3) return;
        if (now - lastObservationTimeRef.current < 30000) return;

        try {
            const observationMessage = {
                type: 'code_observation',
                question: question,
                language: language,
                current_code: currentCode,
                note: "This is a work in progress. Do not evaluate. Just react naturally like an interviewer watching."
            };

            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify(observationMessage));
            await room.localParticipant.publishData(data, {
                reliable: true,
                topic: 'code-observation'
            });

            setObservationCount(prev => prev + 1);
            lastObservationTimeRef.current = now;
            debug.log(`👀 Code observation ${observationCount + 1} sent`);
        } catch (err) {
            debug.error('❌ Failed to send code observation:', err);
        }
    }, [room, question, language, observationCount, submitted]);

    const handleCodeChange = useCallback((newCode: string | undefined) => {
        const currentCode = newCode || '';
        setCode(currentCode);
        onCodeChange?.(currentCode);

        if (observationTimerRef.current) {
            clearTimeout(observationTimerRef.current);
        }

        if (!submitted && observationCount < 3) {
            observationTimerRef.current = setTimeout(() => {
                sendCodeObservation(currentCode);
            }, 8000); // 8 second debounce
        }
    }, [sendCodeObservation, submitted, observationCount, onCodeChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (observationTimerRef.current) {
                clearTimeout(observationTimerRef.current);
            }
        };
    }, []);

    const handleRun = async () => {
        setIsExecuting(true);
        const executingOutput = { text: 'Executing code...', isError: false };
        setOutput(executingOutput);
        onOutputChange?.(executingOutput);
        try {
            const result = await onRunCode(code, language);
            const newOutput = {
                text: result.error ? `Error:\n${result.error}` : result.output || 'Code executed successfully (no output).',
                isError: !!result.error
            };
            setOutput(newOutput);
            onOutputChange?.(newOutput);
        } catch (err) {
            const errorOutput = { text: `Execution failed: ${err instanceof Error ? err.message : String(err)}`, isError: true };
            setOutput(errorOutput);
            onOutputChange?.(errorOutput);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSubmit = async () => {
        if (submitted) return;
        setIsAnalyzing(true);
        setSubmitted(true);

        if (observationTimerRef.current) {
            clearTimeout(observationTimerRef.current);
        }

        const timeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);

        try {
            // Evaluation Payload
            const submissionPayload = {
                type: 'code_submission',
                question: question,
                language: language,
                code: code,
                time_taken_seconds: timeTakenSeconds,
                observation_count: observationCount,
                executionOutput: output?.isError ? `Error: ${output.text}` : output?.text
            };

            // Custom submit logic to ensure all metadata is sent via data channel
            if (room?.localParticipant) {
                const encoder = new TextEncoder();
                const data = encoder.encode(JSON.stringify(submissionPayload));
                await room.localParticipant.publishData(data, {
                    reliable: true,
                    topic: 'code-submission'
                });
            }

            await onCodeSubmit(code, output?.text);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e] border border-slate-700/50 rounded-lg overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                        <Code2 className="w-4 h-4 text-blue-400" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            disabled={submitted}
                            className="bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer disabled:opacity-50"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.value} value={lang.value} className="bg-[#252526]">
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="h-4 w-px bg-slate-700/50 mx-1" />
                    <span className="text-xs font-medium text-slate-400 truncate max-w-[200px] md:max-w-[400px]">
                        {question || "Coding Challenge"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={handleRun}
                        disabled={isExecuting || isAnalyzing || submitted}
                        className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                    >
                        <Play className="w-4 h-4" />
                        Run
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSubmit}
                        disabled={isExecuting || isAnalyzing || submitted}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {submitted ? 'Submitted' : 'Submit'}
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div
                className="flex-grow relative min-h-[200px]"
                onContextMenu={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
            >
                <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={code}
                    theme="vs-dark"
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount}
                    options={{
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        scrollbar: {
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10,
                        },
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: 'on',
                        roundedSelection: false,
                        readOnly: submitted,
                        cursorStyle: 'line',
                        renderWhitespace: 'none',
                        contextmenu: false,
                    }}
                />
            </div>

            {/* Output Panel */}
            <div className="h-1/4 min-h-[120px] bg-[#252526] border-t border-slate-700/50 flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/50 bg-[#2d2d2d]">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Execution Output</span>
                </div>
                <div className="flex-grow p-4 font-mono text-sm overflow-auto custom-scrollbar">
                    {!output ? (
                        <div className="flex items-center gap-2 text-slate-500 italic">
                            <AlertCircle className="w-4 h-4" />
                            Run your code to see results here...
                        </div>
                    ) : (
                        <pre className={cn(
                            "whitespace-pre-wrap break-words",
                            output.isError ? "text-red-400" : "text-emerald-400"
                        )}>
                            {output.text}
                        </pre>
                    )}
                </div>
            </div>

            {/* Global Loader for Analysis */}
            {isAnalyzing && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full animate-pulse" />
                        <div className="absolute inset-0 border-t-4 border-emerald-500 rounded-full animate-spin" />
                    </div>
                    <p className="mt-4 text-emerald-400 font-semibold tracking-wide animate-pulse">
                        AI Analyzing Your Code...
                    </p>
                </div>
            )}
        </div>
    );
}

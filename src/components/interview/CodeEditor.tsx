import { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, Send, ChevronDown, Terminal, Code2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/livekit/button';

interface CodeEditorProps {
    language: string;
    initialCode: string;
    question: string;
    onCodeSubmit: (code: string, output?: string) => void;
    onRunCode: (code: string, language: string) => Promise<{ output: string; error?: string }>;
}

const LANGUAGES = [
    { label: 'Python', value: 'python' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
];

export function CodeEditor({
    language: initialLanguage = 'python',
    initialCode = '',
    question,
    onCodeSubmit,
    onRunCode
}: CodeEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [language, setLanguage] = useState(initialLanguage);
    const [output, setOutput] = useState<{ text: string; isError: boolean } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const editorRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const handleRun = async () => {
        setIsExecuting(true);
        setOutput({ text: 'Executing code...', isError: false });
        try {
            const result = await onRunCode(code, language);
            setOutput({
                text: result.error ? `Error:\n${result.error}` : result.output || 'Code executed successfully (no output).',
                isError: !!result.error
            });
        } catch (err) {
            setOutput({ text: `Execution failed: ${err instanceof Error ? err.message : String(err)}`, isError: true });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSubmit = async () => {
        setIsAnalyzing(true);
        try {
            await onCodeSubmit(code, output?.isError ? `Error: ${output.text}` : output?.text);
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
                            className="bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer"
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
                    <span className="text-xs font-medium text-slate-400 truncate max-w-[300px]">
                        {question || "Coding Challenge"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={handleRun}
                        disabled={isExecuting || isAnalyzing}
                        className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                    >
                        <Play className="w-4 h-4" />
                        Run
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSubmit}
                        disabled={isExecuting || isAnalyzing}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-grow relative min-h-[200px]">
                <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={code}
                    theme="vs-dark"
                    onChange={(val) => setCode(val || '')}
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
                        readOnly: false,
                        cursorStyle: 'line',
                        renderWhitespace: 'none',
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

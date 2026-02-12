import { useState, useEffect } from 'react';
import StudentLayout from '@/components/StudentLayout';
import { getStudentAnalytics, type StudentAnalyticsResponse } from '@/lib/api';
import { debug } from '@/lib/debug';

export default function StudentOverallAnalysis() {
    const [analytics, setAnalytics] = useState<StudentAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await getStudentAnalytics();
            setAnalytics(data);
        } catch (err) {
            debug.error('Failed to load analytics:', err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Loading analytics...</div>
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Overall Analysis</h1>
                        <p className="text-muted-foreground mt-1">Your comprehensive interview performance analysis</p>
                    </div>
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        Failed to load analytics: {error}
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (!analytics || analytics.total_interviews < 2) {
        return (
            <StudentLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Overall Analysis</h1>
                        <p className="text-muted-foreground mt-1">Your comprehensive interview performance analysis</p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-xl font-semibold mb-2">Not Enough Data Yet</h2>
                        <p className="text-muted-foreground mb-6">
                            Complete at least 2 interviews to unlock your comprehensive performance analysis with AI-powered insights and trend charts.
                        </p>
                        <div className="text-sm text-muted-foreground">
                            Current interviews: {analytics?.total_interviews || 0} / 2
                        </div>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Overall Analysis</h1>
                    <p className="text-muted-foreground mt-1">Your comprehensive interview performance analysis</p>
                </div>

                {/* Performance Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Total Interviews</div>
                        <div className="text-3xl font-bold text-foreground">{analytics.total_interviews}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Overall Score</div>
                        <div className="text-3xl font-bold text-blue-600">{analytics.average_scores.overall}/10</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Communication</div>
                        <div className="text-3xl font-bold text-green-600">{analytics.average_scores.communication}/10</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Technical</div>
                        <div className="text-3xl font-bold text-purple-600">{analytics.average_scores.technical}/10</div>
                    </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span>🤖</span> AI-Powered Analysis
                    </h2>
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 relative">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl text-primary/40 pt-1">"</div>
                            <p className="text-foreground leading-relaxed text-lg pr-4">
                                {analytics.overall_analysis || "Your analysis is being generated. Please check back in a moment."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Trend Chart */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <span>📈</span> Performance Trend
                    </h2>
                    <div className="h-64 w-full relative px-4">
                        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                            {/* Grid lines */}
                            {[0, 10, 20, 30, 40, 50].map((y) => (
                                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
                            ))}
                            {[0, 25, 50, 75, 100].map((x) => (
                                <line key={x} x1={x} y1="0" x2={x} y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
                            ))}

                            {/* Overall Score Line */}
                            {analytics.history.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="rgb(59, 130, 246)"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={analytics.history.map((h, i) => `${(i / (analytics.history.length - 1)) * 100},${50 - (h.score * 5)}`).join(' ')}
                                />
                            )}

                            {/* Communication Line */}
                            {analytics.history.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="rgb(34, 197, 94)"
                                    strokeWidth="0.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeDasharray="2,2"
                                    points={analytics.history.map((h, i) => `${(i / (analytics.history.length - 1)) * 100},${50 - (h.communication * 5)}`).join(' ')}
                                />
                            )}

                            {/* Technical Line */}
                            {analytics.history.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="rgb(168, 85, 247)"
                                    strokeWidth="0.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeDasharray="2,2"
                                    points={analytics.history.map((h, i) => `${(i / (analytics.history.length - 1)) * 100},${50 - (h.technical * 5)}`).join(' ')}
                                />
                            )}

                            {/* Points for overall score */}
                            {analytics.history.map((h, i) => (
                                <circle
                                    key={i}
                                    cx={analytics.history.length > 1 ? (i / (analytics.history.length - 1)) * 100 : 50}
                                    cy={50 - (h.score * 5)}
                                    r="2"
                                    fill="rgb(59, 130, 246)"
                                    className="hover:r-3 transition-all cursor-pointer"
                                >
                                    <title>Interview {i + 1} - Overall: {h.score}/10</title>
                                </circle>
                            ))}
                        </svg>
                        <div className="flex justify-between mt-4 text-xs text-muted-foreground font-medium">
                            <span>Interview 1</span>
                            <span>Interview {analytics.history.length}</span>
                        </div>
                        {/* Legend */}
                        <div className="flex gap-6 mt-4 justify-center text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-blue-500"></div>
                                <span className="text-muted-foreground">Overall</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-green-500" style={{ borderTop: '2px dashed' }}></div>
                                <span className="text-muted-foreground">Communication</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed' }}></div>
                                <span className="text-muted-foreground">Technical</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
                            <span>✅</span> Key Strengths
                        </h2>
                        {analytics.recent_strengths.length > 0 ? (
                            <ul className="space-y-2">
                                {analytics.recent_strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-green-500 mt-1">•</span>
                                        <span className="text-sm text-foreground">{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Complete more interviews to identify your key strengths.</p>
                        )}
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-600">
                            <span>🎯</span> Areas for Improvement
                        </h2>
                        {analytics.recent_improvements.length > 0 ? (
                            <ul className="space-y-2">
                                {analytics.recent_improvements.map((improvement, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-orange-500 mt-1">•</span>
                                        <span className="text-sm text-foreground">{improvement}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Complete more interviews to identify areas for improvement.</p>
                        )}
                    </div>
                </div>

                {/* Individual Interview Cards */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Interview History</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.history.map((interview, idx) => (
                            <div key={idx} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm font-medium text-muted-foreground">Interview {idx + 1}</div>
                                    <div className="text-2xl font-bold text-blue-600">{interview.score}/10</div>
                                </div>
                                <div className="text-xs text-muted-foreground mb-3">
                                    {new Date(interview.date).toLocaleDateString()}
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Communication:</span>
                                        <span className="font-medium">{interview.communication}/10</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Technical:</span>
                                        <span className="font-medium">{interview.technical}/10</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Problem Solving:</span>
                                        <span className="font-medium">{interview.problem_solving}/10</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}

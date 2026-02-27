import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGeminiUsageReport, type BookingResponse } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

export default function AdminGeminiUsagePage() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadInterviews();
    }, []);

    const loadInterviews = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getGeminiUsageReport();
            setInterviews(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const filteredInterviews = interviews.filter(
        (interview) =>
            interview.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            interview.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    const calculateTotalUsage = () => {
        return filteredInterviews.reduce((acc, curr) => ({
            input: acc.input + (curr.token_usage?.input_tokens || 0),
            output: acc.output + (curr.token_usage?.output_tokens || 0),
            total: acc.total + (curr.token_usage?.total_tokens || 0),
        }), { input: 0, output: 0, total: 0 });
    };

    const totals = calculateTotalUsage();

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Loading interview usage data...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        <div className="font-bold mb-1">Error loading usage report:</div>
                        {error}
                    </div>
                )}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
                    <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-blue-100">
                        Cumulative Gemini Usage
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-lg bg-white/50 p-4 dark:bg-black/20 text-center">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Input Tokens</div>
                            <div className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
                                {totals.input.toLocaleString()}
                            </div>
                        </div>
                        <div className="rounded-lg bg-white/50 p-4 dark:bg-black/20 text-center">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Output Tokens</div>
                            <div className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
                                {totals.output.toLocaleString()}
                            </div>
                        </div>
                        <div className="rounded-lg bg-blue-600 p-4 text-center">
                            <div className="text-sm font-medium text-blue-50">Grand Total Tokens</div>
                            <div className="mt-1 text-3xl font-bold text-white">
                                {totals.total.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Filter by candidate name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <button
                        onClick={loadInterviews}
                        className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                        Refresh
                    </button>
                </div>

                <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium">Candidate</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium">Interview Date</th>
                                    <th className="px-6 py-3 text-right text-sm font-medium">Input (Prompt)</th>
                                    <th className="px-6 py-3 text-right text-sm font-medium">Output (Response)</th>
                                    <th className="px-6 py-3 text-right text-sm font-medium">Total</th>
                                    <th className="px-6 py-3 text-center text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredInterviews.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            No interviews found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInterviews.map((interview) => (
                                        <tr key={interview.token} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{interview.name}</div>
                                                <div className="text-xs text-muted-foreground">{interview.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                {formatDate(interview.scheduled_at)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm">
                                                {interview.token_usage?.input_tokens?.toLocaleString() || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm">
                                                {interview.token_usage?.output_tokens?.toLocaleString() || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${interview.token_usage ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {interview.token_usage?.total_tokens?.toLocaleString() || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/evaluation/${interview.token}`)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t px-6 py-4 text-sm text-muted-foreground bg-muted/20">
                        Showing usage for {filteredInterviews.length} interview(s)
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

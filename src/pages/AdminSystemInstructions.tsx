import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/livekit/button';
import AdminLayout from '@/components/AdminLayout';
import { getSystemInstructions, updateSystemInstructions } from '@/lib/api';

export default function AdminSystemInstructions() {
    const [instructions, setInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadInstructions();
    }, []);

    const loadInstructions = async () => {
        try {
            setIsLoading(true);
            const data = await getSystemInstructions();
            setInstructions(data.instructions || '');
        } catch (error) {
            console.error('Failed to load system instructions:', error);
            toast.error('Failed to load system instructions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!instructions.trim()) {
            toast.error('Instructions cannot be empty');
            return;
        }

        try {
            setIsSaving(true);
            await updateSystemInstructions(instructions);
            toast.success('System instructions updated successfully');
        } catch (error) {
            console.error('Failed to update instructions:', error);
            toast.error('Failed to update instructions');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">System Instructions</h3>
                        <p className="text-sm text-muted-foreground">
                            Define the global behavior and instructions for the AI Interviewer agent.
                            These instructions will be prepended to the context of every interview.
                        </p>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                        {isLoading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <textarea
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="Enter system instructions here... e.g., 'You are a professional HR interviewer...'"
                                    className="flex min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                />
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="destructive" // fallback or use available variant
                                        onClick={loadInstructions}
                                        disabled={isSaving}
                                        style={{ backgroundColor: 'transparent', color: 'inherit', border: '1px solid currentColor' }}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || !instructions.trim()}
                                    >
                                        {isSaving ? 'Saving...' : 'Save Instructions'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

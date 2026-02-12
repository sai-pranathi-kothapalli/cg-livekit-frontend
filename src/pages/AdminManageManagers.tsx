import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/livekit/button';
import {
    getManagers,
    enrollManager,
    deleteManager,
    type UserResponse
} from '@/lib/api';

export default function AdminManageManagers() {
    const [managers, setManagers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newManager, setNewManager] = useState({ name: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadManagers();
    }, []);

    const loadManagers = async () => {
        try {
            setLoading(true);
            const data = await getManagers();
            setManagers(data);
        } catch (error) {
            console.error('Failed to load managers:', error);
            toast.error('Failed to load managers');
        } finally {
            setLoading(false);
        }
    };

    const handleAddManager = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newManager.name || !newManager.email) {
            toast.error('Name and Email are required');
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await enrollManager(newManager.name, newManager.email);
            toast.success(
                `Manager enrolled! Temporary password: ${result.temp_password}`,
                { duration: 10000 } // Long duration to copy password
            );
            setShowAddModal(false);
            setNewManager({ name: '', email: '' });
            await loadManagers();
        } catch (error) {
            console.error('Failed to enroll manager:', error);
            toast.error('Failed to enroll manager');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove manager "${name}"? This cannot be undone.`)) {
            return;
        }

        try {
            await deleteManager(id);
            toast.success('Manager removed successfully');
            await loadManagers();
        } catch (error) {
            console.error('Failed to delete manager:', error);
            toast.error('Failed to delete manager');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Manage Managers</h2>
                    <Button onClick={() => setShowAddModal(true)}>+ Add Manager</Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-card">
                        {managers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No managers found. Add one to get started.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium">Name</th>
                                        <th className="px-6 py-3 text-left font-medium">Email</th>
                                        <th className="px-6 py-3 text-left font-medium">Created At</th>
                                        <th className="px-6 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {managers.map((manager) => (
                                        <tr key={manager.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-6 py-4 font-medium">{manager.name}</td>
                                            <td className="px-6 py-4">{manager.email}</td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(manager.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(manager.id, manager.name)}
                                                    className="text-red-600 hover:text-red-700 font-medium text-xs border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Add Manager Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-lg border bg-background shadow-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Add New Manager</h3>
                            <form onSubmit={handleAddManager} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newManager.name}
                                        onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newManager.email}
                                        onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Adding...' : 'Add Manager'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ManagerLayout from '@/components/ManagerLayout';
import { getSlots } from '@/lib/api';

export default function ManagerDashboard() {
    const [stats, setStats] = useState({
        activeSlots: 0,
        totalBookings: 0,
        upcomingSlots: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setIsLoading(true);
            const slots = await getSlots(undefined, true);

            const active = slots.filter(s => s.status === 'active').length;
            const bookings = slots.reduce((acc, curr) => acc + curr.current_bookings, 0);
            const upcoming = slots.filter(s => new Date(s.slot_datetime) > new Date()).length;

            setStats({
                activeSlots: active,
                totalBookings: bookings,
                upcomingSlots: upcoming
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
            toast.error('Failed to load dashboard stats');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ManagerLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight text-sm font-medium">Active Slots</h3>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="h-4 w-4 text-muted-foreground"
                                >
                                    <path d="M12 2v20M2 12h20" />
                                </svg>
                            </div>
                            <div className="text-2xl font-bold">{stats.activeSlots}</div>
                            <p className="text-xs text-muted-foreground">Slots currently open for booking</p>
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight text-sm font-medium">Total Bookings</h3>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="h-4 w-4 text-muted-foreground"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="text-2xl font-bold">{stats.totalBookings}</div>
                            <p className="text-xs text-muted-foreground">Total student bookings across all slots</p>
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight text-sm font-medium">Upcoming Slots</h3>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="h-4 w-4 text-muted-foreground"
                                >
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                    <line x1="16" x2="16" y1="2" y2="6" />
                                    <line x1="8" x2="8" y1="2" y2="6" />
                                    <line x1="3" x2="21" y1="10" y2="10" />
                                </svg>
                            </div>
                            <div className="text-2xl font-bold">{stats.upcomingSlots}</div>
                            <p className="text-xs text-muted-foreground">Slots scheduled for the future</p>
                        </div>
                    </div>
                )}

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <a href="/manager/enroll-user" className="flex items-center gap-2 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                            <span className="text-xl">👤</span>
                            <span className="font-medium">Enroll Candidate</span>
                        </a>
                        <a href="/manager/manage-users" className="flex items-center gap-2 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                            <span className="text-xl">📋</span>
                            <span className="font-medium">Manage Candidates</span>
                        </a>
                        <a href="/manager/slots" className="flex items-center gap-2 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                            <span className="text-xl">⏰</span>
                            <span className="font-medium">Manage Slots</span>
                        </a>
                        <a href="/manager/schedule-interview" className="flex items-center gap-2 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                            <span className="text-xl">📅</span>
                            <span className="font-medium">Schedule Interview</span>
                        </a>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}

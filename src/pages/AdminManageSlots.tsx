import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getSlots, createSlot, updateSlot, deleteSlot, createDaySlots, type SlotResponse, type UpdateSlotRequest } from '@/lib/api';
import { debug } from '@/lib/debug';

export default function AdminManageSlots() {
  const { isManager } = useAuth();
  const Layout = isManager ? ManagerLayout : AdminLayout;
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  // ... (existing state) ...
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // ... (existing functions) ...

  const handleDelete = async (slotId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this slot? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(slotId);
      setError(null);
      await deleteSlot(slotId);
      await loadSlots();
    } catch (err) {
      setError((err as Error).message || 'Failed to delete slot');
    } finally {
      setIsDeleting(null);
    }
  };

  // ... (formatDate function fix below) ...


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateDayModal, setShowCreateDayModal] = useState(false);
  const [showSlotDetails, setShowSlotDetails] = useState<SlotResponse | null>(null);
  const [slotBookings, setSlotBookings] = useState<any[]>([]);
  const [editingSlot, setEditingSlot] = useState<SlotResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [creatingDay, setCreatingDay] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    slot_datetime: '',
    max_capacity: 30,
    duration_minutes: 45, // Default 45 minutes
    notes: '',
  });

  // Day slots form state
  const [dayFormData, setDayFormData] = useState({
    date: '',
    start_time: '09:00',
    end_time: '21:00',
    interval_minutes: 45,
    max_capacity: 30,
    notes: '',
  });

  useEffect(() => {
    loadSlots();
  }, [filterStatus]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const allSlots = await getSlots(filterStatus === 'all' ? undefined : filterStatus, filterStatus === 'all');
      setSlots(allSlots);
    } catch (err) {
      setError((err as Error).message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    try {
      setError(null);
      setCreating(true);
      await createSlot(formData);
      setShowCreateModal(false);
      setFormData({ slot_datetime: '', max_capacity: 30, duration_minutes: 45, notes: '' });
      await loadSlots();
    } catch (err) {
      setError((err as Error).message || 'Failed to create slot');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (slot: SlotResponse) => {
    setEditingSlot(slot);
    // Calculate duration from start_time and end_time if available, otherwise default to 45
    let duration = 45;
    if (slot.start_time && slot.end_time) {
      try {
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Convert to minutes
          // Ensure duration is valid (at least 1 minute, max 120)
          if (duration < 1 || duration > 120) {
            duration = 45; // Default if calculated duration is invalid
          }
        }
      } catch (e) {
        debug.warn('Could not calculate duration from slot times:', e);
      }
    }
    setFormData({
      slot_datetime: slot.slot_datetime.slice(0, 16), // Format for datetime-local input
      max_capacity: slot.max_capacity,
      duration_minutes: duration,
      notes: slot.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    try {
      setError(null);
      const updateData: UpdateSlotRequest = {
        slot_datetime: formData.slot_datetime ? new Date(formData.slot_datetime).toISOString() : undefined,
        max_capacity: formData.max_capacity,
        notes: formData.notes,
      };
      await updateSlot(editingSlot.id, updateData);
      setShowCreateModal(false);
      setEditingSlot(null);
      setFormData({ slot_datetime: '', max_capacity: 30, duration_minutes: 45, notes: '' });
      await loadSlots();
    } catch (err) {
      setError((err as Error).message || 'Failed to update slot');
    }
  };


  const handleCreateDaySlots = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setCreatingDay(true);
      const result = await createDaySlots(dayFormData);
      setShowCreateDayModal(false);
      setDayFormData({
        date: '',
        start_time: '09:00',
        end_time: '21:00',
        interval_minutes: 45,
        max_capacity: 30,
        notes: '',
      });

      if (result.errors && result.errors.length > 0) {
        setError(`Created ${result.created_count} slots, but ${result.errors.length} failed: ${result.errors.join(', ')}`);
      }

      await loadSlots();
    } catch (err) {
      setError((err as Error).message || 'Failed to create day slots');
    } finally {
      setCreatingDay(false);
    }
  };


  // Format time in IST timezone
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' IST';
    } catch (e) {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatDateKey = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      // Format as YYYY-MM-DD in IST
      // Use en-CA (Canada) as it defaults to YYYY-MM-DD, then force IST timezone
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date);

      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;

      return `${y}-${m}-${d}`;
    } catch (e) {
      return isoString;
    }
  };

  const handleSlotClick = async (slot: SlotResponse) => {
    setShowSlotDetails(slot);
    // TODO: Fetch bookings for this slot when we have the endpoint
    setSlotBookings([]);
  };

  // Group slots by date
  const groupedSlotsByDate = slots.reduce((acc, slot) => {
    const dateKey = formatDateKey(slot.slot_datetime);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, SlotResponse[]>);

  // Sort slots within each date by time
  Object.keys(groupedSlotsByDate).forEach(dateKey => {
    groupedSlotsByDate[dateKey].sort((a, b) =>
      new Date(a.slot_datetime).getTime() - new Date(b.slot_datetime).getTime()
    );
  });

  // Convert to array and sort dates, then split into rows of 4
  const dateGroupsArray = Object.entries(groupedSlotsByDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateKey, slots]) => ({
      dateKey,
      dateDisplay: formatDate(slots[0].slot_datetime),
      slots,
    }));

  // Split date groups into rows of 4 dates
  const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const dateRows = chunkArray(dateGroupsArray, 4);


  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Interview Slots</h1>
            <p className="text-muted-foreground mt-1">Manage interview time slots and capacities</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDayFormData({
                  date: new Date().toISOString().split('T')[0], // Today's date
                  start_time: '09:00',
                  end_time: '21:00',
                  interval_minutes: 45,
                  max_capacity: 30,
                  notes: '',
                });
                setShowCreateDayModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📅 Create Day Slots
            </button>
            <button
              onClick={() => {
                setEditingSlot(null);
                setFormData({ slot_datetime: '', max_capacity: 30, duration_minutes: 45, notes: '' });
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              + Create Slot
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Filter by status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="full">Full</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Slots by Date Layout */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground">No slots found. Create your first slot to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dateRows.map((dateRow, rowIndex) => (
              <div key={rowIndex} className="space-y-4">
                {/* Date Cards Row (4 columns - one date per card) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dateRow.map((dateGroup) => (
                    <div
                      key={dateGroup.dateKey}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      {/* Date Card Header */}
                      <div className="mb-3 pb-3 border-b border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground">
                            {dateGroup.dateDisplay}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateGroup.slots.length} time slot{dateGroup.slots.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Time Slot Pills */}
                      <div className="flex flex-wrap gap-2">
                        {dateGroup.slots.map((slot) => {
                          const isFull = slot.current_bookings >= slot.max_capacity;

                          return (
                            <div key={slot.id} className="relative group">
                              <button
                                onClick={() => handleSlotClick(slot)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 pr-8 ${isFull
                                  ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
                                  : slot.status === 'active'
                                    ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                                  }`}
                              >
                                <span>{formatTime(slot.slot_datetime)}</span>
                                <span className="text-[10px] opacity-75">
                                  ({slot.current_bookings}/{slot.max_capacity})
                                </span>
                              </button>
                              <button
                                onClick={(e) => handleDelete(slot.id, e)}
                                disabled={isDeleting === slot.id}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Slot"
                              >
                                {isDeleting === slot.id ? (
                                  <span className="w-3 h-3 block border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                  </svg>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Fill empty cards if less than 4 dates in this row */}
                  {dateRow.length < 4 && Array.from({ length: 4 - dateRow.length }).map((_, emptyIndex) => (
                    <div key={`empty-${emptyIndex}`} className="hidden lg:block" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {editingSlot ? 'Edit Slot' : 'Create New Slot'}
            </h2>

            <form onSubmit={editingSlot ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.slot_datetime}
                  onChange={(e) => setFormData({ ...formData, slot_datetime: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Interview Duration (Minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 45 })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Duration of each interview in this slot (e.g., 5, 10, 30, 45 minutes). Default: 45 minutes.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Capacity (Students) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of students that can be scheduled in this slot (e.g., 20, 30)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Add any notes about this slot..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSlot(null);
                    setFormData({ slot_datetime: '', max_capacity: 30, duration_minutes: 45, notes: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Day Slots Modal */}
      {showCreateDayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">Create Day Slots</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create multiple slots for a single day with a specified time range and interval.
            </p>

            <form onSubmit={handleCreateDaySlots} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={dayFormData.date}
                  onChange={(e) => setDayFormData({ ...dayFormData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={dayFormData.start_time}
                    onChange={(e) => setDayFormData({ ...dayFormData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={dayFormData.end_time}
                    onChange={(e) => setDayFormData({ ...dayFormData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Interval Between Slots (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={dayFormData.interval_minutes}
                  onChange={(e) => setDayFormData({ ...dayFormData, interval_minutes: parseInt(e.target.value) || 45 })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Time between each slot (e.g., 45 minutes)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Capacity per Slot *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={dayFormData.max_capacity}
                  onChange={(e) => setDayFormData({ ...dayFormData, max_capacity: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of students per slot (e.g., 20, 30)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={dayFormData.notes}
                  onChange={(e) => setDayFormData({ ...dayFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Add any notes for all slots..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creatingDay}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingDay ? 'Creating...' : 'Create All Slots'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDayModal(false);
                    setDayFormData({
                      date: '',
                      start_time: '09:00',
                      end_time: '21:00',
                      interval_minutes: 45,
                      max_capacity: 30,
                      notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slot Details Modal */}
      {showSlotDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSlotDetails(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Slot Details - {formatTime(showSlotDetails.slot_datetime)}
                </h2>
                <p className="text-sm text-muted-foreground">{formatDate(showSlotDetails.slot_datetime)}</p>
              </div>
              <button
                onClick={() => setShowSlotDetails(null)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Slot Information */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold text-foreground capitalize">{showSlotDetails.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-semibold text-foreground">{showSlotDetails.max_capacity} students</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Bookings</p>
                <p className="font-semibold text-foreground">{showSlotDetails.current_bookings}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="font-semibold text-foreground">
                  {showSlotDetails.max_capacity - showSlotDetails.current_bookings} slots
                </p>
              </div>
              {(showSlotDetails as any).created_by && (
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-semibold text-foreground">
                    Admin ID: {(showSlotDetails as any).created_by?.substring(0, 8)}...
                  </p>
                </div>
              )}
              {(showSlotDetails as any).created_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-semibold text-foreground">
                    {new Date((showSlotDetails as any).created_at).toLocaleString()}
                  </p>
                </div>
              )}
              {showSlotDetails.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-foreground">{showSlotDetails.notes}</p>
                </div>
              )}
            </div>

            {/* Bookings List */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Bookings ({showSlotDetails.current_bookings})
              </h3>
              {slotBookings.length === 0 ? (
                <div className="text-center py-8 bg-muted rounded-lg">
                  <p className="text-muted-foreground">
                    {showSlotDetails.current_bookings === 0
                      ? 'No bookings for this slot yet'
                      : 'Booking details will be shown here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slotBookings.map((booking, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-foreground">{booking.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.email}</p>
                      {booking.phone && (
                        <p className="text-sm text-muted-foreground">{booking.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  handleEdit(showSlotDetails);
                  setShowSlotDetails(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Slot
              </button>
              <button
                onClick={() => setShowSlotDetails(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}


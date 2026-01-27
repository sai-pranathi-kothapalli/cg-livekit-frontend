import { useState, useEffect } from 'react';
import { getAllUsers, scheduleInterviewForUser, bulkScheduleInterviews, getSlots, type UserResponse, type BulkScheduleInterviewResponse, type SlotResponse } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import * as XLSX from 'xlsx';

export default function AdminScheduleInterview() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [interviewUrl, setInterviewUrl] = useState<string | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<SlotResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [result, setResult] = useState<BulkScheduleInterviewResponse | null>(null);

  useEffect(() => {
    loadUsers();
    loadAvailableSlots();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      // Use admin endpoint - get ALL slots (same as Interview Slots page with 'all' filter)
      // Then filter client-side for available ones (active, not full, in future)
      const allSlots = await getSlots(undefined, true);

      // Filter for slots that are:
      // - Active status
      // - Not full
      // - In the future (compared as strings/ISO dates)
      const now = new Date();
      const available = allSlots.filter(slot => {
        const slotDate = new Date(slot.slot_datetime);
        const isActive = slot.status === 'active';
        const isNotFull = slot.current_bookings < slot.max_capacity;
        const isFuture = slotDate >= now;

        return isActive && isNotFull && isFuture;
      });

      setAvailableSlots(available);
    } catch (err) {
      console.error('Failed to load available slots:', err);
      setError('Failed to load available slots');
    }
  };

  // Format date key - extract directly from ISO string to avoid timezone conversion (same as Interview Slots page)
  const formatDateKey = (isoString: string): string => {
    // Extract date directly from ISO string to avoid timezone conversion
    // Format: "2026-01-18T09:00:00" or "2026-01-18T09:00:00+00:00" -> "2026-01-18"
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month}-${day}`;
    }
    // Fallback to Date conversion if format doesn't match
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  };

  // Format date for display (same as Interview Slots page)
  const formatDate = (isoString: string): string => {
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(month, 10) - 1];
      return `${monthName} ${parseInt(day, 10)}, ${year}`;
    }
    // Fallback to Date conversion if format doesn't match
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group slots by date (same logic as Interview Slots page)
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const dateKey = formatDateKey(slot.slot_datetime);

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, SlotResponse[]>);

  // Sort slots within each date by time
  Object.keys(slotsByDate).forEach(dateKey => {
    slotsByDate[dateKey].sort((a, b) =>
      new Date(a.slot_datetime).getTime() - new Date(b.slot_datetime).getTime()
    );
  });

  // Get unique dates sorted
  const availableDates = Object.keys(slotsByDate).sort();

  // Get slots for selected date
  const slotsForSelectedDate = selectedDate ? (slotsByDate[selectedDate] || []) : [];

  // Format time for display - extract directly from ISO string to avoid timezone conversion
  const formatSlotTime = (isoString: string): string => {
    // Extract time directly from ISO string
    const timeMatch = isoString.match(/T(\d{2}):(\d{2}):?(\d{2})?/);
    if (timeMatch) {
      const [, hourStr, minuteStr] = timeMatch;
      const hours = parseInt(hourStr, 10);
      const minutes = parseInt(minuteStr, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = String(minutes).padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${ampm}`;
    }
    // Fallback to Date conversion
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string): string => {
    return formatDate(dateStr + 'T00:00:00');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setInterviewUrl(null);
    setLoading(true);

    try {
      if (!selectedUserId) {
        throw new Error('Please select a user');
      }

      if (!selectedSlotId) {
        throw new Error('Please select an interview slot');
      }

      const data = await scheduleInterviewForUser({
        user_id: selectedUserId,
        slot_id: selectedSlotId,
      });

      setInterviewUrl(data.interviewUrl);
      setSuccess(true);

      // Reset form
      setSelectedUserId('');
      setSelectedDate('');
      setSelectedSlotId('');

      // Reload users and slots to update status
      await Promise.all([loadUsers(), loadAvailableSlots()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotId(''); // Reset slot selection when date changes
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedData([]);
    setError(null);
    setResult(null);

    // Parse Excel file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Validate and parse data
        const schedules: any[] = jsonData.map((row) => {
          let datetimeStr = row.datetime || row['datetime'] || row['scheduled_at'];
          if (datetimeStr instanceof Date) {
            datetimeStr = datetimeStr.toISOString();
          }

          return {
            user_id: row.user_id || row['user_id'] || row['email'] || '',
            email: row.email || row['Email'] || '',
            datetime: datetimeStr ? String(datetimeStr) : '',
          };
        });

        setParsedData(schedules);
      } catch (err) {
        setError(`Failed to parse Excel file: ${(err as Error).message}`);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleBulkUpload = async () => {
    if (!file) {
      setError('Please select an Excel file');
      return;
    }

    if (parsedData.length === 0) {
      setError('No valid data found in Excel file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await bulkScheduleInterviews(file);
      setResult(response);
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('single');
                setError(null);
                setSuccess(false);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'single'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Single Interview
            </button>
            <button
              onClick={() => {
                setActiveTab('bulk');
                setError(null);
                setSuccess(false);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'bulk'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Bulk Schedule
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'single' ? (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Schedule Single Interview</h2>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <p className="font-semibold">✅ Interview scheduled successfully!</p>
                {interviewUrl && (
                  <div className="mt-2">
                    <p className="text-xs">Interview URL:</p>
                    <a
                      href={interviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-xs underline"
                    >
                      {interviewUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Select User *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- Select a user --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) {user.phone ? `- ${user.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">Select Interview Slot *</label>

                {availableDates.length === 0 ? (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                    ⚠️ No available interview slots. Please create slots in the "Interview Slots" page first.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Date</label>
                      <select
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">-- Select a date --</option>
                        {availableDates.map((date) => (
                          <option key={date} value={date}>
                            {formatDateDisplay(date)} ({slotsByDate[date].length} slot{slotsByDate[date].length !== 1 ? 's' : ''})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedDate && slotsForSelectedDate.length > 0 && (
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Available Time Slots</label>
                        <select
                          value={selectedSlotId}
                          onChange={(e) => setSelectedSlotId(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          <option value="">-- Select a time slot --</option>
                          {slotsForSelectedDate.map((slot) => {
                            const available = slot.max_capacity - slot.current_bookings;
                            return (
                              <option key={slot.id} value={slot.id}>
                                {formatSlotTime(slot.slot_datetime)} ({slot.current_bookings}/{slot.max_capacity} booked, {available} available)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {selectedDate && slotsForSelectedDate.length === 0 && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        No available slots for this date. Please select another date.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || !selectedUserId || !selectedSlotId || availableDates.length === 0}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {loading ? 'Scheduling...' : 'Schedule Interview'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Bulk Schedule Interviews</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload an Excel file (.xlsx, .xls) with the following columns:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              <li><strong>email</strong> - User email from enrolled users (required)</li>
              <li><strong>datetime</strong> - Interview date and time in IST (required)</li>
            </ul>

            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <p className="mb-2 font-medium">📥 Download Sample Template</p>
              <p className="mb-2 text-xs">Download a sample Excel file to see the correct format:</p>
              <a
                href="/sample-schedule-template.xlsx"
                download="sample-schedule-template.xlsx"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
              >
                <span>⬇️</span>
                <span>Download Sample Template</span>
              </a>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Select Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {file && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  ✓ Parsed {parsedData.length} schedule(s) from Excel file
                </div>
              )}

              <button
                onClick={handleBulkUpload}
                disabled={loading || !file || parsedData.length === 0}
                className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60"
              >
                {loading ? 'Scheduling Interviews...' : `Schedule ${parsedData.length} Interview(s)`}
              </button>

              {result && (
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold">Scheduling Results</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Schedules:</span>
                      <span className="font-medium">{result.total}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Successfully Scheduled:</span>
                      <span className="font-medium">{result.successful}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">Failed:</span>
                      <span className="font-medium">{result.failed}</span>
                    </div>
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium">Errors:</p>
                        <ul className="list-disc space-y-1 pl-6 text-xs text-red-600">
                          {result.errors.slice(0, 10).map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


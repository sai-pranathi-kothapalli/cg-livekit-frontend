import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCandidate, type CandidateRegistrationRequest } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRegisterCandidate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [interviewUrl, setInterviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState<CandidateRegistrationRequest>({
    name: '',
    email: '',
    phone: '',
    datetime: '',
  });

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const getDateTimeString = (): string => {
    if (!form.datetime) return '';
    
    let hour24 = parseInt(hour, 10);
    if (ampm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const hour24Str = String(hour24).padStart(2, '0');
    const minuteStr = minute.padStart(2, '0');
    const localDate = new Date(`${form.datetime}T${hour24Str}:${minuteStr}`);
    
    const offsetMinutes = localDate.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:00${offsetStr}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setInterviewUrl(null);
    setLoading(true);

    try {
      const datetime = getDateTimeString();
      if (!datetime) {
        throw new Error('Please select a date and time');
      }

      // Validate datetime is at least 5 minutes in future
      const selectedDateTime = new Date(datetime);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (selectedDateTime <= fiveMinutesFromNow) {
        throw new Error('Please select a date and time at least 5 minutes from now');
      }

      const data = await registerCandidate({
        ...form,
        datetime,
      });

      setInterviewUrl(data.interviewUrl);
      setSuccess(true);
      
      // Reset form
      setForm({
        name: '',
        email: '',
        phone: '',
        datetime: '',
      });
      setHour('10');
      setMinute('00');
      setAmpm('AM');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
        <div className="mx-auto max-w-2xl">
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <p className="font-semibold">✅ Candidate registered successfully!</p>
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

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">Schedule Interview *</label>
                
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={form.datetime}
                    onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Hour</label>
                    <select
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>
                          {parseInt(h, 10)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Minute</label>
                    <select
                      value={minute}
                      onChange={(e) => setMinute(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">AM/PM</label>
                    <select
                      value={ampm}
                      onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
                >
                  {loading ? 'Registering...' : 'Register Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
    </AdminLayout>
  );
}


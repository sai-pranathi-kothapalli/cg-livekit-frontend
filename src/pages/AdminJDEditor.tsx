import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobDescription, updateJobDescription, type JobDescription } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

export default function AdminJDEditor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [jd, setJd] = useState<JobDescription>({
    context: '',
  });

  useEffect(() => {
    loadJobDescription();
  }, []);

  const loadJobDescription = async () => {
    try {
      setLoading(true);
      const data = await getJobDescription();
      setJd(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await updateJobDescription(jd);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading context...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            ✅ Context saved successfully!
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium">Interview / Agent Context</label>
            <p className="mb-2 text-xs text-muted-foreground">
              This context is sent to the interview agent. Edit it here to change how the interviewer behaves, what questions to ask, and any rules. The agent uses this as its main instructions.
            </p>
            <div className="mb-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Available Context Keys:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {[
                  'full_name',  'post', 'category', 'date_of_birth',
                  'gender', 'marital_status', 'aadhaar_number', 'pan_number',
                  'father_name', 'mother_name', 'spouse_name', 'correspondence_address1',
                  'correspondence_state', 'correspondence_district', 'permanent_address1',
                  'permanent_state', 'permanent_district', 'ssc_percentage',
                  'graduation_degree', 'graduation_college', 'graduation_specialization',
                  'graduation_percentage'
                ].map(key => (
                  <code key={key} className="rounded bg-background px-1 py-0.5 border border-border">
                    {`{${key}}`}
                  </code>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Use these placeholders in the text below (e.g. "Hello {'{name}'}"). They will be replaced with actual candidate data.
              </p>
            </div>
            <textarea
              value={jd.context}
              onChange={(e) => setJd({ ...jd, context: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
              rows={24}
              placeholder="Paste or type the full interviewer context (instructions, question bank, rules)..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Context'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

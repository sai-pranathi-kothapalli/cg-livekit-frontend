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
    title: '',
    description: '',
    requirements: '',
    preparation_areas: [],
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
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addPreparationArea = () => {
    setJd({
      ...jd,
      preparation_areas: [...jd.preparation_areas, ''],
    });
  };

  const updatePreparationArea = (index: number, value: string) => {
    const updated = [...jd.preparation_areas];
    updated[index] = value;
    setJd({
      ...jd,
      preparation_areas: updated,
    });
  };

  const removePreparationArea = (index: number) => {
    const updated = jd.preparation_areas.filter((_, i) => i !== index);
    setJd({
      ...jd,
      preparation_areas: updated,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading job description...</p>
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
              ✅ Job description saved successfully!
            </div>
          )}

          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-medium">Job Title *</label>
              <input
                type="text"
                value={jd.title}
                onChange={(e) => setJd({ ...jd, title: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., Regional Rural Bank Probationary Officer (PO)"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description *</label>
              <textarea
                value={jd.description}
                onChange={(e) => setJd({ ...jd, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={5}
                placeholder="Enter job description..."
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Requirements *</label>
              <textarea
                value={jd.requirements}
                onChange={(e) => setJd({ ...jd, requirements: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="Enter requirements..."
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Interview Preparation Areas</label>
              <div className="space-y-2">
                {jd.preparation_areas.map((area, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => updatePreparationArea(index, e.target.value)}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={`Preparation area ${index + 1}`}
                    />
                    <button
                      onClick={() => removePreparationArea(index)}
                      className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addPreparationArea}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  + Add Preparation Area
                </button>
              </div>
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
                disabled={saving || !jd.title.trim() || !jd.description.trim() || !jd.requirements.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Job Description'}
              </button>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}


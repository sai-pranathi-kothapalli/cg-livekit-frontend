import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCandidates, type BookingResponse } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

export default function AdminCandidatesList() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await getAllCandidates();
      setCandidates(data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.phone.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={loadCandidates}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Refresh
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {candidates.length === 0
                ? 'No candidates registered yet.'
                : 'No candidates match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Scheduled At</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Created At</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.token} className="border-b">
                      <td className="px-6 py-4 text-sm">{candidate.name}</td>
                      <td className="px-6 py-4 text-sm">{candidate.email}</td>
                      <td className="px-6 py-4 text-sm">{candidate.phone}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(candidate.scheduled_at)}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(candidate.created_at)}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <a
                            href={`/interview/${candidate.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Interview
                          </a>
                          <button
                            onClick={() => navigate(`/evaluation/${candidate.token}`)}
                            className="text-green-600 hover:underline"
                          >
                            Evaluation
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t px-6 py-4 text-sm text-muted-foreground">
            Showing {filteredCandidates.length} of {candidates.length} candidate(s)
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


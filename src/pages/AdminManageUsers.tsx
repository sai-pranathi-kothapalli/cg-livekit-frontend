import { useState, useEffect } from 'react';
import { getAllUsers, getUser, deleteUser, updateUser, type UserResponse, type UserDetailResponse, type UpdateUserRequest } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminManageUsers() {
  const { isManager } = useAuth();
  const Layout = isManager ? ManagerLayout : AdminLayout;
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailResponse | null>(null);
  const [viewingUser, setViewingUser] = useState(false);

  const handleViewUser = async (user: UserResponse) => {
    try {
      setLoading(true);
      const userDetails = await getUser(user.id);
      setSelectedUser(userDetails);
      setViewingUser(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const closeUserModal = () => {
    setViewingUser(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (user: UserResponse) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      status: user.status,
      notes: user.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      setError(null);
      await updateUser(editingUser.id, editForm);
      setEditingUser(null);
      setEditForm({});
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm))
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'interviewed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'selected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading && !viewingUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* User Details Modal */}
        {viewingUser && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-background shadow-lg">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-lg font-semibold">User Details: {selectedUser.name}</h2>
                <button
                  onClick={closeUserModal}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <p><span className="font-semibold">Email:</span> {selectedUser.email}</p>
                      <p><span className="font-semibold">Phone:</span> {selectedUser.phone || '-'}</p>
                      <p><span className="font-semibold">Status:</span>
                        <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Metadata</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <p><span className="font-semibold">User ID:</span> <span className="font-mono text-xs">{selectedUser.id}</span></p>
                      <p><span className="font-semibold">Created:</span> {formatDate(selectedUser.created_at)}</p>
                      <p><span className="font-semibold">Notes:</span> {selectedUser.notes || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Interview History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Interview History</h3>

                  {/* Overall Feedback (Aggregated) */}
                  <div className="mb-4 rounded-md border bg-muted/20 p-4">
                    <div className="text-sm font-medium text-muted-foreground">Overall Feedback</div>
                    <div className="mt-2 text-sm leading-relaxed">
                      {selectedUser.overall_analysis ? (
                        <p className="text-foreground whitespace-pre-wrap">{selectedUser.overall_analysis}</p>
                      ) : (
                        <p className="text-muted-foreground">No overall feedback available yet.</p>
                      )}
                    </div>
                  </div>

                  {selectedUser.interviews && selectedUser.interviews.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Date & Time</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Score</th>
                            <th className="px-4 py-3 text-left font-medium">Summary</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.interviews.map((interview) => (
                            <tr key={interview.token} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-4 py-3">{formatDate(interview.scheduled_at)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium 
                                  ${interview.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                                  {interview.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {interview.overall_score ? `${interview.overall_score.toFixed(1)}/10` : '-'}
                              </td>
                              <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                                {interview.overall_feedback || '-'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {interview.evaluation_url && (
                                  <a
                                    href={interview.evaluation_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline font-medium"
                                  >
                                    View Report
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                      No interviews found for this user.
                    </div>
                  )}
                </div>

                {/* Overall Analysis Section */}
                {selectedUser.interviews && selectedUser.interviews.filter(i => i.overall_score !== null).length >= 2 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>📊</span> Overall Progress Analysis
                    </h3>
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl text-primary/40 pt-1">"</div>
                        <div className="flex-1">
                          <p className="text-foreground leading-relaxed text-base">
                            This student has completed {selectedUser.interviews.filter(i => i.overall_score !== null).length} interviews with evaluations.
                            {selectedUser.interviews.filter(i => i.overall_score !== null).length >= 2 ? (
                              <span>
                                {' '}Average score: <span className="font-semibold">
                                  {(selectedUser.interviews
                                    .filter(i => i.overall_score !== null)
                                    .reduce((sum, i) => sum + (i.overall_score || 0), 0) /
                                    selectedUser.interviews.filter(i => i.overall_score !== null).length
                                  ).toFixed(1)}/10
                                </span>.
                                View the Individual Interview panel to see detailed AI-powered insights for each interview.
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t bg-muted/30 px-6 py-4">
                <button
                  onClick={() => {
                    closeUserModal();
                    handleEdit(selectedUser);
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  Edit User
                </button>
                <button
                  onClick={closeUserModal}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
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
            onClick={loadUsers}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Refresh
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {users.length === 0 ? 'No users enrolled yet.' : 'No users match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Notes</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Created At</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      {editingUser?.id === user.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="email"
                              value={editForm.email || ''}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="tel"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editForm.status || 'enrolled'}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                            >
                              <option value="enrolled">Enrolled</option>
                              <option value="interviewed">Interviewed</option>
                              <option value="selected">Selected</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm">{formatDate(user.created_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-500 disabled:opacity-60"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="rounded-md border border-input bg-background px-3 py-1 text-xs font-medium transition hover:bg-muted"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="font-medium text-blue-600 hover:underline text-left"
                            >
                              {user.name}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm">{user.email}</td>
                          <td className="px-6 py-4 text-sm">{user.phone || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">{user.notes || '-'}</td>
                          <td className="px-6 py-4 text-sm">{formatDate(user.created_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(user.id, user.name)}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-500"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t px-6 py-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} user(s)
          </div>
        </div>
      </div>
    </Layout>
  );
}


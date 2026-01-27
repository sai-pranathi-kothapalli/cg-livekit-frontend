import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, updateUser, type UserResponse, type UpdateUserRequest } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

export default function AdminManageUsers() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [saving, setSaving] = useState(false);

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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading users...</p>
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
                          <td className="px-6 py-4 text-sm">{user.name}</td>
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
    </AdminLayout>
  );
}


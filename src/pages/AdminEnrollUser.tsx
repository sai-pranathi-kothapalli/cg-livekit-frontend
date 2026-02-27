import { useState } from 'react';
import { enrollUser, bulkEnrollUsers, type EnrollUserRequest, type BulkEnrollResponse } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

export default function AdminEnrollUser() {
  const { isManager } = useAuth();
  const Layout = isManager ? ManagerLayout : AdminLayout;
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  // ... (rest of state)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [result, setResult] = useState<BulkEnrollResponse | null>(null);

  const [form, setForm] = useState<EnrollUserRequest>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    slot_ids: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const enrollmentData = {
        ...form,
        slot_ids: [],
      };

      await enrollUser(enrollmentData);
      setSuccess(true);

      // Reset form
      setForm({
        name: '',
        email: '',
        phone: '',
        notes: '',
        slot_ids: [],
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
        const users: any[] = jsonData.map((row) => ({
          name: String(row.name || row['Name'] || ''),
          email: String(row.email || row['Email'] || ''),
          phone: row.phone || row['Phone'] ? String(row.phone || row['Phone']) : undefined,
          notes: row.notes || row['Notes'] ? String(row.notes || row['Notes']) : undefined,
        }));

        // Validate required fields
        const invalidRows = users.filter((u) => !u.name || !u.email);

        if (invalidRows.length > 0) {
          setError(`Rows with missing data: ${invalidRows.map((_, i) => i + 2).join(', ')}`);
        }

        setParsedData(users);
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
      const response = await bulkEnrollUsers(file);
      setResult(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
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
              Single User Enrollment
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
              Bulk Enrollment
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'single' ? (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Enroll Single User</h2>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                ✅ User enrolled successfully!
              </div>
            )}

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
                <label className="mb-2 block text-sm font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>


              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {loading ? 'Enrolling...' : 'Enroll User'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Bulk Enroll Users</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload an Excel file (.xlsx, .xls) with the following columns:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              <li><strong>name</strong> - User full name (required)</li>
              <li><strong>email</strong> - Email address (required)</li>
              <li><strong>phone</strong> - Phone number (optional)</li>
              <li><strong>notes</strong> - Admin notes (optional)</li>
            </ul>

            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <p className="mb-2 font-medium">📥 Download Sample Template</p>
              <p className="mb-2 text-xs">Download a sample Excel file to see the correct format:</p>
              <a
                href="/sample-users-template.xlsx"
                download="sample-users-template.xlsx"
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
                  ✓ Parsed {parsedData.length} user(s) from Excel file
                </div>
              )}

              <button
                onClick={handleBulkUpload}
                disabled={loading || !file || parsedData.length === 0}
                className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60"
              >
                {loading ? 'Enrolling Users...' : `Enroll ${parsedData.length} User(s)`}
              </button>

              {result && (
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold">Enrollment Results</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Users:</span>
                      <span className="font-medium">{result.total}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Successfully Enrolled:</span>
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
                          {result.errors.slice(0, 10).map((error, index) => (
                            <li key={index}>{error}</li>
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
    </Layout>
  );
}

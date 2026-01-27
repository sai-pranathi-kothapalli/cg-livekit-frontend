import { useState } from 'react';
import { bulkRegisterCandidates, type BulkRegistrationResponse } from '@/lib/api';
import * as XLSX from 'xlsx';
import AdminLayout from '@/components/AdminLayout';

interface ParsedCandidate {
  name: string;
  email: string;
  phone: string;
  datetime: string;
}

export default function AdminBulkRegister() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkRegistrationResponse | null>(null);

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
        const candidates: ParsedCandidate[] = jsonData.map((row, index) => {
          // Convert datetime if it's a number (Excel date serial)
          let datetime = row.datetime || row['date'] || row['scheduled_at'];
          if (typeof datetime === 'number') {
            // Excel date serial to ISO string
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + datetime * 86400000);
            datetime = date.toISOString().split('T')[0] + 'T10:00:00';
          } else if (datetime instanceof Date) {
            datetime = datetime.toISOString();
          } else if (typeof datetime === 'string') {
            // Try to parse as ISO string
            try {
              new Date(datetime);
            } catch {
              datetime = datetime + 'T10:00:00';
            }
          } else {
            throw new Error(`Row ${index + 2}: Invalid datetime format`);
          }

          return {
            name: String(row.name || row['Name'] || ''),
            email: String(row.email || row['Email'] || ''),
            phone: String(row.phone || row['Phone'] || ''),
            datetime: datetime,
          };
        });

        // Validate required fields
        const invalidRows = candidates.filter(
          (c) => !c.name || !c.email || !c.phone || !c.datetime
        );

        if (invalidRows.length > 0) {
          setError(`Rows with missing data: ${invalidRows.map((_, i) => i + 2).join(', ')}`);
        }

        setParsedData(candidates);
      } catch (err) {
        setError(`Failed to parse Excel file: ${(err as Error).message}`);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
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
      const response = await bulkRegisterCandidates(file);
      setResult(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Upload Excel File</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload an Excel file (.xlsx, .xls) with the following columns:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              <li><strong>name</strong> - Candidate full name</li>
              <li><strong>email</strong> - Email address</li>
              <li><strong>phone</strong> - Phone number (10 digits)</li>
              <li><strong>datetime</strong> - Interview date and time (ISO format or Excel date)</li>
            </ul>

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

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  ✓ Parsed {parsedData.length} candidate(s) from Excel file
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={loading || !file || parsedData.length === 0}
                className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60"
              >
                {loading ? 'Registering Candidates...' : `Register ${parsedData.length} Candidate(s)`}
              </button>
            </div>
          </div>

          {parsedData.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Preview Data</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Phone</th>
                      <th className="px-4 py-2 text-left">Datetime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((candidate, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{candidate.name}</td>
                        <td className="px-4 py-2">{candidate.email}</td>
                        <td className="px-4 py-2">{candidate.phone}</td>
                        <td className="px-4 py-2">{candidate.datetime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing first 10 of {parsedData.length} candidates
                  </p>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Registration Results</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Candidates:</span>
                  <span className="font-medium">{result.total}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="text-sm">Successfully Registered:</span>
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
                    {result.errors.length > 10 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        ... and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </AdminLayout>
  );
}


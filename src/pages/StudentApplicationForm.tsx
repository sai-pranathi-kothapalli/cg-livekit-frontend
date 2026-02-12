import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { getApplicationForm, uploadApplicationForm, type ApplicationFormResponse } from '@/lib/api';
import { debug } from '@/lib/debug';

export default function StudentApplicationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingForm, setExistingForm] = useState<ApplicationFormResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadExistingForm();
  }, []);


  const loadExistingForm = async () => {
    try {
      setChecking(true);

      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const formData = await Promise.race([
        getApplicationForm(),
        timeoutPromise
      ]) as ApplicationFormResponse;

      if (formData) {
        setExistingForm(formData);
        if (formData.status === 'submitted') {
          setSuccess(true);
        }
      }
    } catch (err) {
      debug.error('Failed to load form:', err);
      // Still allow the page to render even if form loading fails
    } finally {
      setChecking(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await uploadApplicationForm(file);
      if (response.success && response.form) {
        setExistingForm(response.form);
        setSuccess(true);
        if (response.extraction_error) {
          setError(`File uploaded, but auto-fill had issues: ${response.extraction_error}`);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </StudentLayout>
    );
  }

  const isSubmitted = existingForm && existingForm.status === 'submitted';

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resume</h1>
          <p className="text-muted-foreground mt-1">
            {isSubmitted
              ? 'Your resume has been submitted and processed'
              : 'Upload your resume PDF to proceed with interview slot selection'}
          </p>
        </div>

        {isSubmitted && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            ✅ Your application form was submitted on {new Date(existingForm.submitted_at || existingForm.created_at).toLocaleDateString()}.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span>✅ Resume processed successfully!</span>
                <button
                  onClick={() => navigate('/student/my-interviews')}
                  className="ml-4 font-semibold underline hover:text-green-700 bg-transparent border-none p-0 cursor-pointer"
                >
                  Go to My Interviews →
                </button>
              </div>
            </div>
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-semibold">Resume Summary</h2>
              {existingForm?.extracted_json_url && (
                <a
                  href={existingForm.extracted_json_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download Extracted Data
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 text-sm">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Personal Info</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{existingForm.full_name}</span>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {existingForm.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Upload Resume PDF</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload your resume as a PDF file. The system will extract your information automatically.
            </p>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-muted/30 relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                      setError(null);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="text-4xl">📄</div>
                  <div className="text-sm font-medium">
                    {file ? file.name : 'Click or drag PDF here to upload'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Only PDF files are supported
                  </div>
                </div>
              </div>

              {file && (
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setFile(null);
                      setError(null);
                    }}
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={loading}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {loading ? 'Uploading & Processing...' : 'Upload & Submit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

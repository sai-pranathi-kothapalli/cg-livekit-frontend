import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApplicationByToken } from '@/lib/api';

export default function UserApplicationView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || localStorage.getItem('application_token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      loadApplication();
    } else {
      // Try to load from localStorage draft
      const draft = localStorage.getItem('rrb_application_draft');
      if (draft) {
        try {
          setApplicationData(JSON.parse(draft));
          setLoading(false);
        } catch (e) {
          setError('Failed to load application data');
          setLoading(false);
        }
      } else {
        setError('No application found. Please submit an application first.');
        setLoading(false);
      }
    }
  }, [token]);

  const loadApplication = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getApplicationByToken(token);
      if (data) {
        setApplicationData(data.application_data || data);
      } else {
        setError('Application not found');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <p className="font-semibold">Error</p>
            <p className="mt-2">{error}</p>
            <button
              onClick={() => navigate('/user/application')}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Go to Application Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground">No application data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Application Details</h1>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Print
            </button>
            <button
              onClick={() => navigate('/user/application')}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Edit Application
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Details */}
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Personal Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="mt-1">{applicationData.fullName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Post</label>
                <p className="mt-1">{applicationData.post || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="mt-1">{applicationData.category || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="mt-1">{formatDate(applicationData.dateOfBirth)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="mt-1">{applicationData.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                <p className="mt-1">{applicationData.maritalStatus || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Aadhaar Number</label>
                <p className="mt-1">{applicationData.aadhaarNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                <p className="mt-1">{applicationData.panNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                <p className="mt-1">{applicationData.fatherName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mother's Name</label>
                <p className="mt-1">{applicationData.motherName || 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Address</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">Correspondence Address</h3>
                <p>{applicationData.correspondenceAddress1 || 'N/A'}</p>
                {applicationData.correspondenceAddress2 && <p>{applicationData.correspondenceAddress2}</p>}
                {applicationData.correspondenceAddress3 && <p>{applicationData.correspondenceAddress3}</p>}
                <p>
                  {applicationData.correspondenceDistrict || ''}, {applicationData.correspondenceState || ''} -{' '}
                  {applicationData.correspondencePincode || ''}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium">Permanent Address</h3>
                <p>{applicationData.permanentAddress1 || 'N/A'}</p>
                {applicationData.permanentAddress2 && <p>{applicationData.permanentAddress2}</p>}
                {applicationData.permanentAddress3 && <p>{applicationData.permanentAddress3}</p>}
                <p>
                  {applicationData.permanentDistrict || ''}, {applicationData.permanentState || ''} -{' '}
                  {applicationData.permanentPincode || ''}
                </p>
              </div>
            </div>
          </section>

          {/* Educational Qualification */}
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Educational Qualification</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">SSC/10th Standard</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Board</label>
                    <p>{applicationData.sscBoard || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Passing Date</label>
                    <p>{formatDate(applicationData.sscPassingDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Percentage</label>
                    <p>{applicationData.sscPercentage || 'N/A'}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Class</label>
                    <p>{applicationData.sscClass || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-medium">Graduation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Degree</label>
                    <p>{applicationData.graduationDegree || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">College</label>
                    <p>{applicationData.graduationCollege || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Specialization</label>
                    <p>{applicationData.graduationSpecialization || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Passing Date</label>
                    <p>{formatDate(applicationData.graduationPassingDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Percentage</label>
                    <p>{applicationData.graduationPercentage || 'N/A'}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Class</label>
                    <p>{applicationData.graduationClass || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact & Other Details */}
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Contact & Other Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                <p className="mt-1">{applicationData.mobileNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1">{applicationData.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Religion</label>
                <p className="mt-1">{applicationData.religion || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">State Applying For</label>
                <p className="mt-1">{applicationData.stateApplyingFor || 'N/A'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


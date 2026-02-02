import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { getApplicationForm, submitApplicationForm, uploadApplicationForm, type ApplicationFormResponse, type ApplicationFormSubmitRequest } from '@/lib/api';
import { debug } from '@/lib/debug';

export default function StudentApplicationForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fill' | 'upload'>('fill');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingForm, setExistingForm] = useState<ApplicationFormResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState<ApplicationFormSubmitRequest>({
    full_name: '',
    post: '',
    category: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    aadhaar_number: '',
    pan_number: '',
    father_name: '',
    mother_name: '',
    spouse_name: '',
    correspondence_address1: '',
    correspondence_address2: '',
    correspondence_address3: '',
    correspondence_state: '',
    correspondence_district: '',
    correspondence_pincode: '',
    permanent_address1: '',
    permanent_address2: '',
    permanent_address3: '',
    permanent_state: '',
    permanent_district: '',
    permanent_pincode: '',
    ssc_board: '',
    ssc_passing_date: '',
    ssc_percentage: '',
    ssc_class: '',
    graduation_degree: '',
    graduation_college: '',
    graduation_specialization: '',
    graduation_passing_date: '',
    graduation_percentage: '',
    graduation_class: '',
    religion: '',
    religious_minority: false,
    local_language_studied: false,
    local_language_name: '',
    computer_knowledge: false,
    computer_knowledge_details: '',
    languages_known: {
      english: { read: false, write: false, speak: false },
      telugu: { read: false, write: false, speak: false },
      hindi: { read: false, write: false, speak: false },
    },
    state_applying_for: '',
    regional_rural_bank: '',
    exam_center_preference1: '',
    exam_center_preference2: '',
    medium_of_paper: '',
  });

  useEffect(() => {
    loadExistingForm();
  }, []);

  const loadExistingForm = async () => {
    try {
      setChecking(true);
      const formData = await getApplicationForm();
      if (formData) {
        setExistingForm(formData);
        // Pre-fill form if exists
        setForm(prev => ({
          ...prev,
          full_name: formData.full_name,
          ...formData as any // Spread other fields
        }));

        if (formData.status === 'submitted') {
          setSuccess(true);
          setIsEditing(false); // Default to view mode for submitted forms
        } else {
          setIsEditing(true); // Drafts are editable by default
        }
      }
    } catch (err) {
      debug.error('Failed to load form:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    // List of mandatory text/select fields
    const mandatoryFields: (keyof ApplicationFormSubmitRequest)[] = [
      'full_name', 'post', 'category', 'date_of_birth', 'gender', 'marital_status',
      'aadhaar_number', 'pan_number', 'father_name', 'mother_name',
      'correspondence_address1', 'correspondence_state', 'correspondence_district', 'correspondence_pincode',
      'permanent_address1', 'permanent_state', 'permanent_district', 'permanent_pincode',
      'ssc_board', 'ssc_passing_date', 'ssc_percentage', 'ssc_class',
      'graduation_degree', 'graduation_college', 'graduation_specialization', 'graduation_passing_date', 'graduation_percentage', 'graduation_class',
      'religion', 'state_applying_for', 'regional_rural_bank', 'exam_center_preference1', 'exam_center_preference2', 'medium_of_paper'
    ];

    if (form.marital_status === 'Married') {
      mandatoryFields.push('spouse_name');
    }

    const missingFields = mandatoryFields.filter(f => !form[f]);
    if (missingFields.length > 0) {
      setError(`Please fill in all mandatory fields. Missing: ${missingFields.map(f => f.replace(/_/g, ' ')).join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      await submitApplicationForm(form);
      setSuccess(true);
      await loadExistingForm();

      // Optional: Redirect or just show success message
      // setTimeout(() => {
      //   navigate('/student/my-interviews');
      // }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
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
        const f = response.form as Record<string, unknown>;

        // Auto-fill every form field from extracted PDF data so the form matches the uploaded application
        setForm(prev => ({
          ...prev,
          full_name: (f.full_name as string) ?? prev.full_name,
          post: (f.post as string) ?? prev.post,
          category: (f.category as string) ?? prev.category,
          date_of_birth: (f.date_of_birth as string) ?? prev.date_of_birth,
          gender: (f.gender as string) ?? prev.gender,
          marital_status: (f.marital_status as string) ?? prev.marital_status,
          aadhaar_number: (f.aadhaar_number as string) ?? prev.aadhaar_number,
          pan_number: (f.pan_number as string) ?? prev.pan_number,
          father_name: (f.father_name as string) ?? prev.father_name,
          mother_name: (f.mother_name as string) ?? prev.mother_name,
          spouse_name: (f.spouse_name as string) ?? prev.spouse_name,
          correspondence_address1: (f.correspondence_address1 as string) ?? prev.correspondence_address1,
          correspondence_address2: (f.correspondence_address2 as string) ?? prev.correspondence_address2,
          correspondence_address3: (f.correspondence_address3 as string) ?? prev.correspondence_address3,
          correspondence_state: (f.correspondence_state as string) ?? prev.correspondence_state,
          correspondence_district: (f.correspondence_district as string) ?? prev.correspondence_district,
          correspondence_pincode: (f.correspondence_pincode as string) ?? prev.correspondence_pincode,
          permanent_address1: (f.permanent_address1 as string) ?? prev.permanent_address1,
          permanent_address2: (f.permanent_address2 as string) ?? prev.permanent_address2,
          permanent_address3: (f.permanent_address3 as string) ?? prev.permanent_address3,
          permanent_state: (f.permanent_state as string) ?? prev.permanent_state,
          permanent_district: (f.permanent_district as string) ?? prev.permanent_district,
          permanent_pincode: (f.permanent_pincode as string) ?? prev.permanent_pincode,
          ssc_board: (f.ssc_board as string) ?? prev.ssc_board,
          ssc_passing_date: (f.ssc_passing_date as string) ?? prev.ssc_passing_date,
          ssc_percentage: (f.ssc_percentage as string) ?? prev.ssc_percentage,
          ssc_class: (f.ssc_class as string) ?? prev.ssc_class,
          graduation_degree: (f.graduation_degree as string) ?? prev.graduation_degree,
          graduation_college: (f.graduation_college as string) ?? prev.graduation_college,
          graduation_specialization: (f.graduation_specialization as string) ?? prev.graduation_specialization,
          graduation_passing_date: (f.graduation_passing_date as string) ?? prev.graduation_passing_date,
          graduation_percentage: (f.graduation_percentage as string) ?? prev.graduation_percentage,
          graduation_class: (f.graduation_class as string) ?? prev.graduation_class,
          religion: (f.religion as string) ?? prev.religion,
          religious_minority: (f.religious_minority as boolean) ?? prev.religious_minority,
          local_language_studied: (f.local_language_studied as boolean) ?? prev.local_language_studied,
          local_language_name: (f.local_language_name as string) ?? prev.local_language_name,
          computer_knowledge: (f.computer_knowledge as boolean) ?? prev.computer_knowledge,
          computer_knowledge_details: (f.computer_knowledge_details as string) ?? prev.computer_knowledge_details,
          languages_known: (f.languages_known as typeof prev.languages_known) ?? prev.languages_known,
          state_applying_for: (f.state_applying_for as string) ?? prev.state_applying_for,
          regional_rural_bank: (f.regional_rural_bank as string) ?? prev.regional_rural_bank,
          exam_center_preference1: (f.exam_center_preference1 as string) ?? prev.exam_center_preference1,
          exam_center_preference2: (f.exam_center_preference2 as string) ?? prev.exam_center_preference2,
          medium_of_paper: (f.medium_of_paper as string) ?? prev.medium_of_paper,
        }));

        setSuccess(true);
        setActiveTab('fill'); // Switch to form view to show extracted data

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

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Application Form</h1>
          <p className="text-muted-foreground mt-1">
            Complete your application form to proceed with interview slot selection
          </p>
        </div>

        {existingForm && existingForm.status === 'submitted' && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            ✅ Your application form has been submitted on {new Date(existingForm.submitted_at || existingForm.created_at).toLocaleDateString()}.
            <br />
            You can still update details below if needed.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            ✅ {activeTab === 'upload' ? 'Form uploaded and processed!' : 'Application form submitted successfully!'}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('fill');
                setError(null);
                setSuccess(false);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'fill'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Fill Form Manually {existingForm && '(Edit)'}
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
                setError(null);
                setSuccess(false);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Upload PDF Form
            </button>
          </nav>
        </div>

        {/* View Mode */}
        {existingForm && existingForm.status === 'submitted' && !isEditing && activeTab === 'fill' && (
          <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-semibold">Application Details</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit Application
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium text-muted-foreground">Personal Details</h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="inline text-muted-foreground">Full Name: </dt> <dd className="inline font-medium">{form.full_name || '-'}</dd></div>
                  <div><dt className="inline text-muted-foreground">Post: </dt> <dd className="inline font-medium">{form.post || '-'}</dd></div>
                  <div><dt className="inline text-muted-foreground">Category: </dt> <dd className="inline font-medium">{form.category || '-'}</dd></div>
                  <div><dt className="inline text-muted-foreground">DOB: </dt> <dd className="inline font-medium">{form.date_of_birth || '-'}</dd></div>
                  <div><dt className="inline text-muted-foreground">Gender: </dt> <dd className="inline font-medium">{form.gender || '-'}</dd></div>
                  <div><dt className="inline text-muted-foreground">Marital Status: </dt> <dd className="inline font-medium">{form.marital_status || '-'}</dd></div>
                  <div><dt className="inline text-muted-foreground">Father's Name: </dt> <dd className="inline font-medium">{form.father_name || '-'}</dd></div>
                  <div><dt className="inline text-muted-foreground">Mother's Name: </dt> <dd className="inline font-medium">{form.mother_name || '-'}</dd></div>
                </dl>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-medium text-muted-foreground">Address</h3>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="inline text-muted-foreground">District: </dt> <dd className="inline font-medium">{form.correspondence_district || '-'}</dd></div>
                    <div><dt className="inline text-muted-foreground">State: </dt> <dd className="inline font-medium">{form.correspondence_state || '-'}</dd></div>
                    <div><dt className="inline text-muted-foreground">Pincode: </dt> <dd className="inline font-medium">{form.correspondence_pincode || '-'}</dd></div>
                  </dl>
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-muted-foreground">Education</h3>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="inline text-muted-foreground">Degree: </dt> <dd className="inline font-medium">{form.graduation_degree || '-'}</dd></div>
                    <div><dt className="inline text-muted-foreground">College: </dt> <dd className="inline font-medium">{form.graduation_college || '-'}</dd></div>
                    <div><dt className="inline text-muted-foreground">Specialization: </dt> <dd className="inline font-medium">{form.graduation_specialization || '-'}</dd></div>
                    <div><dt className="inline text-muted-foreground">Passing Date: </dt> <dd className="inline font-medium">{form.graduation_passing_date || '-'}</dd></div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground">
              <p>Note: This is a summary view. Click 'Edit Application' to view all fields and make changes.</p>
            </div>
          </div>
        )}

        {/* Tab Content - Form (Edit Mode) */}
        {(activeTab === 'fill' && (isEditing || !existingForm || existingForm.status !== 'submitted')) && (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            {existingForm && existingForm.status === 'submitted' && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Cancel Editing
                </button>
              </div>
            )}
            <h2 className="text-xl font-semibold">Personal Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Post *</label>
                <input
                  type="text"
                  value={form.post}
                  onChange={(e) => setForm({ ...form, post: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Officer Scale-I"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="OBC">OBC (NCL)</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Date of Birth *</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Marital Status *</label>
                <select
                  value={form.marital_status}
                  onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Unmarried">Unmarried</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Aadhaar Number *</label>
                <input
                  type="text"
                  value={form.aadhaar_number}
                  onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="XXXXXXXXXXXX"
                  maxLength={12}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">PAN Number *</label>
                <input
                  type="text"
                  value={form.pan_number}
                  onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Father's Name *</label>
                <input
                  type="text"
                  value={form.father_name}
                  onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Mother's Name *</label>
                <input
                  type="text"
                  value={form.mother_name}
                  onChange={(e) => setForm({ ...form, mother_name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              {form.marital_status === 'Married' && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Spouse's Name</label>
                  <input
                    type="text"
                    value={form.spouse_name}
                    onChange={(e) => setForm({ ...form, spouse_name: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <h2 className="text-xl font-semibold mt-8">Address Details</h2>

            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-lg font-medium">Correspondence Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">Address Line 1 *</label>
                    <input
                      type="text"
                      value={form.correspondence_address1}
                      onChange={(e) => setForm({ ...form, correspondence_address1: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Address Line 2</label>
                    <input
                      type="text"
                      value={form.correspondence_address2}
                      onChange={(e) => setForm({ ...form, correspondence_address2: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Address Line 3</label>
                    <input
                      type="text"
                      value={form.correspondence_address3}
                      onChange={(e) => setForm({ ...form, correspondence_address3: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">State *</label>
                    <input
                      type="text"
                      value={form.correspondence_state}
                      onChange={(e) => setForm({ ...form, correspondence_state: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">District *</label>
                    <input
                      type="text"
                      value={form.correspondence_district}
                      onChange={(e) => setForm({ ...form, correspondence_district: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Pincode *</label>
                    <input
                      type="text"
                      value={form.correspondence_pincode}
                      onChange={(e) => setForm({ ...form, correspondence_pincode: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-medium">Permanent Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">Address Line 1 *</label>
                    <input
                      type="text"
                      value={form.permanent_address1}
                      onChange={(e) => setForm({ ...form, permanent_address1: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Address Line 2</label>
                    <input
                      type="text"
                      value={form.permanent_address2}
                      onChange={(e) => setForm({ ...form, permanent_address2: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Address Line 3</label>
                    <input
                      type="text"
                      value={form.permanent_address3}
                      onChange={(e) => setForm({ ...form, permanent_address3: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">State *</label>
                    <input
                      type="text"
                      value={form.permanent_state}
                      onChange={(e) => setForm({ ...form, permanent_state: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">District *</label>
                    <input
                      type="text"
                      value={form.permanent_district}
                      onChange={(e) => setForm({ ...form, permanent_district: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Pincode *</label>
                    <input
                      type="text"
                      value={form.permanent_pincode}
                      onChange={(e) => setForm({ ...form, permanent_pincode: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mt-8">Educational Qualification</h2>

            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-lg font-medium">SSC/10th Standard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Board *</label>
                    <input
                      type="text"
                      value={form.ssc_board}
                      onChange={(e) => setForm({ ...form, ssc_board: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Passing Date *</label>
                    <input
                      type="date"
                      value={form.ssc_passing_date}
                      onChange={(e) => setForm({ ...form, ssc_passing_date: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Percentage *</label>
                    <input
                      type="text"
                      value={form.ssc_percentage}
                      onChange={(e) => setForm({ ...form, ssc_percentage: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g., 75.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Class *</label>
                    <select
                      value={form.ssc_class}
                      onChange={(e) => setForm({ ...form, ssc_class: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select Class</option>
                      <option value="First Class">First Class</option>
                      <option value="Second Class">Second Class</option>
                      <option value="Distinction">Distinction</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-medium">Graduation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Degree *</label>
                    <input
                      type="text"
                      value={form.graduation_degree}
                      onChange={(e) => setForm({ ...form, graduation_degree: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g., Bachelor of Science (B.Sc.)"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">College *</label>
                    <input
                      type="text"
                      value={form.graduation_college}
                      onChange={(e) => setForm({ ...form, graduation_college: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Specialization *</label>
                    <input
                      type="text"
                      value={form.graduation_specialization}
                      onChange={(e) => setForm({ ...form, graduation_specialization: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g., Electronics"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Passing Date *</label>
                    <input
                      type="date"
                      value={form.graduation_passing_date}
                      onChange={(e) => setForm({ ...form, graduation_passing_date: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Percentage *</label>
                    <input
                      type="text"
                      value={form.graduation_percentage}
                      onChange={(e) => setForm({ ...form, graduation_percentage: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g., 74.10"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Class *</label>
                    <select
                      value={form.graduation_class}
                      onChange={(e) => setForm({ ...form, graduation_class: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select Class</option>
                      <option value="First Class">First Class</option>
                      <option value="Second Class">Second Class</option>
                      <option value="Distinction">Distinction</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mt-8">Other Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Religion *</label>
                <input
                  type="text"
                  value={form.religion}
                  onChange={(e) => setForm({ ...form, religion: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="religious_minority"
                  checked={form.religious_minority}
                  onChange={(e) => setForm({ ...form, religious_minority: e.target.checked })}
                  className="rounded border-input"
                />
                <label htmlFor="religious_minority" className="text-sm font-medium">
                  Do you belong to Religious Minority Community?
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="local_language"
                  checked={form.local_language_studied}
                  onChange={(e) => setForm({ ...form, local_language_studied: e.target.checked })}
                  className="rounded border-input"
                />
                <label htmlFor="local_language" className="text-sm font-medium">
                  Whether local language of the state selected was studied?
                </label>
              </div>

              {form.local_language_studied && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Local Language Name</label>
                  <input
                    type="text"
                    value={form.local_language_name}
                    onChange={(e) => setForm({ ...form, local_language_name: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g., Telugu"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="computer_knowledge"
                  checked={form.computer_knowledge}
                  onChange={(e) => setForm({ ...form, computer_knowledge: e.target.checked })}
                  className="rounded border-input"
                />
                <label htmlFor="computer_knowledge" className="text-sm font-medium">
                  Do you have Operating and working knowledge in computer systems?
                </label>
              </div>

              {form.computer_knowledge && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Computer Knowledge Details</label>
                  <input
                    type="text"
                    value={form.computer_knowledge_details}
                    onChange={(e) => setForm({ ...form, computer_knowledge_details: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g., Degree in Computer Operations"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Languages Known</h3>
              {Object.entries(form.languages_known || {}).map(([lang, skills]) => (
                <div key={lang} className="rounded-md border border-border bg-background p-4">
                  <label className="mb-2 block text-sm font-medium capitalize">{lang}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={skills.read}
                        onChange={(e) => {
                          const updated = { ...form.languages_known };
                          updated[lang] = { ...skills, read: e.target.checked };
                          setForm({ ...form, languages_known: updated });
                        }}
                        className="rounded border-input"
                      />
                      <span className="text-sm">Read</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={skills.write}
                        onChange={(e) => {
                          const updated = { ...form.languages_known };
                          updated[lang] = { ...skills, write: e.target.checked };
                          setForm({ ...form, languages_known: updated });
                        }}
                        className="rounded border-input"
                      />
                      <span className="text-sm">Write</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={skills.speak}
                        onChange={(e) => {
                          const updated = { ...form.languages_known };
                          updated[lang] = { ...skills, speak: e.target.checked };
                          setForm({ ...form, languages_known: updated });
                        }}
                        className="rounded border-input"
                      />
                      <span className="text-sm">Speak</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-semibold mt-8">Application Specific</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">State/UT for which you want to apply *</label>
                <input
                  type="text"
                  value={form.state_applying_for}
                  onChange={(e) => setForm({ ...form, state_applying_for: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Telangana"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Regional Rural Bank *</label>
                <input
                  type="text"
                  value={form.regional_rural_bank}
                  onChange={(e) => setForm({ ...form, regional_rural_bank: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Telangana Grameena Bank"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Exam Center Preference 1 *</label>
                <input
                  type="text"
                  value={form.exam_center_preference1}
                  onChange={(e) => setForm({ ...form, exam_center_preference1: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Hyderabad"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Exam Center Preference 2 *</label>
                <input
                  type="text"
                  value={form.exam_center_preference2}
                  onChange={(e) => setForm({ ...form, exam_center_preference2: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Khammam"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Medium of Paper *</label>
                <input
                  type="text"
                  value={form.medium_of_paper}
                  onChange={(e) => setForm({ ...form, medium_of_paper: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., English and Telugu"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/student/my-interviews')}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !form.full_name}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Application Form'}
              </button>
            </div>
          </form>
        )}

        {/* Tab Content - Upload Mode */}
        {activeTab === 'upload' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Upload Application Form PDF</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload your completed RRB PO application form as a PDF file. The system will extract the information automatically.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Select PDF File</label>
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {file && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/student/my-interviews')}
                  className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={loading || !file}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60"
                >
                  {loading ? 'Uploading...' : 'Upload & Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}


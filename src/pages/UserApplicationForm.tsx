import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { debug } from '@/lib/debug';

interface RRBFormData {
  // Personal Details
  fullName: string;
  post: string;
  category: string;
  dateOfBirth: string;
  ageCompleted: string;
  gender: string;
  maritalStatus: string;
  aadhaarNumber: string;
  panNumber: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  
  // Address - Correspondence
  correspondenceAddress1: string;
  correspondenceAddress2: string;
  correspondenceAddress3: string;
  correspondenceState: string;
  correspondenceDistrict: string;
  correspondencePincode: string;
  
  // Address - Permanent
  permanentAddress1: string;
  permanentAddress2: string;
  permanentAddress3: string;
  permanentState: string;
  permanentDistrict: string;
  permanentPincode: string;
  
  // Contact Details
  mobileNumber: string;
  alternativeNumber: string;
  email: string;
  
  // Educational Qualification - SSC
  sscBoard: string;
  sscPassingDate: string;
  sscPercentage: string;
  sscClass: string;
  
  // Educational Qualification - Graduation
  graduationDegree: string;
  graduationCollege: string;
  graduationSpecialization: string;
  graduationPassingDate: string;
  graduationPercentage: string;
  graduationClass: string;
  
  // Other Details
  religion: string;
  religiousMinority: boolean;
  localLanguageStudied: boolean;
  localLanguageName: string;
  computerKnowledge: boolean;
  computerKnowledgeDetails: string;
  
  // Application Specific
  stateApplyingFor: string;
  regionalRuralBank: string;
  examCenterPreference1: string;
  examCenterPreference2: string;
  mediumOfPaper: string;
  
  // Languages Known
  languagesKnown: {
    [key: string]: {
      read: boolean;
      write: boolean;
      speak: boolean;
    };
  };
  
  // Interview Schedule
  interviewDate: string;
  interviewHour: string;
  interviewMinute: string;
  interviewAmpm: 'AM' | 'PM';
  
  // File Upload
  applicationFile: File | null;
}

type FormMode = 'fill' | 'upload';

export default function UserApplicationForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<FormMode>('fill');
  const [currentSection, setCurrentSection] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [interviewUrl, setInterviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<RRBFormData>({
    fullName: '',
    post: 'Officer Scale-I',
    category: '',
    dateOfBirth: '',
    ageCompleted: '',
    gender: '',
    maritalStatus: '',
    aadhaarNumber: '',
    panNumber: '',
    fatherName: '',
    motherName: '',
    spouseName: '',
    correspondenceAddress1: '',
    correspondenceAddress2: '',
    correspondenceAddress3: '',
    correspondenceState: '',
    correspondenceDistrict: '',
    correspondencePincode: '',
    permanentAddress1: '',
    permanentAddress2: '',
    permanentAddress3: '',
    permanentState: '',
    permanentDistrict: '',
    permanentPincode: '',
    mobileNumber: '',
    alternativeNumber: '',
    email: '',
    sscBoard: '',
    sscPassingDate: '',
    sscPercentage: '',
    sscClass: '',
    graduationDegree: '',
    graduationCollege: '',
    graduationSpecialization: '',
    graduationPassingDate: '',
    graduationPercentage: '',
    graduationClass: '',
    religion: '',
    religiousMinority: false,
    localLanguageStudied: false,
    localLanguageName: '',
    computerKnowledge: false,
    computerKnowledgeDetails: '',
    stateApplyingFor: '',
    regionalRuralBank: '',
    examCenterPreference1: '',
    examCenterPreference2: '',
    mediumOfPaper: 'English',
    languagesKnown: {
      English: { read: false, write: false, speak: false },
      Telugu: { read: false, write: false, speak: false },
    },
    interviewDate: '',
    interviewHour: '10',
    interviewMinute: '00',
    interviewAmpm: 'AM',
    applicationFile: null,
  });

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rrb_application_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormData(draft);
      } catch (e) {
        debug.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('rrb_application_draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const updateFormData = (field: keyof RRBFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const getDateTimeString = (): string => {
    if (!formData.interviewDate) return '';
    
    let hour24 = parseInt(formData.interviewHour, 10);
    if (formData.interviewAmpm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (formData.interviewAmpm === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const hour24Str = String(hour24).padStart(2, '0');
    const minuteStr = formData.interviewMinute.padStart(2, '0');
    const localDate = new Date(`${formData.interviewDate}T${hour24Str}:${minuteStr}`);
    
    const offsetMinutes = localDate.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:00${offsetStr}`;
  };

  const handleFileUpload = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.mobileNumber) {
      setError('Please fill in all required fields: Name, Email, and Phone');
      setStatus('error');
      return;
    }

    if (formData.mobileNumber.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      setStatus('error');
      return;
    }

    if (!formData.applicationFile) {
      setError('Please select an application file');
      setStatus('error');
      return;
    }

    const datetime = getDateTimeString();
    if (!datetime) {
      setError('Please select interview date and time');
      setStatus('error');
      return;
    }

    // Validate datetime is at least 5 minutes in future
    const selectedDateTime = new Date(datetime);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (selectedDateTime <= fiveMinutesFromNow) {
      setError('Please select a date and time at least 5 minutes from now');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const { uploadApplication, scheduleInterview } = await import('@/lib/api');
      
      const uploadData = await uploadApplication(formData.applicationFile);
      
      const data = await scheduleInterview({
        name: formData.fullName,
        email: formData.email,
        phone: formData.mobileNumber,
        datetime,
        applicationUrl: uploadData.applicationUrl,
        applicationText: uploadData.applicationText ?? undefined,
      });

      setInterviewUrl(data.interviewUrl ?? null);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      // Handle different error formats
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else if (err?.detail) {
        setError(err.detail);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('An error occurred while uploading. Please try again.');
      }
    }
  };

  const handleFormSubmit = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.mobileNumber) {
      setError('Please fill in all required fields');
      setStatus('error');
      return;
    }

    if (formData.mobileNumber.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      setStatus('error');
      return;
    }

    const datetime = getDateTimeString();
    if (!datetime) {
      setError('Please select interview date and time');
      setStatus('error');
      return;
    }

    // Validate datetime is at least 5 minutes in future
    const selectedDateTime = new Date(datetime);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (selectedDateTime <= fiveMinutesFromNow) {
      setError('Please select a date and time at least 5 minutes from now');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // If file is uploaded, use file upload flow
      if (formData.applicationFile) {
        await handleFileUpload();
        return;
      }

      // Submit form data directly using API
      const { submitRRBApplication } = await import('@/lib/api');
      
      const data = await submitRRBApplication({
        ...formData,
        interviewDate: formData.interviewDate,
        interviewHour: formData.interviewHour,
        interviewMinute: formData.interviewMinute,
        interviewAmpm: formData.interviewAmpm,
      });

      setInterviewUrl(data.interviewUrl ?? null);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      // Handle different error formats
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else if (err?.detail) {
        setError(err.detail);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('An error occurred while submitting. Please try again.');
      }
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  if (mode === 'upload') {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Upload Application</h1>
            <button
              onClick={() => setMode('fill')}
              className="text-sm text-blue-600 hover:underline"
            >
              Switch to Fill Form
            </button>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => updateFormData('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="10 digit phone number"
                  maxLength={10}
                  required
                />
                {formData.mobileNumber && formData.mobileNumber.length < 10 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formData.mobileNumber.length}/10 digits
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Upload Application File *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        setError('Application file must be less than 5MB');
                        return;
                      }
                      // Validate file type
                      const validTypes = [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      ];
                      if (!validTypes.includes(file.type)) {
                        setError('Please upload a PDF or DOC/DOCX file');
                        return;
                      }
                      updateFormData('applicationFile', file);
                      setError(null);
                    }
                  }}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX (Max 5MB)
                </p>
                {formData.applicationFile && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Selected: {formData.applicationFile.name} ({(formData.applicationFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Schedule Interview *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Date</label>
                    <input
                      type="date"
                      value={formData.interviewDate}
                      onChange={(e) => updateFormData('interviewDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Hour</label>
                      <select
                        value={formData.interviewHour}
                        onChange={(e) => updateFormData('interviewHour', e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {hours.map((h) => (
                          <option key={h} value={h}>
                            {parseInt(h, 10)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Minute</label>
                      <select
                        value={formData.interviewMinute}
                        onChange={(e) => updateFormData('interviewMinute', e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {minutes.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">AM/PM</label>
                      <select
                        value={formData.interviewAmpm}
                        onChange={(e) => updateFormData('interviewAmpm', e.target.value as 'AM' | 'PM')}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFileUpload}
                disabled={status === 'loading' || !formData.applicationFile || !formData.fullName || !formData.email || !formData.mobileNumber || formData.mobileNumber.length !== 10 || !formData.interviewDate}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {status === 'loading' ? 'Uploading...' : 'Upload and Schedule Interview'}
              </button>

              {status === 'success' && interviewUrl && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  <p className="font-semibold">✅ Interview scheduled successfully!</p>
                  <a
                    href={interviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-xs underline"
                  >
                    {interviewUrl}
                  </a>
                </div>
              )}

              {status === 'error' && error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fill Form Mode - Multi-section form
  const sections = [
    { id: 1, title: 'Personal Details' },
    { id: 2, title: 'Address' },
    { id: 3, title: 'Educational Qualification' },
    { id: 4, title: 'Contact & Other Details' },
    { id: 5, title: 'Application Details' },
    { id: 6, title: 'Schedule Interview' },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">RRB PO Application Form</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('upload')}
              className="text-sm text-blue-600 hover:underline"
            >
              Upload Application Instead
            </button>
            <button
              onClick={() => navigate('/user/application/view')}
              className="text-sm text-green-600 hover:underline"
            >
              View Saved Form
            </button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="mb-6 flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(section.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                currentSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-card text-foreground hover:bg-muted'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {/* Section 1: Personal Details */}
          {currentSection === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Personal Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateFormData('fullName', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Post *</label>
                  <select
                    value={formData.post}
                    onChange={(e) => updateFormData('post', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Officer Scale-I">Officer Scale-I</option>
                    <option value="Officer Scale-II">Officer Scale-II</option>
                    <option value="Officer Scale-III">Officer Scale-III</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateFormData('gender', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Marital Status *</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => updateFormData('maritalStatus', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Unmarried">Unmarried</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Aadhaar Number *</label>
                  <input
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={(e) => updateFormData('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    maxLength={12}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">PAN Number *</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => updateFormData('panNumber', e.target.value.toUpperCase().slice(0, 10))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Father's Name *</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => updateFormData('fatherName', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mother's Name *</label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => updateFormData('motherName', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                {formData.maritalStatus === 'Married' && (
                  <div>
                    <label className="text-sm font-medium">Spouse's Name</label>
                    <input
                      type="text"
                      value={formData.spouseName}
                      onChange={(e) => updateFormData('spouseName', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Address */}
          {currentSection === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Address for Correspondence</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Address Line 1 *</label>
                  <input
                    type="text"
                    value={formData.correspondenceAddress1}
                    onChange={(e) => updateFormData('correspondenceAddress1', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.correspondenceAddress2}
                    onChange={(e) => updateFormData('correspondenceAddress2', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address Line 3</label>
                  <input
                    type="text"
                    value={formData.correspondenceAddress3}
                    onChange={(e) => updateFormData('correspondenceAddress3', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">State *</label>
                    <input
                      type="text"
                      value={formData.correspondenceState}
                      onChange={(e) => updateFormData('correspondenceState', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">District *</label>
                    <input
                      type="text"
                      value={formData.correspondenceDistrict}
                      onChange={(e) => updateFormData('correspondenceDistrict', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pincode *</label>
                    <input
                      type="text"
                      value={formData.correspondencePincode}
                      onChange={(e) => updateFormData('correspondencePincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold">Permanent Address</h3>
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        formData.correspondenceAddress1 === formData.permanentAddress1 &&
                        formData.correspondenceState === formData.permanentState
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData('permanentAddress1', formData.correspondenceAddress1);
                          updateFormData('permanentAddress2', formData.correspondenceAddress2);
                          updateFormData('permanentAddress3', formData.correspondenceAddress3);
                          updateFormData('permanentState', formData.correspondenceState);
                          updateFormData('permanentDistrict', formData.correspondenceDistrict);
                          updateFormData('permanentPincode', formData.correspondencePincode);
                        }
                      }}
                    />
                    <span className="text-sm">Same as correspondence address</span>
                  </label>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Address Line 1 *</label>
                    <input
                      type="text"
                      value={formData.permanentAddress1}
                      onChange={(e) => updateFormData('permanentAddress1', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.permanentAddress2}
                      onChange={(e) => updateFormData('permanentAddress2', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address Line 3</label>
                    <input
                      type="text"
                      value={formData.permanentAddress3}
                      onChange={(e) => updateFormData('permanentAddress3', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">State *</label>
                      <input
                        type="text"
                        value={formData.permanentState}
                        onChange={(e) => updateFormData('permanentState', e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">District *</label>
                      <input
                        type="text"
                        value={formData.permanentDistrict}
                        onChange={(e) => updateFormData('permanentDistrict', e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Pincode *</label>
                      <input
                        type="text"
                        value={formData.permanentPincode}
                        onChange={(e) => updateFormData('permanentPincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Educational Qualification */}
          {currentSection === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Educational Qualification</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SSC/10th Standard</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Board/University *</label>
                    <input
                      type="text"
                      value={formData.sscBoard}
                      onChange={(e) => updateFormData('sscBoard', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Passing *</label>
                    <input
                      type="date"
                      value={formData.sscPassingDate}
                      onChange={(e) => updateFormData('sscPassingDate', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Percentage *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sscPercentage}
                      onChange={(e) => updateFormData('sscPercentage', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Class *</label>
                    <select
                      value={formData.sscClass}
                      onChange={(e) => updateFormData('sscClass', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Class</option>
                      <option value="First Class">First Class</option>
                      <option value="Second Class">Second Class</option>
                      <option value="Third Class">Third Class</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Graduation</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Degree *</label>
                    <input
                      type="text"
                      value={formData.graduationDegree}
                      onChange={(e) => updateFormData('graduationDegree', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g., B.Sc., B.A., B.Com"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">College/University *</label>
                    <input
                      type="text"
                      value={formData.graduationCollege}
                      onChange={(e) => updateFormData('graduationCollege', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Specialization/Subject</label>
                    <input
                      type="text"
                      value={formData.graduationSpecialization}
                      onChange={(e) => updateFormData('graduationSpecialization', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Passing *</label>
                    <input
                      type="date"
                      value={formData.graduationPassingDate}
                      onChange={(e) => updateFormData('graduationPassingDate', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Percentage *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.graduationPercentage}
                      onChange={(e) => updateFormData('graduationPercentage', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Class *</label>
                    <select
                      value={formData.graduationClass}
                      onChange={(e) => updateFormData('graduationClass', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Class</option>
                      <option value="First Class">First Class</option>
                      <option value="Second Class">Second Class</option>
                      <option value="Third Class">Third Class</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Contact & Other Details */}
          {currentSection === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Contact & Other Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Mobile Number *</label>
                    <input
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) => updateFormData('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Alternative Number</label>
                    <input
                      type="tel"
                      value={formData.alternativeNumber}
                      onChange={(e) => updateFormData('alternativeNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      maxLength={10}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Religion *</label>
                    <select
                      value={formData.religion}
                      onChange={(e) => updateFormData('religion', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Religion</option>
                      <option value="Hinduism">Hinduism</option>
                      <option value="Islam">Islam</option>
                      <option value="Christianity">Christianity</option>
                      <option value="Sikhism">Sikhism</option>
                      <option value="Buddhism">Buddhism</option>
                      <option value="Jainism">Jainism</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.religiousMinority}
                        onChange={(e) => updateFormData('religiousMinority', e.target.checked)}
                      />
                      <span className="text-sm">Do you belong to Religious Minority Community?</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.localLanguageStudied}
                        onChange={(e) => updateFormData('localLanguageStudied', e.target.checked)}
                      />
                      <span className="text-sm">Did you study local language in standard VIII or above?</span>
                    </label>
                    {formData.localLanguageStudied && (
                      <input
                        type="text"
                        value={formData.localLanguageName}
                        onChange={(e) => updateFormData('localLanguageName', e.target.value)}
                        placeholder="Language name"
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.computerKnowledge}
                        onChange={(e) => updateFormData('computerKnowledge', e.target.checked)}
                      />
                      <span className="text-sm">Do you have Operating and working knowledge in computer systems?</span>
                    </label>
                    {formData.computerKnowledge && (
                      <input
                        type="text"
                        value={formData.computerKnowledgeDetails}
                        onChange={(e) => updateFormData('computerKnowledgeDetails', e.target.value)}
                        placeholder="Details (e.g., Degree in Computer Operations)"
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Languages Known</label>
                  {Object.entries(formData.languagesKnown).map(([lang, skills]) => (
                    <div key={lang} className="flex items-center gap-4 rounded-md border border-input p-3">
                      <span className="w-24 text-sm font-medium">{lang}</span>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={skills.read}
                          onChange={(e) => {
                            const newLang = { ...skills, read: e.target.checked };
                            updateFormData('languagesKnown', { ...formData.languagesKnown, [lang]: newLang });
                          }}
                        />
                        <span className="text-xs">Read</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={skills.write}
                          onChange={(e) => {
                            const newLang = { ...skills, write: e.target.checked };
                            updateFormData('languagesKnown', { ...formData.languagesKnown, [lang]: newLang });
                          }}
                        />
                        <span className="text-xs">Write</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={skills.speak}
                          onChange={(e) => {
                            const newLang = { ...skills, speak: e.target.checked };
                            updateFormData('languagesKnown', { ...formData.languagesKnown, [lang]: newLang });
                          }}
                        />
                        <span className="text-xs">Speak</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Application Details */}
          {currentSection === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Application Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">State/UT for which you want to apply *</label>
                  <input
                    type="text"
                    value={formData.stateApplyingFor}
                    onChange={(e) => updateFormData('stateApplyingFor', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Regional Rural Bank *</label>
                  <input
                    type="text"
                    value={formData.regionalRuralBank}
                    onChange={(e) => updateFormData('regionalRuralBank', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Exam Center Preference 1 *</label>
                  <input
                    type="text"
                    value={formData.examCenterPreference1}
                    onChange={(e) => updateFormData('examCenterPreference1', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Exam Center Preference 2</label>
                  <input
                    type="text"
                    value={formData.examCenterPreference2}
                    onChange={(e) => updateFormData('examCenterPreference2', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Medium of Paper *</label>
                  <select
                    value={formData.mediumOfPaper}
                    onChange={(e) => updateFormData('mediumOfPaper', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                    <option value="English and Telugu">English and Telugu</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Schedule Interview */}
          {currentSection === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Schedule Interview</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Interview Date *</label>
                  <input
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => updateFormData('interviewDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Hour</label>
                    <select
                      value={formData.interviewHour}
                      onChange={(e) => updateFormData('interviewHour', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>
                          {parseInt(h, 10)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minute</label>
                    <select
                      value={formData.interviewMinute}
                      onChange={(e) => updateFormData('interviewMinute', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">AM/PM</label>
                    <select
                      value={formData.interviewAmpm}
                      onChange={(e) => updateFormData('interviewAmpm', e.target.value as 'AM' | 'PM')}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentSection(Math.max(1, currentSection - 1))}
              disabled={currentSection === 1}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            {currentSection < sections.length ? (
              <button
                onClick={() => setCurrentSection(Math.min(sections.length, currentSection + 1))}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFormSubmit}
                disabled={status === 'loading'}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
              >
                {status === 'loading' ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>

          {status === 'error' && error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


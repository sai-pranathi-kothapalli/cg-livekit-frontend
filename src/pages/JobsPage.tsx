import { useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';

export default function JobsPage() {
  const navigate = useNavigate();

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="w-full max-w-3xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Interview Opportunity
          </h1>
          <p className="text-sm text-muted-foreground">Codegnan Team</p>
          <p>
            We are conducting interviews for qualified candidates.
            This is an excellent opportunity to demonstrate your skills,
            experience, and suitability for the role.
          </p>
        </section>

        <section className="w-full max-w-3xl space-y-3">
          <h2 className="text-xl font-semibold">Interview Preparation Areas</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li><strong>Personal Introduction:</strong> Your background, education, and motivation</li>
            <li><strong>Technical Knowledge:</strong> Domain expertise and relevant skills</li>
            <li><strong>Problem Solving:</strong> Scenarios and practical thinking</li>
            <li><strong>Domain Knowledge:</strong> Fundamentals and industry awareness</li>
          </ul>
        </section>

        <button
          type="button"
          onClick={() => navigate('/student/apply')}
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          Apply for this position
        </button>
      </div>
    </StudentLayout>
  );
}

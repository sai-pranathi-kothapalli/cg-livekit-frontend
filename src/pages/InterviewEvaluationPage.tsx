import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getEvaluation, type EvaluationResponse, API_BASE_URL } from '@/lib/api';
import { 
  ClipboardList, 
  AlertTriangle, 
  FileText, 
  Terminal, 
  Activity, 
  Search,
  MessageSquare,
  Brain,
  Handshake,
  ShieldCheck,
  Keyboard,
  Flag,
  Sparkles,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

type EvaluationData = EvaluationResponse;

// ─── colour helpers ────────────────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 8) return '#60a5fa'; // Indigo Blue
  if (score >= 6) return '#94a3b8'; // Slate
  if (score >= 4) return '#facc15'; // Amber (Muted)
  return '#f87171'; // Red (Muted)
}

function getScoreLabel(score: number) {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Needs Improvement';
}

// ─── feedback parser helpers ──────────────────────────────────────────────────


/**
 * Extract bullet-style issues from the feedback that are relevant to a skill.
 * Falls back to score-based defaults if nothing found.
 */
function extractIssues(raw: string, skill: 'communication' | 'technical' | 'problem_solving' | 'coding', score: number): string[] {
  const keywords: Record<string, string[]> = {
    communication: ['communication', 'clarity', 'articulate', 'explain', 'express', 'verbal', 'coherent', 'response'],
    technical: ['technical', 'knowledge', 'concept', 'framework', 'system', 'programming'],
    problem_solving: ['problem', 'solving', 'approach', 'logic', 'reasoning', 'think', 'solution', 'analysis'],
    coding: ['code', 'algorithm', 'syntax', 'debugging', 'implementation', 'logic', 'efficiency', 'structure'],
  };

  const kws = keywords[skill];
  // Collect bullet lines from the feedback that mention this skill's keywords
  const lines = raw
    .split('\n')
    .filter(l => l.trim().match(/^[-*•]/) || l.trim().match(/^\d+\./))
    .map(l => l.replace(/^[-*•\d.]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim())
    .filter(l => kws.some(kw => l.toLowerCase().includes(kw)) && l.length > 5 && l.length < 150);

  if (lines.length >= 1) return lines.slice(0, 3);

  // Score-based defaults
  if (score >= 8) {
    return {
      communication: ['Clear and structured responses', 'Good use of examples', 'Active engagement'],
      technical: ['Strong conceptual accuracy', 'Demonstrated depth', 'Handled edge cases well'],
      problem_solving: ['Systematic approach', 'Clear reasoning', 'Considered trade-offs'],
      coding: ['Clean and readable code structure', 'Efficient algorithm selection', 'Proper error handling']
    }[skill];
  }
  if (score >= 6) {
    return {
      communication: ['Mostly clear with minor gaps', 'Some answers lacked depth', 'Generally good engagement'],
      technical: ['Core concepts understood', 'Minor knowledge gaps', 'Could improve on edge cases'],
      problem_solving: ['Reasonable approach used', 'Some logical gaps', 'Needs more structured thinking'],
      coding: ['Functional code with minor errors', 'Sub-optimal logic in places', 'Minimal comments or documentation']
    }[skill];
  }
  if (score >= 4) {
    return {
      communication: ['Unclear explanations in several answers', 'Hesitation noted', 'Needed prompting to elaborate'],
      technical: ['Surface-level knowledge shown', 'Struggled with advanced topics', 'Key concepts were missed'],
      problem_solving: ['Inconsistent problem approach', 'Skipped intermediate steps', 'Limited reasoning shown'],
      coding: ['Frequent syntax or logic errors', 'Struggled to implement basic requirements', 'Poor code organization']
    }[skill];
  }
  return {
    communication: ['Unable to clearly express ideas', 'Fragmented or off-topic responses', 'No coherent structure observed'],
    technical: ['Unable to answer core technical questions', 'Fundamental gaps detected', 'No domain knowledge shown'],
    problem_solving: ['No structured problem approach', 'Could not break down problems', 'Avoided analytical questions'],
    coding: ['Could not write functional code', 'Lack of basic programming logic', 'Failed to understand coding tasks']
  }[skill];
}

/**
 * Try to pull a concrete example sentence from the feedback related to the skill.
 */
function extractExample(raw: string, skill: 'communication' | 'technical' | 'problem_solving' | 'coding', score: number): string {
  const keywords: Record<string, string[]> = {
    communication: ['explain', 'said', 'responded', 'stated', 'express', 'answer', 'articulate'],
    technical: ['technical', 'concept', 'knowledge', 'implement', 'SQL', 'framework'],
    problem_solving: ['approach', 'solve', 'solution', 'logic', 'reasoning', 'problem', 'analysis'],
    coding: ['code', 'algorithm', 'syntax', 'debugging', 'implementation', 'variable', 'function'],
  };

  const kws = keywords[skill];
  const quoted = raw.match(/"([^"]{15,120})"/g);
  if (quoted) {
    const match = quoted.find(q => kws.some(kw => q.toLowerCase().includes(kw)));
    if (match) return `"${match.replace(/^"|"$/g, '')}"`;
  }

  // Fallback examples per score range
  const fallbacks: Record<string, Record<string, string>> = {
    communication: {
      good: 'Candidate explained concepts using concrete examples with clarity.',
      fair: 'Candidate had difficulty elaborating on answers without prompting.',
      poor: 'Responses were often vague, off-topic, or missing key context.',
    },
    technical: {
      good: 'Candidate correctly explained core concepts and discussed trade-offs.',
      fair: 'Candidate knew basic terms but struggled with deeper implementation details.',
      poor: 'Candidate could not answer fundamental domain questions.',
    },
    problem_solving: {
      good: 'Candidate broke down the problem systematically and reasoned about edge cases.',
      fair: 'Candidate attempted a solution but skipped key reasoning steps.',
      poor: 'Candidate was unable to structure a meaningful approach to problems.',
    },
    coding: {
      good: 'Candidate wrote clean, efficient code and explained the logic precisely.',
      fair: 'Candidate completed the task but with some logic errors or poor formatting.',
      poor: 'Candidate was unable to implement a working solution for the coding task.',
    },
  };

  const tier = score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor';
  return fallbacks[skill][tier];
}

// ─── feedback section parser ──────────────────────────────────────────────────

const SKIP_SECTION = /hire recommendation|can the candidate be hired/i;

function parseSections(raw: string) {
  // First, normalize the text by replacing literal \n if they somehow still exist
  const normalized = raw.replace(/\\n/g, '\n');
  
  // Split by headers (### Section Name)
  const parts = normalized.split(/\n(?=#{1,4}\s)/);
  const out: { title: string; body: string; isTable?: boolean }[] = [];

  for (const part of parts) {
    const hm = part.match(/^#{1,4}\s+(.+)/);
    if (hm) {
      const title = hm[1].trim();
      if (SKIP_SECTION.test(title)) continue;
      
      const body = part.replace(/^#{1,4}\s+.+\n?/, '').trim();
      if (body) {
        // Detect if body is primarily a table
        const isTable = body.includes('|') && body.includes('---');
        out.push({ title, body, isTable });
      }
    } else {
      const body = part.trim();
      if (body) {
        if (body.includes('|') && body.includes('---')) {
          out.push({ title: 'Scorecard', body, isTable: true });
        } else {
          out.push({ title: 'Summary', body });
        }
      }
    }
  }
  
  if (!out.length && normalized.trim()) {
    out.push({ title: 'Feedback', body: normalized.trim() });
  }
  return out;
}

// ─── Markdown Table Renderer ──────────────────────────────────────────────────


// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color = getScoreColor(score);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1,
        height: 8,
        borderRadius: 99,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 99,
          background: color,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 36 }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Skill card ───────────────────────────────────────────────────────────────

interface SkillCardProps {
  label: string;
  score: number;
  issues: string[];
  example: string;
}

function SkillCard({ label, score, issues, example }: SkillCardProps) {
  const color = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <div style={{
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(10px)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 38, height: 38, borderRadius: 10, 
            background: 'rgba(99, 102, 241, 0.15)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            {label.toLowerCase().includes('communication') ? <MessageSquare size={20} /> :
             label.toLowerCase().includes('technical') ? <Terminal size={20} /> :
             label.toLowerCase().includes('problem') ? <Brain size={20} /> :
             label.toLowerCase().includes('coding') ? <Keyboard size={20} /> : 
             <Activity size={20} />}
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, color: '#f1f5f9', letterSpacing: '-0.2px' }}>{label}</span>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#f1f5f9',
          background: color,
          borderRadius: 6,
          padding: '2px 8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {scoreLabel}
        </span>
      </div>

      {/* Bar */}
      <BarChart score={score} />

      {/* Issues */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(148, 163, 184, 0.5)', marginBottom: 10 }}>
          Assessment Detail
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {issues.map((issue, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              <span style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }}>•</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Example */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.3)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: '12px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(148, 163, 184, 0.4)', marginBottom: 6 }}>
          Evidence Artifact
        </div>
        <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', lineHeight: 1.6 }}>
          {example}
        </div>
      </div>
    </div>
  );
}

// ─── Overall score ring ───────────────────────────────────────────────────────

function OverallScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  return (
    <div style={{
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(10px)',
      padding: '32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Overall Performance
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color, lineHeight: 1 }}>
          {score.toFixed(1)}
          <span style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}> / 10</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            borderRadius: 20,
            padding: '4px 14px',
          }}>
            {label}
          </span>
        </div>
      </div>
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        border: `3px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        opacity: 0.5,
      }}>
        🎯
      </div>
    </div>
  );
}

function ConfidenceScoreBadge({ score }: { score: number }) {
  const color = '#6366f1'; // Indigo for confidence
  return (
    <div style={{
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(10px)',
      padding: '24px 32px',
      display: 'flex',
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Candidate Confidence
        </div>
        <div style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1 }}>
          {(score * 10).toFixed(0)}
          <span style={{ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}> %</span>
        </div>
      </div>
      <div style={{
        width: 60, height: 60,
        borderRadius: '50%',
        border: `2px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        opacity: 0.6,
      }}>
        ⚡
      </div>
    </div>
  );
}

// ─── Condensed feedback block ─────────────────────────────────────────────────

const ICON_MAP: Record<string, any> = {
  'Summary': FileText,
  'Candidate Summary': FileText,
  'Integrity Analysis': Search,
  'Technical Knowledge': Terminal,
  'Communication': MessageSquare,
  'Communication Skills': MessageSquare,
  'Problem Solving': Brain,
  'Problem Solving Behavior': Brain,
  'Behavioral': Handshake,
  'Behavioral & Soft Skills': Handshake,
  'Proctoring': ShieldCheck,
  'Proctoring Violation': ShieldCheck,
  'Coding': Keyboard,
  'Coding Question': Keyboard,
  'Red Flags': Flag,
  'Strengths': Sparkles,
  'Areas of Concern': AlertTriangle,
  'Reasoning': Lightbulb,
};

function getIcon(title: string) {
  for (const key of Object.keys(ICON_MAP)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return ICON_MAP[key];
  }
  return ClipboardList;
}

function CondensedFeedback({ raw }: { raw: string }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const sections = parseSections(raw);

  const toggle = (i: number) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sections.map((s, i) => {
        const IconComponent = getIcon(s.title);
        const isOpen = !!expanded[i];
        const preview = s.body.split('\n').filter(Boolean)[0] || '';
        const lines = s.body.split('\n').filter(Boolean);

        return (
          <div key={i} style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            background: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
            transition: 'all 0.3s ease',
            marginBottom: 8,
          }}>
            <button
              onClick={() => toggle(i)}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
              }}
            >
              <div style={{ 
                color: isOpen ? '#818cf8' : 'rgba(255,255,255,0.4)',
                transition: 'color 0.2s'
              }}>
                <IconComponent size={18} />
              </div>
              <span style={{ 
                flex: 1, 
                fontWeight: 600, 
                fontSize: 14, 
                color: isOpen ? '#f1f5f9' : 'rgba(255,255,255,0.7)' 
              }}>
                {s.title}
              </span>
              {!isOpen && (
                <span style={{ 
                  fontSize: 12, 
                  color: 'rgba(255,255,255,0.25)', 
                  maxWidth: 320, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  fontWeight: 400
                }}>
                  {preview}
                </span>
              )}
              <div style={{ color: 'rgba(255,255,255,0.2)' }}>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: '0 16px 14px 42px' }}>
                {lines.map((line, j) => {
                  const isBullet = line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ');
                  const text = line.replace(/^[-*•]\s*/, '');
                  return (
                    <div key={j} style={{
                      display: 'flex',
                      gap: 8,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.68)',
                      lineHeight: 1.65,
                      marginBottom: 4,
                    }}>
                      {isBullet && <span style={{ color: '#60a5fa', flexShrink: 0, marginTop: 3 }}>•</span>}
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Utility card wrapper ──────────────────────────────────────────────────────

function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '28px',
      boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{children}</span>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function InterviewEvaluationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const backTo = isAdmin ? '/admin/dashboard' : '/student/my-interviews';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EvaluationData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('overview');

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await getEvaluation(token!));
    } catch (err) {
      setError((err as Error).message || 'Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ds: string) => {
    try {
      return new Date(ds).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ds; }
  };

  const page = (content: ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px' }}>
        {content}
      </div>
    </div>
  );

  if (loading) return page(
    <div style={{ display: 'flex', justifyContent: 'center', padding: 64, color: 'rgba(255,255,255,0.35)' }}>
      Loading evaluation…
    </div>
  );

  if (error || !data) return page(
    <div style={{ padding: 20, borderRadius: 10, background: '#2d1010', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: 14 }}>
      {error || 'Evaluation data not available'}
    </div>
  );

  const feedback = data.overall_feedback || '';
  const isProcessing = feedback === 'AI analysis in progress...';

  // Build skill cards data
  const skillCards = [
    data.communication_quality != null && {
      label: 'Communication Quality',
      key: 'communication' as const,
      score: data.communication_quality,
    },
    data.technical_knowledge != null && {
      label: 'Technical Knowledge',
      key: 'technical' as const,
      score: data.technical_knowledge,
    },
    data.problem_solving != null && {
      label: 'Problem Solving',
      key: 'problem_solving' as const,
      score: data.problem_solving,
    },
    data.coding_score != null && {
      label: 'Coding Performance',
      key: 'coding' as const,
      score: data.coding_score,
    },
  ].filter(Boolean) as { label: string; key: 'communication' | 'technical' | 'problem_solving' | 'coding'; score: number }[];

  return page(
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            Interview Evaluation
          </h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.38)', fontSize: 14 }}>
            Detailed assessment of candidate performance
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.open(`${API_BASE_URL}/api/interviews/evaluation/${token}/export/pdf`, '_blank')}
            style={{
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid #3b82f640',
              background: '#3b82f615',
              color: '#60a5fa',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>📄</span>
            Download PDF
          </button>
          <button
            onClick={() => navigate(backTo)}
            style={{
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.13)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.75)',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Interview info strip */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Interview Date & Time
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{formatDate(data.booking.scheduled_at)}</div>
          </div>
          {data.interview_metrics?.duration_minutes != null && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Duration</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{data.interview_metrics.duration_minutes} min</div>
            </div>
          )}
          <span style={{
            padding: '6px 16px', borderRadius: 20,
            background: '#14532d', color: '#86efac',
            border: '1px solid #166534', fontSize: 13, fontWeight: 600,
          }}>
            ✓ Completed
          </span>
        </div>
      </Card>

      {/* AI processing notice */}
      {isProcessing && (
        <Card style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.22)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 3 }}>AI Analysis in Progress</div>
              <div style={{ fontSize: 13, color: 'rgba(147,197,253,0.65)' }}>
                Scores and feedback are being generated — refresh in a moment.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Overall score & Confidence */}
      <div style={{ display: 'flex', gap: 20, width: '100%' }}>
        {data.overall_score != null && (
          <div style={{ flex: 1.5 }}>
            <OverallScoreBadge score={data.overall_score} />
          </div>
        )}
        {data.confidence_level != null && (
          <ConfidenceScoreBadge score={data.confidence_level} />
        )}
      </div>

      {/* ── Skill cards with bar charts, issues & examples ── */}
      {skillCards.length > 0 && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginBottom: 14 }}>
            Skill Assessment
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {skillCards.map(card => (
              <SkillCard
                key={card.key}
                label={card.label}
                score={card.score}
                issues={extractIssues(feedback, card.key, card.score)}
                example={extractExample(feedback, card.key, card.score)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Condensed feedback accordion ── */}
      {feedback && !isProcessing && (
        <Card>
          <SectionTitle icon="📋">Detailed Feedback</SectionTitle>
          <CondensedFeedback raw={feedback} />
        </Card>
      )}

      {/* ── Tabs ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.09)', display: 'flex', gap: 2 }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'transcript', label: 'Full Transcript', icon: '💬' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '11px 20px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 6,
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.38)',
              transition: 'color 0.2s',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Strengths */}
          <div style={{
            borderRadius: 14,
            border: '1px solid rgba(34,197,94,0.22)',
            background: 'rgba(34,197,94,0.05)',
            padding: '20px 22px',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#86efac', marginBottom: 14 }}>
              ✨ Strengths
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.strengths?.length
                ? data.strengths.map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(134,239,172,0.82)', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span>{s}</span>
                  </li>
                ))
                : <li style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>No strengths recorded.</li>
              }
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div style={{
            borderRadius: 14,
            border: '1px solid rgba(249,115,22,0.22)',
            background: 'rgba(249,115,22,0.05)',
            padding: '20px 22px',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fdba74', marginBottom: 14 }}>
              📈 Areas for Improvement
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.areas_for_improvement?.length
                ? data.areas_for_improvement.map((a, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(253,186,116,0.82)', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, marginTop: 2 }}>→</span>
                    <span>{a}</span>
                  </li>
                ))
                : <li style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>No areas recorded.</li>
              }
            </ul>
          </div>
        </div>
      )}

      {/* ── Transcript tab ── */}
      {activeTab === 'transcript' && (
        <Card>
          <SectionTitle icon="💬">Full Interview Transcript</SectionTitle>
          <div style={{ maxHeight: 580, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.transcript?.length
              ? data.transcript.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '78%', borderRadius: 12,
                    padding: '11px 15px', fontSize: 13, lineHeight: 1.6,
                    background: msg.role === 'user'
                      ? 'rgba(59,130,246,0.18)'
                      : msg.role === 'assistant'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.03)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(59,130,246,0.35)'
                      : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.45, marginBottom: 4 }}>
                      {msg.role === 'user' ? 'CANDIDATE' : msg.role === 'assistant' ? 'INTERVIEWER' : 'SYSTEM'}
                      {msg.timestamp && <span style={{ marginLeft: 8 }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.82)' }}>{msg.content}</div>
                  </div>
                </div>
              ))
              : <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.28)', fontSize: 14 }}>
                Transcript not available
              </div>
            }
          </div>
        </Card>
      )}

    </div>
  );
}

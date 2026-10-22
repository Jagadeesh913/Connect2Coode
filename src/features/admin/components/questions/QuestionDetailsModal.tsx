import React from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { QuestionPayload } from '../../../../services/questionService';
import {
  Code2,
  Terminal,
  Lightbulb,
  Building2,
  Calendar,
  Layers,
  FileText,
  Loader2,
} from 'lucide-react';

interface QuestionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionPayload | null;
  loading?: boolean;
  onOpenTestCode?: (question: QuestionPayload) => void;
}

export const QuestionDetailsModal: React.FC<QuestionDetailsModalProps> = ({
  isOpen,
  onClose,
  question,
  loading = false,
  onOpenTestCode,
}) => {
  if (!question && !loading) return null;

  const getDifficultyVariant = (diff?: string) => {
    const d = (diff || '').toLowerCase();
    if (d.includes('easy') || d.includes('basic')) return 'easy';
    if (d.includes('med')) return 'medium';
    if (d.includes('hard')) return 'hard';
    return 'neutral';
  };

  const formatAskedDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  const formattedAskedDate = formatAskedDate(question?.askedDate);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={question?.title ? `#${question.id || ''}: ${question.title}` : 'Question Details'}
      subtitle="Complete problem statement, constraints, attached test cases, and company tags"
      icon={<Code2 className="w-5 h-5" />}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {question && onOpenTestCode && (
            <button
              onClick={() => {
                onClose();
                onOpenTestCode(question);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer font-sans"
              title="Open Admin Code Runner & Tester"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Test Runtime Execution</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans ml-auto shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center p-8 text-slate-500 gap-2 font-sans">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading Question Statement...</span>
        </div>
      ) : question ? (
        <div className="flex flex-col gap-5 font-sans text-xs">
          {/* Metadata Badges */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            {question.id && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                ID: #{question.id}
              </span>
            )}

            <AdminBadge
              variant={getDifficultyVariant(
                question.difficultyRefName ||
                  (question as any).difficultyName ||
                  (question as any).difficulty ||
                  question.difficultyRefCode
              )}
              size="sm"
            >
              {question.difficultyRefName ||
                (question as any).difficultyName ||
                (question as any).difficulty ||
                question.difficultyRefCode ||
                'Medium'}
            </AdminBadge>

            {(question.topicRefName ||
              (question as any).topicName ||
              (question as any).category ||
              (question as any).topic) && (
              <AdminBadge variant="primary" size="sm">
                {question.topicRefName ||
                  (question as any).topicName ||
                  (question as any).category ||
                  (question as any).topic}
              </AdminBadge>
            )}

            {(question.qpfRefName ||
              (question as any).questionPlatform ||
              (question as any).platformName ||
              (question as any).platform) && (
              <AdminBadge variant="neutral" size="sm">
                Platform: {question.qpfRefName ||
                  (question as any).questionPlatform ||
                  (question as any).platformName ||
                  (question as any).platform}
              </AdminBadge>
            )}

            <AdminBadge
              variant={question.isActive !== false ? 'success' : 'neutral'}
              dot
              size="sm"
            >
              {question.isActive !== false ? 'Active' : 'Disabled'}
            </AdminBadge>

            {formattedAskedDate && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" /> Asked: {formattedAskedDate}
              </span>
            )}
          </div>

          {/* Problem Statement */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Problem Statement</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-xs">
              {question.description}
            </div>
          </div>

          {/* Constraints */}
          {question.constraints && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Constraints
              </span>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl font-mono text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap">
                {question.constraints}
              </div>
            </div>
          )}

          {/* Tagged Companies */}
          {question.companies && question.companies.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Tagged Hiring Companies</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {question.companies.map((c: any, i: number) => {
                  const companyName = typeof c === 'object' && c !== null ? c.name || c.companyName || '' : String(c);
                  return (
                    <span
                      key={c.id ? `comp-${c.id}` : `comp-name-${companyName || i}-${i}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold"
                    >
                      <Building2 className="w-3 h-3" />
                      {companyName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Test Cases Preview */}
          {question.testCases && question.testCases.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Configured Test Cases ({question.testCases.length})</span>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {question.testCases.map((tc, idx) => (
                  <div
                    key={tc.id ? `tc-${tc.id}` : `tc-idx-${idx}`}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Case #{idx + 1}
                      </span>
                      <AdminBadge
                        variant={tc.isHidden ? 'neutral' : 'success'}
                        size="sm"
                      >
                        {tc.isHidden ? 'Hidden Evaluation Case' : 'Visible Sample Case'}
                      </AdminBadge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Input:</span>
                        <pre className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap overflow-x-auto">
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Expected Output:</span>
                        <pre className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap overflow-x-auto">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                    {tc.explanation && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-sans pt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation: </span>
                        {tc.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hints Section */}
          {question.questionHints && question.questionHints.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Hints ({question.questionHints.length})</span>
              </div>
              <div className="space-y-1.5">
                {question.questionHints.map((hint, i) => (
                  <div
                    key={hint.id ? `hint-${hint.id}` : `hint-idx-${i}`}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs"
                  >
                    <span className="font-bold mr-1.5">Hint {i + 1}:</span>
                    {hint.hintText || (hint as any).hint}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </AdminModal>
  );
};

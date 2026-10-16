import React from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { QuestionPayload } from '../../../../services/questionService';

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
    if (d === 'easy') return 'easy';
    if (d === 'medium') return 'medium';
    if (d === 'hard') return 'hard';
    return 'neutral';
  };

  const getAskedYear = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getFullYear())) {
        return date.getFullYear().toString();
      }
    } catch {}
    return dateStr.split('-')[0] || null;
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

  const askedYear = getAskedYear(question?.askedDate);
  const formattedAskedDate = formatAskedDate(question?.askedDate);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={question?.title ? `Question #${question.id || ''}: ${question.title}` : 'Question Details'}
      subtitle="Complete problem statement, metadata, hints, and attached test cases"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {question && onOpenTestCode && (
            <button
              onClick={() => {
                onClose();
                onOpenTestCode(question);
              }}
              className="px-4 py-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md  cursor-pointer font-sans"
              title="Open Admin Code Runner & Tester (Sample & Full Test Suite)"
            >
              <i className="fa-solid fa-terminal text-black text-xs"></i>
              <span>Test &amp; Validate Code</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans ml-auto"
          >
            Close Inspector
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center p-8 text-gray-400 gap-2 font-sans">
          <i className="fa-solid fa-spinner animate-spin text-neutral-300"></i>
          <span>Loading Question Statement...</span>
        </div>
      ) : question ? (
        <div className="flex flex-col gap-4 font-sans text-xs">
          {/* Metadata Badges */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-white/10">
            {question.id && (
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-mono text-[11px]">
                ID: #{question.id}
              </span>
            )}
            <AdminBadge variant={question.isActive !== false ? 'accent' : 'neutral'}>
              {question.isActive !== false ? 'Active' : 'Inactive'}
            </AdminBadge>
            <AdminBadge variant={getDifficultyVariant(question.difficultyRefName)}>
              {question.difficultyRefName || '—'}
            </AdminBadge>
            {question.topicRefName && (
              <AdminBadge variant="primary">{question.topicRefName}</AdminBadge>
            )}
            {question.qpfRefName && (
              <AdminBadge variant="neutral">{question.qpfRefName}</AdminBadge>
            )}
            {question.isOwnProblem && (
              <AdminBadge variant="accent">Original Problem</AdminBadge>
            )}
          </div>

          {/* Asked Date & Derived Asked Year */}
          {question.askedDate && (
            <div className="p-3.5 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-between font-sans">
              <div className="flex items-center gap-2 text-gray-300">
                <i className="fa-regular fa-calendar text-neutral-300 text-xs"></i>
                <span>Originally Asked Date: <strong className="text-white font-mono">{formattedAskedDate}</strong></span>
              </div>
              {askedYear && (
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold text-[11px]">
                  Asked Year: {askedYear}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading mb-1.5">
              Problem Description
            </h4>
            <div className="p-3.5 bg-neutral-900 border border-white/10 rounded-xl text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
              {question.description || 'No description provided.'}
            </div>
          </div>

          {/* Constraints */}
          {question.constraints && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading mb-1.5">
                Constraints
              </h4>
              <div className="p-3.5 bg-neutral-900 border border-white/10 rounded-xl font-mono text-gray-300">
                {question.constraints}
              </div>
            </div>
          )}

          {/* Question Hints */}
          {question.questionHints && question.questionHints.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading mb-1.5">
                Problem Hints ({question.questionHints.length})
              </h4>
              <div className="flex flex-col gap-2">
                {question.questionHints.map((hint, idx) => (
                  <div key={idx} className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-gray-300 flex items-start gap-2.5">
                    <span className="font-mono text-neutral-300 text-[11px]">#{idx + 1}</span>
                    <span className="text-xs">{hint.hintText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Associated Companies */}
          {question.companies && question.companies.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading mb-1.5">
                Target Companies
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {question.companies.map((c: any, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-200 text-xs font-semibold">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Platform Links (LeetCode, GeeksforGeeks, HackerRank) - Temporarily Commented Out
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading">
              Platform Links
            </h4>
            <div className="flex items-center gap-3 flex-wrap text-gray-300">
              {question.leetCodeUrl && (
                <a
                  href={question.leetCodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 font-mono text-[11px] text-neutral-300"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> LeetCode
                </a>
              )}
              {question.gfgUrl && (
                <a
                  href={question.gfgUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 font-mono text-[11px] text-neutral-300"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> GeeksforGeeks
                </a>
              )}
              {question.hackerRankUrl && (
                <a
                  href={question.hackerRankUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 font-mono text-[11px] text-neutral-300"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> HackerRank
                </a>
              )}
              {!question.leetCodeUrl && !question.gfgUrl && !question.hackerRankUrl && (
                <span className="text-gray-500 italic">No external links attached.</span>
              )}
            </div>
          </div>
          */}

          {/* Attached Test Cases */}
          {question.testCases && question.testCases.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading mb-1.5">
                Attached Test Cases ({question.testCases.length})
              </h4>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {question.testCases.map((tc, idx) => (
                  <div key={idx} className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-gray-300">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1 mb-1 border-b border-white/5">
                      <span>Case #{idx + 1} ({tc.typeRefCode || 'STANDARD'})</span>
                      {tc.isHidden && <span className="text-amber-400 text-[10px]">Hidden</span>}
                    </div>
                    <div>Input: <span className="text-white">{tc.input}</span></div>
                    <div>Output: <span className="text-neutral-300">{tc.expectedOutput}</span></div>
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

import React from 'react';
import { Link } from 'react-router-dom';
import type { CompanyExamItem } from '../types/companyExam';
import { Clock, FileText, Award, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CompanyExamCardProps {
  exam: CompanyExamItem;
  companyId: string | number;
  companyName?: string;
}

export const CompanyExamCard: React.FC<CompanyExamCardProps> = ({
  exam,
  companyId,
  companyName,
}) => {
  return (
    <div className="group relative bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Ambient background glow on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 group-hover:bg-blue-500/10 rounded-full blur-2xl pointer-events-none transition-all duration-300" />

      <div>
        {/* Top row: Year Badge + Active status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80">
              {exam.year} Edition
            </span>
            {exam.isActive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            )}
          </div>

          {exam.sourceUrl && (
            <a
              href={exam.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Official portal"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Exam Title */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
          {exam.examName}
        </h3>

        {/* Company Name context */}
        {companyName && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {companyName}
          </p>
        )}

        {/* Description */}
        {exam.description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
            {exam.description}
          </p>
        )}

        {/* Exam Metric Highlights */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800/70">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mb-1" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {exam.totalDurationMinutes}m
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Duration</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800/70">
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mb-1" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {exam.totalQuestions}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Questions</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800/70">
            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mb-1" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {exam.totalMarks}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Marks</span>
          </div>
        </div>
      </div>

      {/* CTA Button: View Exam Details */}
      <div className="mt-5 pt-3">
        <Link
          to={`/companies/${companyId}/exams/${exam.id}`}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-md shadow-blue-500/20 group/btn"
        >
          <span>View Exam Pattern & Details</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

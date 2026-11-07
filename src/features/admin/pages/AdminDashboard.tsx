import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { DashboardMetricsGrid, DashboardStats } from '../components/dashboard/DashboardMetricsGrid';
import { DashboardSystemInfo } from '../components/dashboard/DashboardSystemInfo';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { DashboardCodeRunner } from '../components/dashboard/DashboardCodeRunner';
import { adminQuestionService } from '../../../services/admin/adminQuestionService';
import { adminCompanyService } from '../../../services/admin/adminCompanyService';
import { adminInstitutionService } from '../../../services/admin/adminInstitutionService';
import { adminMcqService } from '../../../services/admin/adminMcqService';
import { learningSheetService } from '../../../services/learningSheetService';
import { Play, RotateCw } from 'lucide-react';
import { useReferenceGroup } from '../../references/hooks/useReferenceGroup';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: null,
    easyCount: null,
    mediumCount: null,
    hardCount: null,
    totalCompanies: null,
    totalInstitutions: null,
    totalMcqs: null,
    totalSheets: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [difficultyMetricsLoading, setDifficultyMetricsLoading] = useState(false);
  const [difficultyMetricsError, setDifficultyMetricsError] = useState<string | null>(null);
  const dashboardRequestRef = useRef<AbortController | null>(null);
  const difficultyRequestRef = useRef<AbortController | null>(null);
  const {
    items: difficultyReferences,
    loading: difficultiesLoading,
    error: difficultiesError,
    retry: retryDifficulties,
  } = useReferenceGroup('DIFF');

  const fetchDashboardData = useCallback(async () => {
    dashboardRequestRef.current?.abort();
    const controller = new AbortController();
    dashboardRequestRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch primary dashboard resources in parallel
      const [compRes, instRes, mcqRes, sheetsRes] = await Promise.allSettled([
        adminCompanyService.getCompaniesPaginated(
          { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
          controller.signal
        ),
        adminInstitutionService.getInstitutions({ page: 0, size: 1 }, controller.signal),
        adminMcqService.getMcqs(
          {
            subject: [],
            difficulty: [],
            companies: [],
            topic: null,
            pageRequest: {
              pageNumber: 0,
              pageSize: 1,
              sortBy: 'createdAt',
              sortDirection: 'DESC',
            },
          },
          controller.signal
        ),
        learningSheetService.getSheets(controller.signal),
      ]);

      if (controller.signal.aborted) return;

      let totalCompanies = 0;
      let totalInstitutions = 0;
      let totalMcqs = 0;
      let totalSheets = 0;

      // 1. Companies
      if (compRes.status === 'fulfilled' && compRes.value) {
        totalCompanies = compRes.value.data.totalElements;
      }

      // 3. Institutions
      if (instRes.status === 'fulfilled' && instRes.value) {
        const pageData = instRes.value.data;
        totalInstitutions =
          Array.isArray(pageData) ? pageData.length : pageData?.totalElements ?? pageData?.content?.length ?? 0;
      }

      // 4. MCQs
      if (mcqRes.status === 'fulfilled' && mcqRes.value) {
        const pageData = mcqRes.value.data;
        totalMcqs =
          pageData?.totalElements ?? pageData?.content?.length ?? 0;
      }

      // 5. DSA Sheets
      if (sheetsRes.status === 'fulfilled' && Array.isArray(sheetsRes.value)) {
        totalSheets = sheetsRes.value.length;
      }

      const criticalFailures = [compRes, instRes, mcqRes]
        .map((result, index) =>
          result.status === 'rejected'
            ? ['companies', 'institutions', 'MCQs'][index]
            : null
        )
        .filter(Boolean);
      setError(
        criticalFailures.length > 0
          ? 'Could not refresh ' + criticalFailures.join(', ') + '. Previous values, if available, are retained.'
          : null
      );
      setHasData(true);
      setStats((previous) => ({
        ...previous,
        totalCompanies: compRes.status === 'fulfilled' ? totalCompanies : previous.totalCompanies,
        totalInstitutions: instRes.status === 'fulfilled' ? totalInstitutions : previous.totalInstitutions,
        totalMcqs: mcqRes.status === 'fulfilled' ? totalMcqs : previous.totalMcqs,
        totalSheets: sheetsRes.status === 'fulfilled' ? totalSheets : previous.totalSheets,
      }));
    } catch {
      if (controller.signal.aborted) return;
      setError('Dashboard metrics could not be refreshed. Previous values, if available, are retained.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleQuestionTotalChange = useCallback((total: number) => {
    setStats((previous) => ({ ...previous, totalProblems: total }));
    setHasData(true);
  }, []);

  const fetchDifficultyCounts = useCallback(async () => {
    if (difficultyReferences.length === 0) return;

    difficultyRequestRef.current?.abort();
    const controller = new AbortController();
    difficultyRequestRef.current = controller;
    setDifficultyMetricsLoading(true);
    setDifficultyMetricsError(null);

    const findDifficulty = (name: string, aliases: string[] = []) =>
      difficultyReferences.find((item) => {
        const refName = item.refName?.toLowerCase();
        const refCode = item.refCode?.toLowerCase();
        return refName === name || refCode === name || aliases.includes(refCode || '');
      });
    const difficultyItems = [
      findDifficulty('easy'),
      findDifficulty('medium', ['med']),
      findDifficulty('hard'),
    ];

    try {
      const results = await Promise.allSettled(
        difficultyItems.map((item) =>
          item
            ? adminQuestionService.getQuestions(
                {
                  level: [item.id],
                  companies: null,
                  topic: null,
                  searchText: null,
                  pageRequest: {
                    pageNumber: 0,
                    pageSize: 1,
                    sortBy: 'id',
                    sortDirection: 'ASC',
                  },
                },
                controller.signal
              )
            : Promise.reject(new Error('Difficulty reference is unavailable'))
        )
      );
      if (controller.signal.aborted) return;

      const labels = ['Easy', 'Medium', 'Hard'];
      const counts = results.map((result) =>
        result.status === 'fulfilled' && typeof result.value?.data?.totalElements === 'number'
          ? result.value.data.totalElements
          : null
      );
      const failures = results
        .map((result, index) => (result.status === 'rejected' ? labels[index] : null))
        .filter(Boolean);

      setStats((previous) => ({
        ...previous,
        easyCount: counts[0] ?? previous.easyCount,
        mediumCount: counts[1] ?? previous.mediumCount,
        hardCount: counts[2] ?? previous.hardCount,
      }));
      setDifficultyMetricsError(
        failures.length > 0
          ? 'Could not refresh ' + failures.join(', ') + ' difficulty metrics. Previous values, if available, are retained.'
          : null
      );
    } catch {
      if (controller.signal.aborted) return;
      setDifficultyMetricsError('Difficulty metrics could not be refreshed. Previous values, if available, are retained.');
    } finally {
      if (!controller.signal.aborted) setDifficultyMetricsLoading(false);
    }
  }, [difficultyReferences]);

  const refreshDashboard = useCallback(() => {
    void retryDifficulties();
    void fetchDashboardData();
  }, [fetchDashboardData, retryDifficulties]);

  useEffect(() => {
    void fetchDashboardData();
    return () => {
      dashboardRequestRef.current?.abort();
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    if (difficultiesLoading) {
      setDifficultyMetricsLoading(false);
      return;
    }
    if (difficultyReferences.length === 0) {
      difficultyRequestRef.current?.abort();
      setDifficultyMetricsLoading(false);
      setStats((previous) => ({
        ...previous,
        easyCount: null,
        mediumCount: null,
        hardCount: null,
      }));
      setDifficultyMetricsError(
        difficultiesError ? null : 'Difficulty references are unavailable, so tier metrics cannot be calculated.'
      );
      return;
    }
    void fetchDifficultyCounts();
    return () => {
      difficultyRequestRef.current?.abort();
    };
  }, [difficultiesError, difficultiesLoading, difficultyReferences.length, fetchDifficultyCounts]);

  const dashboardError = [error, difficultiesError, difficultyMetricsError]
    .filter((message): message is string => Boolean(message))
    .join(' ');

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      {/* Top Page Header */}
      <AdminPageHeader
        title="Admin Overview"
        description="Live operational telemetry, indexed DSA question counts, hiring companies, and real-time execution playground."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const el = document.getElementById('dashboard-code-runner');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Runtime</span>
            </button>
            <button
              onClick={refreshDashboard}
              disabled={loading || difficultiesLoading || difficultyMetricsLoading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs"
              title="Refresh Data"
            >
                <RotateCw className={`w-3.5 h-3.5 ${loading || difficultiesLoading || difficultyMetricsLoading ? 'animate-spin text-blue-500' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 1. Operational Welcome & Role Overview */}
      <DashboardOverview />

      {/* 2. Real-Time Platform Metrics Grid */}
      <RequestStatus
        pending={loading || difficultiesLoading || difficultyMetricsLoading}
        error={dashboardError || null}
        onRetry={refreshDashboard}
        label="Refreshing metrics…"
      />
      <DashboardMetricsGrid stats={stats} loading={loading && !hasData} />

      {/* 3. Interactive Problem Code Runner & Test Suite */}
      <div id="dashboard-code-runner">
        <DashboardCodeRunner onQuestionTotalChange={handleQuestionTotalChange} />
      </div>

      {/* 4. System Configuration & Security Overview */}
      <DashboardSystemInfo />

      {/* 5. Admin Module Navigation Shortcuts */}
      <DashboardQuickActions />
    </div>
  );
};

export default AdminDashboard;

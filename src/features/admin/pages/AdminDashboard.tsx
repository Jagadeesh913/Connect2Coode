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
import { Play, RotateCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: null,
    easyCount: null,
    mediumCount: null,
    hardCount: null,
    totalCompanies: null,
    totalInstitutions: null,
    totalMcqs: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const dashboardRequestRef = useRef<AbortController | null>(null);

  const fetchDashboardData = useCallback(async () => {
    dashboardRequestRef.current?.abort();
    const controller = new AbortController();
    dashboardRequestRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const [probRes, compRes, instRes, mcqRes] = await Promise.allSettled([
        adminQuestionService.getQuestions(
          {
            level: null,
            companies: null,
            topic: null,
            searchText: null,
            pageRequest: {
              pageNumber: 0,
              pageSize: 1000,
              sortBy: 'id',
              sortDirection: 'ASC',
            },
          },
          controller.signal
        ),
        adminCompanyService.getCompanies(controller.signal),
        adminInstitutionService.getInstitutions({ page: 0, size: 1 }, controller.signal),
        adminMcqService.getMcqs({ pageRequest: { pageNumber: 0, pageSize: 1 } }, controller.signal),
      ]);

      if (controller.signal.aborted) return;

      let totalProblems = 0;
      let easyCount = 0;
      let mediumCount = 0;
      let hardCount = 0;
      let totalCompanies = 0;
      let totalInstitutions = 0;
      let totalMcqs = 0;

      // 1. Questions breakdown
      if (probRes.status === 'fulfilled' && probRes.value) {
        const pageData = probRes.value.data;
        const questionsList = Array.isArray(pageData?.content) ? pageData.content : [];

        totalProblems = pageData?.totalElements ?? questionsList.length;

        questionsList.forEach((q: any) => {
          const diffName = String(
            q.difficultyName || ''
          ).toUpperCase();
          const diffId = q.difficultyId;

          if (diffId === 1 || diffName.includes('EASY') || diffName.includes('BASIC')) {
            easyCount++;
          } else if (diffId === 2 || diffName.includes('MEDIUM') || diffName.includes('MED')) {
            mediumCount++;
          } else if (diffId === 3 || diffName.includes('HARD')) {
            hardCount++;
          }
        });
      }

      // 2. Companies
      if (compRes.status === 'fulfilled' && compRes.value) {
        const companies = compRes.value.data;
        totalCompanies = Array.isArray(companies) ? companies.length : 0;
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

      const failures = [probRes, compRes, instRes, mcqRes].map((result, index) => result.status === 'rejected' ? ['problems', 'companies', 'institutions', 'MCQs'][index] : null).filter(Boolean);
      setError(failures.length ? 'Could not refresh ' + failures.join(', ') + '. Previous values, if available, are retained.' : null);
      setHasData(true);
      setStats((previous) => ({
        totalProblems: probRes.status === 'fulfilled' ? totalProblems : previous.totalProblems,
        easyCount: probRes.status === 'fulfilled' ? easyCount : previous.easyCount,
        mediumCount: probRes.status === 'fulfilled' ? mediumCount : previous.mediumCount,
        hardCount: probRes.status === 'fulfilled' ? hardCount : previous.hardCount,
        totalCompanies: compRes.status === 'fulfilled' ? totalCompanies : previous.totalCompanies,
        totalInstitutions: instRes.status === 'fulfilled' ? totalInstitutions : previous.totalInstitutions,
        totalMcqs: mcqRes.status === 'fulfilled' ? totalMcqs : previous.totalMcqs,
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      console.warn('Dashboard fetch error:', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
    return () => {
      dashboardRequestRef.current?.abort();
    };
  }, [fetchDashboardData]);

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
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs"
              title="Refresh Data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 1. Operational Welcome & Role Overview */}
      <DashboardOverview />

      {/* 2. Real-Time Platform Metrics Grid */}
      <RequestStatus pending={loading} error={error} onRetry={fetchDashboardData} label="Refreshing metrics…" />
      <DashboardMetricsGrid stats={stats} loading={loading && !hasData} />

      {/* 3. Interactive Problem Code Runner & Test Suite */}
      <div id="dashboard-code-runner">
        <DashboardCodeRunner />
      </div>

      {/* 4. System Configuration & Security Overview */}
      <DashboardSystemInfo />

      {/* 5. Admin Module Navigation Shortcuts */}
      <DashboardQuickActions />
    </div>
  );
};

export default AdminDashboard;

import React from 'react';
import { Link } from 'react-router-dom';
import { BASE_URL } from '../../../core/api/apiClient';

export const AppSettings: React.FC = () => {
  const apiBase = BASE_URL;

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-700/60 text-blue-600 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <i className="fa-solid fa-sliders text-[10px]"></i>
            <span>SYSTEM SETTINGS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Platform & API Integration Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Inspect the configured API transport and authentication architecture.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl flex flex-col gap-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 rounded-2xl text-lg">
                <i className="fa-solid fa-server"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Data Source Mode</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configured for the Java Spring Boot REST API
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
              Configured endpoint
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl gap-1 sm:gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium">Backend Base URL</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold break-all">{apiBase}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl gap-1 sm:gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium">Auth Token Strategy</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">JWT Bearer Cookie & Header</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl gap-1 sm:gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium">Protocol</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">REST JSON</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
            <i className="fa-solid fa-shield-halved text-blue-600 dark:text-blue-400 text-lg shrink-0 mt-0.5"></i>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">API transport configured</span>
              This page shows configuration only. Availability is reported by each real request and is not inferred from the URL.
            </div>
          </div>
        </div>

        <section className="p-6 sm:p-8 bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs" aria-labelledby="privacy-data-settings-title">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-300 rounded-2xl text-lg">
              <i className="fa-solid fa-user-shield" aria-hidden="true"></i>
            </div>
            <div>
              <h2 id="privacy-data-settings-title" className="text-base font-bold text-slate-900 dark:text-white">Privacy, data, and support</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-5">
                Review actual storage practices, clear this account’s local data, and check account-rights dependencies.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { to: '/privacy', title: 'Privacy Policy', description: 'Data categories, purposes, sharing, retention, and rights.' },
              { to: '/cookies', title: 'Cookies & Storage', description: 'Essential authentication and browser-storage inventory.' },
              { to: '/data-rights', title: 'Data & Account Rights', description: 'Local clearing control and backend deletion/export status.' },
              { to: '/support', title: 'Contact & Support', description: 'Safe troubleshooting and verified contact status.' },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

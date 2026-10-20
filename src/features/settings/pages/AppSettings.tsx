import React from 'react';
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
            Inspect your architecture status, API transportation layer, and backend readiness.
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
                  Connected to Java Spring Boot REST APIs
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
              Live Spring Boot REST API
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
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Live API Connection Active</span>
              All data requests are communicated directly with the live Java Spring Boot backend server.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;

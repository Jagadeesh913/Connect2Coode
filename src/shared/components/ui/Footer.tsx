import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-50 dark:bg-[#070A13] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 font-sans transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8 pb-12 border-b border-slate-200 dark:border-slate-800/80">
          
          {/* Brand info & Socials */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <BrandLogo size="md" />

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mt-2">
              A complete platform for DSA, coding practice, company preparation and aptitude. Built for students, by a community that believes in growing together.
            </p>

          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Product
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/practice" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Problems
                </Link>
              </li>
              <li>
                <Link to="/dsa-sheet" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  DSA Sheets
                </Link>
              </li>
              <li>
                <Link to="/companies" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Company Prep
                </Link>
              </li>
              <li>
                <Link to="/aptitude" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Aptitude
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Cookies & Storage
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/copyright" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Copyright
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Help & Rights
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/support" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link to="/data-rights" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Data & Account Rights
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Tagline */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} connect2code. All rights reserved.
          </p>

          <p className="text-center sm:text-right font-medium text-slate-600 dark:text-slate-400">
            Code Together. Connect Forever.
          </p>
        </div>
      </div>
    </footer>
  );
};


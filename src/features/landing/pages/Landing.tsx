import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { closeAuthModal, logoutUser } from '../../auth/redux/authSlice';
import { Login } from '../../auth/pages/Login';
import { Navbar } from '../../../shared/components/ui/Navbar';
import { Footer } from '../../../shared/components/ui/Footer';
import { CompanyBrandLogo } from '../../companies/components/CompanyBrandLogo';
import { toast } from 'react-hot-toast';

export const Landing: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthModalOpen, user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
  };

  // Interactive FAQ State (first item open by default matching reference)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive Mini Code Runner Demo State
  const [demoSelectedLang, setDemoSelectedLang] = useState('Java');
  const [demoActiveTab, setDemoActiveTab] = useState<'custom' | 'testcases'>('testcases');
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoOutput, setDemoOutput] = useState<string | null>(null);

  // Company Marquee Horizontal Scroll Ref for manual arrows
  const companiesScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollCompanies = (direction: 'left' | 'right') => {
    if (companiesScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      companiesScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Automated Feedback Carousel State (Auto-advances from Right to Left)
  const [activeFeedbackSlide, setActiveFeedbackSlide] = useState(0);
  const [isFeedbackHovered, setIsFeedbackHovered] = useState(false);

  const feedbackSlides = [
    // Slide 1 (Matching reference image)
    [
      {
        quote:
          'The platform is very clean and easy to use. I love the variety of problems and the detailed solutions.',
        name: 'Sravanthi',
        role: '3rd Year, CSE',
        avatar: '/avatar_sravanthi.png',
      },
      {
        quote:
          'Company-wise questions and mock tests are really helpful. My preparation became much more focused.',
        name: 'Akhil',
        role: 'Final Year, IT',
        avatar: '/avatar_akhil.png',
      },
      {
        quote:
          'The coding environment is smooth and supports multiple languages. Perfect for consistent practice.',
        name: 'Meghana',
        role: '3rd Year, ECE',
        avatar: '/avatar_meghana.png',
      },
    ],
    // Slide 2
    [
      {
        quote:
          'The structured DSA roadmap took me from knowing basics to cracking tier-1 tech interviews with confidence.',
        name: 'Rahul Sharma',
        role: 'Final Year, CSE',
        avatar: '/avatar_student1.png',
      },
      {
        quote:
          'Mock company-specific tests matched the exact pattern of my interview. It felt like real placement prep!',
        name: 'Sneha Patel',
        role: 'Placed at Accenture',
        avatar: '/avatar_student2.png',
      },
      {
        quote:
          'The fast compiler and clean topic-wise questions made daily problem solving an effortless habit.',
        name: 'Ankit Verma',
        role: '3rd Year, IT',
        avatar: '/avatar_student3.png',
      },
    ],
    // Slide 3
    [
      {
        quote:
          'Aptitude and coding practice together on one platform is a game changer for campus placement prep.',
        name: 'Kavya Rao',
        role: 'Final Year, ECE',
        avatar: '/avatar_student4.png',
      },
      {
        quote:
          'Detailed explanations and multiple approaches for each problem saved me hundreds of hours of prep time.',
        name: 'Vikram Seth',
        role: 'Software Engineer Intern',
        avatar: '/avatar_akhil.png',
      },
      {
        quote:
          'Clean UI, no clutter, and instant test case execution. By far the best student coding platform.',
        name: 'Pooja Nair',
        role: '3rd Year, CSE',
        avatar: '/avatar_sravanthi.png',
      },
    ],
  ];

  // Automatic right-to-left slide transition every 3.5 seconds
  useEffect(() => {
    if (isFeedbackHovered) return;
    const timer = setInterval(() => {
      setActiveFeedbackSlide((prev) => (prev + 1) % feedbackSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isFeedbackHovered, feedbackSlides.length]);

  const handleNextFeedback = () => {
    setActiveFeedbackSlide((prev) => (prev + 1) % feedbackSlides.length);
  };

  const handlePrevFeedback = () => {
    setActiveFeedbackSlide((prev) => (prev === 0 ? feedbackSlides.length - 1 : prev - 1));
  };

  const handleRunDemoCode = () => {
    setDemoRunning(true);
    setDemoOutput(null);
    setTimeout(() => {
      setDemoRunning(false);
      setDemoOutput('[0, 1] — All 3 Test Cases Passed! (Runtime: 1ms)');
      toast.success('Sample Code Executed Successfully!');
    }, 800);
  };

  const faqs = [
    {
      q: 'Is connect2code free to use?',
      a: 'Yes, connect2code is completely free for students. You can practice problems, attempt company-wise questions, and track your progress without any cost.',
    },
    {
      q: 'Can I practice company-wise questions?',
      a: 'Yes! We provide curated previous year and pattern-based questions for top product and service-based companies including TCS, Infosys, Accenture, Cognizant, Amazon, Microsoft, Google, and more.',
    },
    {
      q: 'Which programming languages are supported?',
      a: 'Our platform supports all popular programming languages including Java, C++, Python, JavaScript, and C with fast real-time online compilation and test execution.',
    },
    {
      q: 'How is my progress tracked?',
      a: 'Your profile tracks solved problems, difficulty distribution (Easy, Medium, Hard), topic proficiency, submission history, and test accuracy in real-time.',
    },
  ];

  const topicChips = [
    { name: 'Arrays', icon: 'fa-solid fa-table-cells-large', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { name: 'Strings', icon: 'fa-solid fa-font', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { name: 'Linked List', icon: 'fa-solid fa-link', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { name: 'Trees', icon: 'fa-solid fa-network-wired', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { name: 'Graphs', icon: 'fa-solid fa-diagram-project', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    { name: 'Dynamic Programming', icon: 'fa-solid fa-cubes', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  ];

  const companiesList = [
    {
      name: 'TCS',
      brand: 'tcs',
      badgeColor: 'text-rose-600 dark:text-rose-400',
      logo: (
        <span className="text-base font-black text-rose-600 dark:text-rose-400 tracking-tighter lowercase leading-none">
          tcs
        </span>
      ),
    },
    {
      name: 'Infosys',
      brand: 'Infosys',
      badgeColor: 'text-blue-600 dark:text-blue-400',
      logo: (
        <span className="text-sm font-black text-blue-600 dark:text-blue-400 tracking-tight leading-none">
          Infosys
        </span>
      ),
    },
    {
      name: 'Accenture',
      brand: 'Accenture',
      badgeColor: 'text-purple-600 dark:text-purple-400',
      logo: (
        <span className="flex items-center gap-0.5 text-xs font-black text-purple-600 dark:text-purple-400 lowercase leading-none">
          <span className="text-purple-500 font-bold text-sm">&gt;</span>accenture
        </span>
      ),
    },
    {
      name: 'Cognizant',
      brand: 'Cognizant',
      badgeColor: 'text-cyan-600 dark:text-cyan-400',
      logo: (
        <div className="flex items-center gap-1 leading-none">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500 flex items-center justify-center text-[9px] font-black text-cyan-600 dark:text-cyan-400">
            C
          </span>
          <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">Cognizant</span>
        </div>
      ),
    },
    {
      name: 'Microsoft',
      brand: 'Microsoft',
      badgeColor: 'text-slate-800 dark:text-slate-200',
      logo: (
        <div className="flex items-center gap-1.5 leading-none">
          <span className="grid grid-cols-2 gap-0.5 w-3 h-3 shrink-0">
            <span className="bg-red-500 rounded-[1px]"></span>
            <span className="bg-green-500 rounded-[1px]"></span>
            <span className="bg-blue-500 rounded-[1px]"></span>
            <span className="bg-amber-500 rounded-[1px]"></span>
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Microsoft</span>
        </div>
      ),
    },
    {
      name: 'Amazon',
      brand: 'Amazon',
      badgeColor: 'text-amber-500',
      logo: (
        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">
          amazon<span className="text-amber-500">⌣</span>
        </span>
      ),
    },
    {
      name: 'Google',
      brand: 'Google',
      badgeColor: 'text-slate-900 dark:text-white',
      logo: (
        <span className="text-sm font-bold tracking-tight leading-none">
          <span className="text-blue-500">G</span>
          <span className="text-red-500">o</span>
          <span className="text-amber-500">o</span>
          <span className="text-blue-500">g</span>
          <span className="text-green-500">l</span>
          <span className="text-red-500">e</span>
        </span>
      ),
    },
  ];

  return (
    <div className="relative w-full flex flex-col items-center bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden min-h-screen">
      
      {/* Ambient Glowing Blobs on Left & Right Edges (Subtle in Dark Mode) */}
      <div className="hidden dark:block fixed top-20 -left-48 w-96 h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed top-[45%] -right-48 w-[450px] h-[550px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed bottom-20 -left-40 w-96 h-[500px] bg-purple-900/20 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* 1. HEADER NAVBAR */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* 2. HERO FOLD SECTION */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-2 sm:pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-end">
          
          {/* Left Column: Heading, Subheading, CTAs & Social Proof */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-start text-left z-10 pb-4">
            {/* Top Partner Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F6] dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-wider uppercase mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>YOUR PLACEMENT PREP PARTNER</span>
            </div>

            {/* Main Headline with Burst Doodle */}
            <h1 className="text-4xl sm:text-6xl lg:text-[62px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-5">
              Code{' '}
              <span className="relative inline-block text-blue-600 dark:text-[#38BDF8]">
                Today
                {/* 4-point Sparkle Doodle on top-right of Today */}
                <svg
                  className="absolute -top-7 -right-8 w-8 h-8 text-slate-800 dark:text-slate-200 select-none pointer-events-none hidden sm:block"
                  viewBox="0 0 36 36"
                  fill="none"
                >
                  <path
                    d="M18 10 C18 14 14 18 10 18 C14 18 18 22 18 26 C18 22 22 18 26 18 C22 18 18 14 18 10 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M18 14 C18 16 16 18 14 18 C16 18 18 20 18 22 C18 20 20 18 22 18 C20 18 18 16 18 14 Z"
                    fill="#FFFFFF"
                    className="dark:fill-slate-900"
                  />
                  <path d="M12 9 L8 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M26 8 L32 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M28 17 L35 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M25 24 L31 29" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              For A Brighter{' '}
              <span className="relative inline-block text-emerald-500 dark:text-emerald-400">
                Tomorrow.
                {/* Hand-drawn Green Underline Brush Stroke under Tomorrow. */}
                <svg
                  className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-2 text-emerald-500 dark:text-emerald-400 select-none pointer-events-none"
                  viewBox="0 0 160 8"
                  fill="currentColor"
                  preserveAspectRatio="none"
                >
                  <path d="M2 4 C 35 1.5, 95 1.5, 158 3.5 C 115 6.5, 55 6.5, 2 4 Z" />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <div className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8 space-y-1">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                Practice. Prepare. Grow. All in one place.
              </p>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                Build your skills with structured practice, real company questions and track your progress towards your goals.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-9 w-full sm:w-auto">
              <Link
                to="/practice"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-[#0B0F19] hover:bg-slate-800 text-white text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all active:translate-y-0.5 cursor-pointer no-underline"
              >
                <span>Start Practicing</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </Link>

              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-semibold shadow-2xs transition-all cursor-pointer no-underline"
              >
                <span>Explore Features</span>
              </a>
            </div>

            {/* Social Proof Avatars */}
            <div className="flex items-center gap-3.5 pt-1">
              <img
                src="/avatars_group.png"
                alt="Students on their placement journey"
                className="h-9 w-auto object-contain shrink-0"
              />
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                Join thousands of students <br className="hidden sm:inline" />
                on their placement journey.
              </p>
            </div>
          </div>

          {/* Right Column: High-Res Illustration from Reference Images */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex items-end justify-center lg:justify-end self-end w-full">
            {/* Dark Theme Hero Illustration */}
            <img
              src="/hero_illustration_dark.png"
              alt="Connect2Code Student Preparation Ecosystem"
              className="hidden dark:block w-full max-w-[660px] xl:max-w-[720px] 2xl:max-w-[780px] h-auto object-contain object-bottom select-none pointer-events-none drop-shadow-2xl"
            />

            {/* Light Theme Authentic Hero Illustration */}
            <img
              src="/hero_illustration_light_v2.png"
              alt="Connect2Code Student Preparation Ecosystem"
              className="block dark:hidden w-full max-w-[660px] xl:max-w-[720px] 2xl:max-w-[780px] h-auto object-contain object-bottom select-none pointer-events-none mix-blend-multiply"
            />
          </div>

        </div>
      </section>

      {/* 3. UNIFIED FLOATING STATS BAR */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-20">
        <div className="bg-white dark:bg-[#0D1322] border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Stat 1: 10K+ Aspiring Developers */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/80 dark:border-slate-800/50">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-100/70 dark:bg-blue-600/15 text-blue-600 dark:text-sky-400 flex items-center justify-center text-lg shrink-0 shadow-2xs">
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">10K+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aspiring Developers</div>
            </div>
          </div>

          {/* Stat 2: 5K+ Practice Problems */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/80 dark:border-slate-800/50">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100/70 dark:bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0 shadow-2xs">
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">5K+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Practice Problems</div>
            </div>
          </div>

          {/* Stat 3: 100+ Company Questions */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/80 dark:border-slate-800/50">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-600/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0 shadow-2xs">
              <i className="fa-solid fa-city"></i>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">100+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Company Questions</div>
            </div>
          </div>

          {/* Stat 4: Track Your Progress */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/80 dark:border-slate-800/50">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-100/70 dark:bg-rose-600/15 text-rose-500 dark:text-rose-400 flex items-center justify-center text-lg shrink-0 shadow-2xs">
              <i className="fa-solid fa-chart-simple"></i>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">Track</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your Progress</div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. SECTION: "One Platform. Four Ways to Grow." */}
      <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* Section Header: Title & Badge on Left, Handwritten Doodle on Right */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex flex-col items-start max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2F6] dark:bg-[#0F1D38] border border-slate-200/70 dark:border-blue-800/60 text-slate-600 dark:text-sky-300 text-xs font-bold tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-sky-400"></span>
              <span>EVERYTHING YOU NEED</span>
            </div>

            {/* Title with Doodle Burst */}
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              One Platform. <br />
              Four Ways to{' '}
              <span className="relative inline-flex items-center gap-2 text-blue-600 dark:text-[#38BDF8]">
                <span>Grow.</span>
                {/* 3 Green Burst Lines Doodle \ | / */}
                <svg
                  className="w-6 h-6 text-emerald-500 select-none pointer-events-none -mt-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 2v6" />
                  <path d="M4 6l4.5 4.5" />
                  <path d="M20 6l-4.5 4.5" />
                </svg>
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              A complete preparation ecosystem designed for students to learn, practice, and get placement ready.
            </p>
          </div>

          {/* Right: Authentic Hand-Drawn Annotation with Curly Loop Underline */}
          <div className="hidden lg:flex flex-col items-center select-none pointer-events-none text-slate-800 dark:text-slate-200 font-handwriting text-xl sm:text-2xl leading-none rotate-[-4deg] self-end -mb-2">
            <span>Structured Learning</span>
            <span>Real Practice</span>
            <span>Better Opportunities</span>
            <svg className="w-24 h-7 text-slate-800 dark:text-slate-200 mt-1" viewBox="0 0 100 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12 C 30 18, 60 4, 85 14 C 95 18, 92 26, 78 24 C 65 22, 60 12, 72 8" />
            </svg>
          </div>
        </div>

        {/* 4 Full Vertical Feature Cards Grid matching Reference Image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: DSA */}
          <div className="rounded-3xl p-6 bg-[#EEF6FF] dark:bg-blue-950/20 border border-[#D6E6FE] dark:border-blue-900/40 hover:shadow-lg transition-all flex flex-col justify-between group text-inherit">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D6E6FE] dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center justify-center text-base mb-5 shadow-2xs group-hover:scale-105 transition-transform">
                &lt;/&gt;
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">DSA</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Master core concepts with curated problems, multiple difficulty levels and detailed solutions.
              </p>

              {/* Checklist */}
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-blue-500 text-xs"></i>
                  <span>Topic-wise problems</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-blue-500 text-xs"></i>
                  <span>Multiple difficulty levels</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-blue-500 text-xs"></i>
                  <span>Detailed explanations</span>
                </li>
              </ul>
            </div>

            <Link
              to="/practice"
              className="w-full py-2.5 px-4 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm border border-blue-100 dark:border-blue-900/40 flex items-center justify-center gap-2 transition-all hover:bg-blue-50 dark:hover:bg-slate-700/60 no-underline cursor-pointer"
            >
              <span>Explore DSA</span>
              <i className="fa-solid fa-arrow-right text-[11px]"></i>
            </Link>
          </div>

          {/* Card 2: Coding Practice */}
          <div className="rounded-3xl p-6 bg-[#F0FDF4] dark:bg-emerald-950/20 border border-[#DCFCE7] dark:border-emerald-900/40 hover:shadow-lg transition-all flex flex-col justify-between group text-inherit">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base mb-5 shadow-2xs group-hover:scale-105 transition-transform">
                <i className="fa-solid fa-layer-group"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Coding Practice</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Write, run, and improve your code with an online compiler.
              </p>

              {/* Checklist */}
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-500 text-xs"></i>
                  <span>Multiple languages</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-500 text-xs"></i>
                  <span>Real-time execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-500 text-xs"></i>
                  <span>Custom test cases</span>
                </li>
              </ul>
            </div>

            <Link
              to="/practice"
              className="w-full py-2.5 px-4 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center gap-2 transition-all hover:bg-emerald-50 dark:hover:bg-slate-700/60 no-underline cursor-pointer"
            >
              <span>Start Coding</span>
              <i className="fa-solid fa-arrow-right text-[11px]"></i>
            </Link>
          </div>

          {/* Card 3: Company Prep */}
          <div className="rounded-3xl p-6 bg-[#FFFDF0] dark:bg-amber-950/20 border border-[#FEF3C7] dark:border-amber-900/40 hover:shadow-lg transition-all flex flex-col justify-between group text-inherit">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base mb-5 shadow-2xs group-hover:scale-105 transition-transform">
                <i className="fa-solid fa-landmark"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Company Prep</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Get ready with real company questions, mock tests and patterns.
              </p>

              {/* Checklist */}
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500 text-xs"></i>
                  <span>Previous year questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500 text-xs"></i>
                  <span>Company-wise practice</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500 text-xs"></i>
                  <span>Mock tests & analysis</span>
                </li>
              </ul>
            </div>

            <Link
              to="/companies"
              className="w-full py-2.5 px-4 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm border border-amber-100 dark:border-amber-900/40 flex items-center justify-center gap-2 transition-all hover:bg-amber-50 dark:hover:bg-slate-700/60 no-underline cursor-pointer"
            >
              <span>Explore Prep</span>
              <i className="fa-solid fa-arrow-right text-[11px]"></i>
            </Link>
          </div>

          {/* Card 4: Aptitude */}
          <div className="rounded-3xl p-6 bg-[#FFF1F2] dark:bg-rose-950/20 border border-[#FFE4E6] dark:border-rose-900/40 hover:shadow-lg transition-all flex flex-col justify-between group text-inherit">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] dark:bg-rose-900/50 text-rose-500 dark:text-rose-400 flex items-center justify-center text-base mb-5 shadow-2xs group-hover:scale-105 transition-transform">
                <i className="fa-solid fa-brain"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aptitude</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Sharpen your logical and quantitative skills.
              </p>

              {/* Checklist */}
              <ul className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-rose-500 text-xs"></i>
                  <span>Topic-wise questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-rose-500 text-xs"></i>
                  <span>Timed tests</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-rose-500 text-xs"></i>
                  <span>Detailed explanations</span>
                </li>
              </ul>
            </div>

            <Link
              to="/aptitude"
              className="w-full py-2.5 px-4 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm border border-rose-100 dark:border-rose-900/40 flex items-center justify-center gap-2 transition-all hover:bg-rose-50 dark:hover:bg-slate-700/60 no-underline cursor-pointer"
            >
              <span>Practice Aptitude</span>
              <i className="fa-solid fa-arrow-right text-[11px]"></i>
            </Link>
          </div>

        </div>
      </section>

      {/* 5. SECTION: "Company-wise Questions" (AUTOMATICALLY MOVES RIGHT TO LEFT) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-sky-300 text-xs font-bold tracking-wider uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-sky-400"></span>
          <span>PRACTICE FOR TOP COMPANIES</span>
        </div>

        {/* Title with Radiating Bursts on Both Sides */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <svg className="w-6 h-6 text-blue-500 hidden sm:block rotate-[-30deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v6" /><path d="M4 6l4.5 4.5" /><path d="M20 6l-4.5 4.5" />
          </svg>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Company-wise Questions
          </h2>
          <svg className="w-6 h-6 text-blue-500 hidden sm:block rotate-[30deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v6" /><path d="M4 6l4.5 4.5" /><path d="M20 6l-4.5 4.5" />
          </svg>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8">
          Access curated questions from top product and service based companies and get familiar with real interview patterns.
        </p>

        {/* Marquee Row with navigation arrows on left and right */}
        <div className="relative flex items-center justify-center gap-3 sm:gap-4 max-w-6xl mx-auto">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => handleScrollCompanies('left')}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-all z-20"
            aria-label="Previous companies"
          >
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>

          {/* Infinite Marquee Track Moving Automatically from Right to Left */}
          <div
            ref={companiesScrollRef}
            className="w-full overflow-hidden relative rounded-2xl py-2"
          >
            {/* Fade masks on left & right edges for seamless visuals */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FBFBFD] dark:from-[#070A13] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FBFBFD] dark:from-[#070A13] to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee-rtl flex items-center gap-3.5 sm:gap-4 hover:[animation-play-state:paused]">
              {/* Loop list twice for seamless infinite movement */}
              {[...companiesList, ...companiesList].map((company, index) => (
                <Link
                  key={`${company.name}-${index}`}
                  to={`/practice?company=${encodeURIComponent(company.name)}`}
                  className="min-w-[130px] sm:min-w-[145px] h-[78px] px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-2xs hover:shadow-sm flex flex-col items-center justify-center transition-all cursor-pointer group shrink-0 no-underline"
                >
                  <div className="h-6 flex items-center justify-center">
                    <CompanyBrandLogo name={company.name} className="h-6 w-20" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                    {company.name}
                  </span>
                </Link>
              ))}

              {/* View All Card */}
              <Link
                to="/companies"
                className="min-w-[130px] sm:min-w-[145px] h-[78px] px-4 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500/50 text-blue-600 dark:text-sky-400 text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-2 no-underline shadow-2xs hover:shadow-sm"
              >
                <span>View All</span>
                <i className="fa-solid fa-arrow-right text-[11px]"></i>
              </Link>
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => handleScrollCompanies('right')}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-all z-20"
            aria-label="Next companies"
          >
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </section>

      {/* 6. SECTION: "Practice Problems Across Different Topics." WITH MINI CODE RUNNER */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-sky-300 text-xs font-bold tracking-wider uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-sky-400"></span>
          <span>POPULAR PROBLEM TYPES</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-2">
          
          {/* Left Column: Topics and Filters */}
          <div className="lg:col-span-5 flex flex-col items-start relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Practice Problems Across Different Topics.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Explore a wide range of problems to strengthen your problem solving skills.
            </p>

            {/* Topic Chips Carousel Row with Left and Right Arrows */}
            <div className="relative flex items-center gap-2 w-full mb-5">
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                aria-label="Previous topics"
              >
                <i className="fa-solid fa-chevron-left text-[10px]"></i>
              </button>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 w-full">
                {topicChips.map((chip) => (
                  <Link
                    key={chip.name}
                    to={`/practice?topic=${encodeURIComponent(chip.name)}`}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all hover:scale-105 cursor-pointer ${chip.color} shadow-2xs no-underline`}
                  >
                    <i className={`${chip.icon} text-base mb-1`}></i>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate w-full text-center">
                      {chip.name}
                    </span>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                aria-label="Next topics"
              >
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>

            {/* Sub-row pills: Searching & Sorting, Stacks & Queues */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <Link
                to="/practice?topic=Searching"
                className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 no-underline shadow-2xs"
              >
                Searching & Sorting
              </Link>
              <Link
                to="/practice?topic=Stack"
                className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 no-underline shadow-2xs"
              >
                Stacks & Queues
              </Link>
            </div>
          </div>

          {/* Right Column: Two Sum Demo Card with "Solve / Run / Learn" Hand-drawn Note */}
          <div className="lg:col-span-7 w-full relative">
            {/* Doodle "Solve Run Learn" note pointing to card */}
            <div className="absolute -top-7 right-6 hidden md:flex items-center gap-1 select-none pointer-events-none text-slate-600 dark:text-slate-300 font-handwriting text-base font-bold">
              <div className="flex flex-col text-right leading-none">
                <span>Solve</span>
                <span>Run</span>
                <span>Learn</span>
              </div>
              <svg className="w-8 h-8 text-sky-400" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6 C 14 18, 22 18, 26 24" />
                <path d="M20 24 L 26 24 L 25 18" />
              </svg>
            </div>

            <div className="w-full bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl">
              {/* Header: Two Sum | Easy | Language dropdown */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Two Sum</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
                    Easy
                  </span>
                </div>

                {/* Language Selector */}
                <div className="relative inline-flex items-center">
                  <select
                    value={demoSelectedLang}
                    onChange={(e) => setDemoSelectedLang(e.target.value)}
                    className="appearance-none text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs transition-colors"
                  >
                    <option value="Java" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-200">Java</option>
                    <option value="Python" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-200">Python</option>
                    <option value="C++" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-200">C++</option>
                    <option value="JavaScript" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-slate-200">JavaScript</option>
                  </select>
                  <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Prompt description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-sans">
                Given an array of integers <code className="text-violet-600 dark:text-violet-400 font-mono font-bold bg-violet-50 dark:bg-violet-950/50 px-1 py-0.5 rounded">nums</code> and an integer <code className="text-violet-600 dark:text-violet-400 font-mono font-bold bg-violet-50 dark:bg-violet-950/50 px-1 py-0.5 rounded">target</code>, return indices of the two numbers such that they add up to target.
              </p>

              {/* Example Box */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Example 1:</span>
                <div>Input: nums = [2, 7, 11, 15], target = 9</div>
                <div>Output: [0, 1]</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].</div>
              </div>

              {/* Tab Runner bar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoActiveTab('custom')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      demoActiveTab === 'custom'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Custom Input
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoActiveTab('testcases')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      demoActiveTab === 'testcases'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Test Cases
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunDemoCode}
                    disabled={demoRunning}
                    className="px-4 py-1.5 rounded-full bg-[#0B0F19] dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-2xs active:translate-y-0.5 cursor-pointer disabled:opacity-50"
                  >
                    {demoRunning ? 'Running...' : 'Run Code'}
                  </button>
                  <Link
                    to="/practice/two-sum"
                    className="px-5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:translate-y-0.5 cursor-pointer no-underline"
                  >
                    Submit
                  </Link>
                </div>
              </div>

              {/* Live output preview */}
              {demoOutput && (
                <div className="mt-3.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-mono text-emerald-800 dark:text-emerald-300 animate-fade-in flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>{demoOutput}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>


      {/* 8. SECTION: "Loved by Aspiring Developers" (FEEDBACK - AUTOMATICALLY MOVES RIGHT TO LEFT) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Badge */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-sky-300 text-xs font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-sky-400"></span>
            <span>WHAT LEARNERS SAY</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Loved by Aspiring Developers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Students are already improving their skills and getting placement ready with connect2code.
          </p>
        </div>

        {/* Automated Slider with Navigation Arrows matching Reference Image */}
        <div
          className="relative flex items-center justify-center gap-3 sm:gap-4 max-w-6xl mx-auto"
          onMouseEnter={() => setIsFeedbackHovered(true)}
          onMouseLeave={() => setIsFeedbackHovered(false)}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevFeedback}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-all z-20"
            aria-label="Previous testimonials"
          >
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>

          {/* Carousel Viewport: Smooth Right-to-Left Slide Transition */}
          <div className="w-full overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeFeedbackSlide * 100}%)` }}
            >
              {feedbackSlides.map((slide, slideIdx) => (
                <div
                  key={slideIdx}
                  className="w-full shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 px-1"
                >
                  {slide.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                    >
                      <div>
                        <span className="text-purple-600 dark:text-purple-400 text-3xl font-serif font-black leading-none block mb-3">
                          ““
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
                          {item.quote}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNextFeedback}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-all z-20"
            aria-label="Next testimonials"
          >
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

        {/* Carousel Pagination Dots (Center Dot Active Matching Reference Mockup) */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {feedbackSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveFeedbackSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeFeedbackSlide === idx
                  ? 'w-6 bg-blue-600 dark:bg-sky-400'
                  : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 9. SECTION: "Have Questions?" (FAQ ACCORDION) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-sky-300 text-xs font-bold tracking-wider uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-sky-400"></span>
          <span>FREQUENTLY ASKED QUESTIONS</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mt-2">
          
          {/* Left Column: Heading, Subheading & playful Q/A Badges + Dotted ? */}
          <div className="lg:col-span-5 flex flex-col items-start relative">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
              Have <br />
              <span className="text-blue-600 dark:text-[#38BDF8]">Questions?</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              Find answers to common questions about connect2code.
            </p>

            {/* Q and A chat badges + dotted question mark doodle */}
            <div className="flex items-center gap-3 relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                Q
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                A
              </div>

              {/* Hand-drawn Dotted Pink Question Mark Doodle */}
              <svg className="w-9 h-11 text-pink-500 absolute -top-8 left-24 select-none pointer-events-none" viewBox="0 0 30 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round">
                <path d="M6 12 C6 5 22 4 22 14 C22 22 14 20 14 28" />
                <circle cx="14" cy="35" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Right Column: Interactive Accordion */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`border rounded-2xl overflow-hidden transition-all shadow-2xs ${
                    isOpen
                      ? 'bg-blue-50/40 dark:bg-[#0D182E] border-blue-200 dark:border-blue-700/60'
                      : 'bg-white dark:bg-[#0D1322] border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen && (
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-sky-300 flex items-center justify-center text-xs">
                          <i className="fa-regular fa-user"></i>
                        </span>
                      )}
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {faq.q}
                      </span>
                    </div>
                    <i
                      className={`fa-solid ${
                        isOpen ? 'fa-minus text-blue-600 dark:text-sky-400' : 'fa-plus text-slate-400'
                      } text-xs transition-transform`}
                    ></i>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3 animate-fade-in pl-14">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. FOOTER */}
      <Footer />

      {/* Floating Auth Modal Overlay */}
      {isAuthModalOpen && (
        <Login onCloseModal={() => dispatch(closeAuthModal())} />
      )}
    </div>
  );
};

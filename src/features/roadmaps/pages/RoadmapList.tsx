/* eslint-disable react-refresh/only-export-components -- roadmap metadata is colocated with its page */
import React from 'react';
import { Link } from 'react-router-dom';

export interface TechRoadmapCard {
  slug: string;
  title: string;
  icon: string;
}

export interface TechRoadmapSection {
  title: string;
  subtitle: string;
  items: TechRoadmapCard[];
}

export const roadmapSections: TechRoadmapSection[] = [
  {
    title: 'Computer Science Fundamentals',
    subtitle: 'Build a rock-solid foundation for software engineering and placement interviews.',
    items: [
      { slug: 'data-structures', title: 'Data Structures & Algorithms', icon: 'fa-solid fa-sitemap' },
      { slug: 'system-design', title: 'System Design', icon: 'fa-solid fa-network-wired' },
      { slug: 'oops', title: 'Object-Oriented Programming', icon: 'fa-solid fa-cubes' },
      { slug: 'dbms', title: 'Database Management (DBMS)', icon: 'fa-solid fa-database' },
      { slug: 'operating-systems', title: 'Operating Systems', icon: 'fa-solid fa-microchip' },
      { slug: 'computer-networks', title: 'Computer Networks', icon: 'fa-solid fa-globe' },
      { slug: 'git-github', title: 'Git & GitHub', icon: 'fa-solid fa-code-branch' },
      { slug: 'linux', title: 'Linux', icon: 'fa-solid fa-terminal' },
    ],
  },
  {
    title: 'Programming Fundamentals',
    subtitle: 'Master the language that powers your engineering career.',
    items: [
      { slug: 'java', title: 'Java', icon: 'fa-brands fa-java' },
      { slug: 'javascript', title: 'JavaScript', icon: 'fa-brands fa-js' },
      { slug: 'python', title: 'Python', icon: 'fa-brands fa-python' },
      { slug: 'typescript', title: 'TypeScript', icon: 'fa-solid fa-file-code' },
      { slug: 'nodejs', title: 'Node.js', icon: 'fa-brands fa-node-js' },
      { slug: 'aspnet-core', title: 'ASP.NET Core', icon: 'fa-solid fa-globe' },
    ],
  },
  {
    title: 'Backend & APIs',
    subtitle: 'Build high-performance services that scale.',
    items: [
      { slug: 'spring-boot', title: 'Spring Boot', icon: 'fa-solid fa-layer-group' },
      { slug: 'api-design', title: 'API Design', icon: 'fa-solid fa-border-all' },
      { slug: 'graphql', title: 'GraphQL', icon: 'fa-solid fa-diagram-project' },
      { slug: 'mongodb', title: 'MongoDB', icon: 'fa-solid fa-hard-drive' },
      { slug: 'redis', title: 'Redis', icon: 'fa-solid fa-bolt' },
    ],
  },
  {
    title: 'Frontend Development',
    subtitle: 'Craft beautiful, fast, and interactive web apps.',
    items: [
      { slug: 'html', title: 'HTML', icon: 'fa-solid fa-file-lines' },
      { slug: 'css', title: 'CSS', icon: 'fa-solid fa-palette' },
      { slug: 'react', title: 'React', icon: 'fa-brands fa-react' },
      { slug: 'angular', title: 'Angular', icon: 'fa-brands fa-angular' },
      { slug: 'design-systems', title: 'Design Systems', icon: 'fa-solid fa-icons' },
    ],
  },
  {
    title: 'Cloud & Systems',
    subtitle: 'Deploy and scale infrastructure for modern software.',
    items: [
      { slug: 'system-design-cloud', title: 'System Design', icon: 'fa-solid fa-network-wired' },
      { slug: 'aws', title: 'AWS', icon: 'fa-brands fa-aws' },
      { slug: 'docker', title: 'Docker', icon: 'fa-brands fa-docker' },
      { slug: 'kubernetes', title: 'Kubernetes', icon: 'fa-solid fa-dharmachakra' },
      { slug: 'terraform', title: 'Terraform', icon: 'fa-solid fa-cubes-stacked' },
    ],
  },
  {
    title: 'AI & Emerging Tech',
    subtitle: 'Build with state-of-the-art AI architectures.',
    items: [
      { slug: 'ai-agents', title: 'AI Agents', icon: 'fa-solid fa-wand-magic-sparkles' },
      { slug: 'prompt-engineering', title: 'Prompt Engineering', icon: 'fa-solid fa-comment-dots' },
    ],
  },
];

export const RoadmapList: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans">
      
      {/* BeyondBasics Hero Header Section - DSA Sheet Page Theme */}
      <section id="roadmapHero" className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance break-words sm:whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Tech Placement Roadmaps
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Step-by-step guides, resources, and learning paths for software engineering
        </p>
        <div className="flex justify-center mb-6">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]"></div>
        </div>
      </section>

      {/* Roadmaps Grid Sections - DSA Sheet Theme Cards */}
      <div className="w-full max-w-5xl mt-8 px-4 flex flex-col gap-12">
        {roadmapSections.map((sec) => (
          <section key={sec.title} className="w-full">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-heading mb-2">
                {sec.title}
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] rounded-full mb-3"></div>
              <p className="text-sm sm:text-base text-gray-400 font-sans font-normal">
                {sec.subtitle}
              </p>
            </div>

            {/* Grid Cards - Matching DSA Sheet Card Aesthetics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sec.items.map((item) => (
                <Link
                  key={item.slug}
                  to={`/roadmaps/${item.slug}`}
                  className="group flex items-center gap-4 p-4 min-h-[72px] bg-neutral-800 hover:bg-neutral-800 border border-white/10 hover:border-white/30 rounded-lg shadow-md transition-all active:scale-[0.98]"
                >
                  {/* Transparent Icon Container */}
                  <div className="w-11 h-11 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-white/30 transition-colors">
                    <i className={`${item.icon} text-lg text-white group-hover:scale-110 transition-transform`}></i>
                  </div>

                  <span className="flex-1 text-sm sm:text-base font-semibold text-white font-sans group-hover:text-gray-200 transition-colors">
                    {item.title}
                  </span>

                  <i className="fa-solid fa-chevron-right text-xs text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0"></i>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

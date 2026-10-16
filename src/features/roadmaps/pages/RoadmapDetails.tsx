import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export interface JourneyNode {
  id: string;
  title: string;
  color?: string;
  icon?: string;
  tags: string[];
  description: string;
  whyImportant?: string[];
  problems?: {
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    slug: string;
    isOwnProblem?: boolean;
    gfgUrl?: string;
    leetCodeUrl?: string;
    hackerRankUrl?: string;
  }[];
}

export interface PhaseData {
  title: string;
  color?: string;
  topics: string[];
}

export interface RoadmapData {
  title: string;
  subtitle: string;
  phases: PhaseData[];
  journeyNodes: JourneyNode[];
  faqs: { q: string; a: string }[];
}

const getRoadmapData = (slug: string | undefined): RoadmapData => {
  const norm = (slug || 'data-structures-algorithms').toLowerCase().trim();

  // 1. DATA STRUCTURES & ALGORITHMS / DATA STRUCTURES
  if (norm.includes('data-structures') || norm === 'dsa') {
    return {
      title: 'Data Structures & Algorithms',
      subtitle: 'Step by step guide to mastering DSA for interviews and real-world coding',
      phases: [
        { title: 'Basics', color: '#a3a3a3', topics: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Hash Maps', 'Big-O Analysis'] },
        { title: 'Trees & Graphs', color: '#38BDF8', topics: ['Binary Trees', 'BST & Traversals', 'Heaps', 'Graphs (BFS/DFS)', 'Priority Queues'] },
        { title: 'Sorting & Searching', color: '#818CF8', topics: ['Merge Sort', 'Quick Sort', 'Binary Search', 'Two Pointers', 'Sliding Window'] },
        { title: 'Advanced Patterns', color: '#C084FC', topics: ['Recursion', 'Backtracking', 'Dynamic Programming', 'Greedy Algorithms', 'Tries'] },
        { title: 'Interview Prep', color: '#F97316', topics: ['NeetCode 150', 'Blind 75', 'Mock Interviews', 'System Design Intro', 'Portfolio'] },
      ],
      journeyNodes: [
        {
          id: 'dsa-1',
          title: 'Arrays & Strings',
          color: '#a3a3a3',
          icon: 'fa-solid fa-code',
          tags: ['traversal', 'two pointers', 'sliding window', 'prefix sum'],
          description: 'Master linear data structures, contiguous memory allocation, two pointers, and sliding window optimization.',
          whyImportant: [
            'Arrays form the foundation of almost all data manipulation in real-world software.',
            'Two pointers and sliding window cut down time complexity from O(N^2) to O(N).'
          ],
          problems: [
            { title: 'Two Sum', difficulty: 'Easy', slug: 'two-sum', isOwnProblem: false, gfgUrl: 'https://www.geeksforgeeks.org/two-sum/', leetCodeUrl: 'https://leetcode.com/problems/two-sum/', hackerRankUrl: 'https://www.hackerrank.com/challenges/two-sum' },
            { title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', slug: 'best-time-to-buy-and-sell-stock' },
            { title: 'Container With Most Water', difficulty: 'Medium', slug: 'container-with-most-water' }
          ]
        },
        {
          id: 'dsa-2',
          title: 'Linked Lists',
          color: '#a3a3a3',
          icon: 'fa-solid fa-layer-group',
          tags: ['singly', 'doubly', 'fast/slow pointers', 'reversal'],
          description: 'Understand non-contiguous node references, pointer manipulation, and cycle detection.',
          whyImportant: [
            'Linked lists teach fundamental pointer arithmetic and memory node references.',
            'Fast & slow pointers solve cycle detection in O(N) time with O(1) space.'
          ],
          problems: [
            { title: 'Reverse Linked List', difficulty: 'Easy', slug: 'reverse-linked-list' },
            { title: 'Linked List Cycle', difficulty: 'Easy', slug: 'linked-list-cycle' },
            { title: 'Merge Two Sorted Lists', difficulty: 'Easy', slug: 'merge-two-sorted-lists' }
          ]
        },
        {
          id: 'dsa-3',
          title: 'Stacks & Queues',
          color: '#38BDF8',
          icon: 'fa-solid fa-list-check',
          tags: ['LIFO', 'FIFO', 'monotonic stack', 'BFS'],
          description: 'Master Last-In-First-Out and First-In-First-Out evaluation, expressions, and queue BFS.',
          whyImportant: [
            'Stacks are essential for call-stack evaluation, undo/redo mechanisms, and AST parsing.',
            'Monotonic stacks solve next-greater-element problems in linear time.'
          ],
          problems: [
            { title: 'Valid Parentheses', difficulty: 'Easy', slug: 'valid-parentheses' },
            { title: 'Min Stack', difficulty: 'Medium', slug: 'min-stack' },
            { title: 'Daily Temperatures', difficulty: 'Medium', slug: 'daily-temperatures' }
          ]
        },
        {
          id: 'dsa-4',
          title: 'Hash Maps & Sets',
          color: '#38BDF8',
          icon: 'fa-solid fa-database',
          tags: ['hashing', 'frequency count', 'two sum', 'grouping'],
          description: 'Understand hash functions, collision handling (chaining vs open addressing), and constant time lookups.',
          whyImportant: [
            'Hash maps turn nested O(N^2) searches into instant O(1) hash lookups.',
            'Used heavily in caching, dictionary indexes, and database indexing.'
          ],
          problems: [
            { title: 'Group Anagrams', difficulty: 'Medium', slug: 'group-anagrams' },
            { title: 'Longest Consecutive Sequence', difficulty: 'Medium', slug: 'longest-consecutive-sequence' }
          ]
        },
        {
          id: 'dsa-5',
          title: 'Trees & Binary Trees',
          color: '#818CF8',
          icon: 'fa-solid fa-code-branch',
          tags: ['BST', 'DFS', 'BFS', 'traversals', 'LCA'],
          description: 'Master hierarchical structures, binary search trees, in-order/pre-order/post-order, and level-order traversal.',
          whyImportant: [
            'Trees form the basis of file systems, database B-Trees, and HTML DOM trees.',
            'DFS and BFS algorithms translate directly to graph and AI search algorithms.'
          ],
          problems: [
            { title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', slug: 'maximum-depth-of-binary-tree' },
            { title: 'Lowest Common Ancestor of a BST', difficulty: 'Medium', slug: 'lowest-common-ancestor-of-a-binary-search-tree' }
          ]
        },
        {
          id: 'dsa-6',
          title: 'Heaps & Priority Queues',
          color: '#818CF8',
          icon: 'fa-solid fa-layer-group',
          tags: ['min/max heap', 'top-K', 'merge K lists'],
          description: 'Understand binary heaps, heapify operational complexity, and priority-based task dispatching.',
          whyImportant: ['Priority queues enable Dijkstra\'s shortest path algorithm and event schedulers.'],
          problems: [
            { title: 'Kth Largest Element in an Array', difficulty: 'Medium', slug: 'kth-largest-element-in-an-array' },
            { title: 'Top K Frequent Elements', difficulty: 'Medium', slug: 'top-k-frequent-elements' }
          ]
        },
        {
          id: 'dsa-7',
          title: 'Graphs',
          color: '#C084FC',
          icon: 'fa-solid fa-network-wired',
          tags: ['BFS', 'DFS', 'Dijkstra', 'topological sort', 'union-find'],
          description: 'Master adjacency matrices and lists, connected components, shortest paths, and cycle detection.',
          whyImportant: [
            'Graphs power social networks, Google Maps routing, recommendation engines, and dependency resolutions.'
          ],
          problems: [
            { title: 'Number of Islands', difficulty: 'Medium', slug: 'number-of-islands' },
            { title: 'Course Schedule', difficulty: 'Medium', slug: 'course-schedule' }
          ]
        },
        {
          id: 'dsa-8',
          title: 'Sorting Algorithms',
          color: '#C084FC',
          icon: 'fa-solid fa-table-list',
          tags: ['merge sort', 'quick sort', 'heap sort', 'counting sort'],
          description: 'Understand divide-and-conquer sorting algorithms, stability, and space/time tradeoffs.',
          whyImportant: ['Sorting is an underlying step for binary search and interval merging.']
        },
        {
          id: 'dsa-9',
          title: 'Recursion & Backtracking',
          color: '#F97316',
          icon: 'fa-solid fa-wrench',
          tags: ['subsets', 'permutations', 'N-Queens', 'call stack'],
          description: 'Master recursive call stack state, base cases, and state space pruning.',
          problems: [
            { title: 'Subsets', difficulty: 'Medium', slug: 'subsets', isOwnProblem: false, gfgUrl: 'https://www.geeksforgeeks.org/subsets/', leetCodeUrl: 'https://leetcode.com/problems/subsets/', hackerRankUrl: 'https://www.hackerrank.com/challenges/subsets' },
            { title: 'Permutations', difficulty: 'Medium', slug: 'permutations' }
          ]
        },
        {
          id: 'dsa-10',
          title: 'Dynamic Programming',
          color: '#F97316',
          icon: 'fa-solid fa-lightbulb',
          tags: ['memoization', 'tabulation', 'knapsack', 'LCS'],
          description: 'Master overlapping subproblems and optimal substructure via memoization and bottom-up DP tables.',
          problems: [
            { title: 'Climbing Stairs', difficulty: 'Easy', slug: 'climbing-stairs' },
            { title: 'Coin Change', difficulty: 'Medium', slug: 'coin-change', isOwnProblem: false, gfgUrl: 'https://www.geeksforgeeks.org/coin-change-dp-7/', leetCodeUrl: 'https://leetcode.com/problems/coin-change/', hackerRankUrl: 'https://www.hackerrank.com/challenges/coin-change' },
            { title: 'Longest Increasing Subsequence', difficulty: 'Medium', slug: 'longest-increasing-subsequence' }
          ]
        }
      ],
      faqs: [
        { q: 'How long does it take to learn DSA?', a: 'With consistent daily practice of 1-2 hours, most students master core DSA patterns in 3 to 6 months.' },
        { q: 'Which programming language should I use for DSA?', a: 'Java, C++, or Python are the most popular choices. Pick one and stick with it consistently.' },
        { q: 'Is DSA really needed for getting a job?', a: 'Yes, almost all top product companies and startups assess DSA in coding rounds.' },
        { q: 'Should I focus on quantity or quality of problems?', a: 'Quality. Understanding 100 core pattern problems is far better than blindly solving 500 without understanding.' },
        { q: 'What is the best resource to learn DSA?', a: 'Follow this structured roadmap, practice on Connect 2 Code DSA Sheet, and watch video explanations for stuck problems.' }
      ]
    };
  }

  // 2. JAVA BACKEND DEVELOPER / JAVA
  if (norm.includes('java-backend') || norm === 'java') {
    return {
      title: 'Java Backend Developer',
      subtitle: 'Step by step guide to mastering Core Java, Spring Boot, Microservices, and Enterprise Architecture',
      phases: [
        { title: 'Java Core & JVM', color: '#a3a3a3', topics: ['Syntax & Primitives', 'OOP & Interfaces', 'JVM Architecture', 'Garbage Collection', 'Exception Handling'] },
        { title: 'Collections & Streams', color: '#38BDF8', topics: ['ArrayList & HashMap', 'ConcurrentHashMap', 'Streams API', 'Generics & Wildcards', 'Lambdas'] },
        { title: 'Multithreading', color: '#818CF8', topics: ['Thread Lifecycle', 'Executors & Pools', 'CompletableFuture', 'Volatile & Locks', 'Atomic Types'] },
        { title: 'Spring Boot', color: '#C084FC', topics: ['Spring IoC & DI', 'REST Controllers', 'Spring Data JPA', 'Spring Security', 'Maven & Gradle'] },
        { title: 'Microservices', color: '#F97316', topics: ['Spring Cloud', 'Kafka Messaging', 'JUnit 5 & Mockito', 'Docker & K8s', 'Grafana Metrics'] },
      ],
      journeyNodes: [
        {
          id: 'java-1',
          title: 'Java Core & JVM Memory Architecture',
          color: '#a3a3a3',
          icon: 'fa-brands fa-java',
          tags: ['JDK JRE JVM', 'Bytecode', 'Heap vs Stack', 'Garbage Collection'],
          description: 'Master Java syntax, bytecode compilation, class loader delegation, and memory tuning.',
          whyImportant: ['Understanding JVM memory prevents OutOfMemory errors in enterprise production backends.']
        },
        {
          id: 'java-2',
          title: 'Collections & Streams API',
          color: '#38BDF8',
          icon: 'fa-solid fa-layer-group',
          tags: ['ArrayList', 'HashMap', 'ConcurrentHashMap', 'Streams', 'Lambdas'],
          description: 'Master time-complexity trade-offs of Java Collections and thread-safe data structures.'
        },
        {
          id: 'java-3',
          title: 'Multithreading & Concurrency',
          color: '#818CF8',
          icon: 'fa-solid fa-bolt',
          tags: ['Thread Pools', 'CompletableFuture', 'Locks', 'AtomicInteger'],
          description: 'Learn parallel processing, asynchronous workflows, lock striping, and thread safety.'
        },
        {
          id: 'java-4',
          title: 'Spring Boot & Persistence',
          color: '#C084FC',
          icon: 'fa-solid fa-server',
          tags: ['Dependency Injection', 'REST Controller', 'Spring Data JPA', 'Security'],
          description: 'Build enterprise RESTful APIs, Spring Security authentication, and relational persistence.'
        },
        {
          id: 'java-5',
          title: 'Microservices & Enterprise Ecosystem',
          color: '#F97316',
          icon: 'fa-solid fa-diagram-project',
          tags: ['Kafka', 'Docker', 'Kubernetes', 'Service Discovery', 'JUnit 5'],
          description: 'Build distributed event-driven systems using Spring Cloud, Apache Kafka, and Docker.'
        }
      ],
      faqs: [
        { q: 'Is Java Backend Development a good career choice?', a: 'Yes. Java is the dominant backend choice for banks, fintech, and large global enterprises.' },
        { q: 'How long does it take to become a job-ready Java Backend Developer?', a: 'With consistent practice, learners usually achieve interview readiness in 6 to 9 months.' },
        { q: 'Is Java still relevant in 2026?', a: 'Yes. Java 21+ with Virtual Threads has made Java ultra-fast and dominant in high-concurrency systems.' }
      ]
    };
  }

  // 3. SYSTEM DESIGN
  if (norm.includes('system-design')) {
    return {
      title: 'System Design',
      subtitle: 'Step by step guide to designing scalable, reliable, and fault-tolerant distributed systems',
      phases: [
        { title: 'Fundamentals', color: '#a3a3a3', topics: ['Scalability (Vertical vs Horizontal)', 'Load Balancing', 'Caching Strategies', 'Database Sharding', 'CAP Theorem'] },
        { title: 'Networking & APIs', color: '#38BDF8', topics: ['HTTP / HTTPS / gRPC', 'WebSockets vs Polling', 'API Gateways', 'Rate Limiting', 'CDN Setup'] },
        { title: 'Databases & Storage', color: '#818CF8', topics: ['SQL vs NoSQL', 'Replication & Master-Slave', 'Consistent Hashing', 'Object Storage (S3)', 'WAL & Indexing'] },
        { title: 'Distributed Systems', color: '#C084FC', topics: ['Message Queues (Kafka)', 'Event-Driven Architecture', 'Distributed Locking', 'Idempotency', 'Consensus (Raft)'] },
        { title: 'Real-World Systems', color: '#F97316', topics: ['Design URL Shortener', 'Design Rate Limiter', 'Design Distributed Cache', 'Design Chat App', 'Design Video Streaming'] },
      ],
      journeyNodes: [
        {
          id: 'sd-1',
          title: 'Scalability & Load Balancing',
          color: '#a3a3a3',
          icon: 'fa-solid fa-network-wired',
          tags: ['Load Balancers', 'Nginx', 'Round Robin', 'Least Connections'],
          description: 'Master horizontal scaling, reverse proxies, and traffic distribution algorithms.'
        },
        {
          id: 'sd-2',
          title: 'Caching Strategies & Redis',
          color: '#38BDF8',
          icon: 'fa-solid fa-bolt',
          tags: ['Redis', 'Cache-Aside', 'Write-Through', 'Eviction (LRU/LFU)'],
          description: 'Learn in-memory caching to reduce database read latencies from milliseconds to microseconds.'
        },
        {
          id: 'sd-3',
          title: 'Database Sharding & Replication',
          color: '#818CF8',
          icon: 'fa-solid fa-database',
          tags: ['Master-Slave', 'Consistent Hashing', 'Horizontal Partitioning', 'Read Replicas'],
          description: 'Design distributed databases that scale reads and writes across multiple regions.'
        },
        {
          id: 'sd-4',
          title: 'Message Queues & Event-Driven Systems',
          color: '#C084FC',
          icon: 'fa-solid fa-layer-group',
          tags: ['Apache Kafka', 'RabbitMQ', 'Pub/Sub', 'Asynchronous Processing'],
          description: 'Decouple backend microservices using asynchronous message streaming.'
        }
      ],
      faqs: [
        { q: 'Why is System Design important for interviews?', a: 'System design evaluates your architectural thinking, scalability knowledge, and trade-off analysis.' },
        { q: 'What is the best way to practice System Design?', a: 'Study real-world architecture diagrams (Uber, Netflix, Twitter) and practice mock architectural interviews.' }
      ]
    };
  }

  // DEFAULT / GENERIC BACKEND FOR OTHER SLUGS
  const formattedTitle = norm
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    title: formattedTitle,
    subtitle: `Step by step guide to mastering ${formattedTitle} for software engineering careers`,
    phases: [
      { title: 'Foundations', color: '#a3a3a3', topics: [`${formattedTitle} Core`, 'Syntax & Concepts', 'Development Environment', 'Version Control', 'Basic Tooling'] },
      { title: 'Core Skills', color: '#38BDF8', topics: ['Data Handling', 'APIs & Services', 'Framework Mechanics', 'Testing Basics', 'Debugging'] },
      { title: 'Advanced Concepts', color: '#818CF8', topics: ['Architecture Patterns', 'Performance Tuning', 'Security Practices', 'Optimization', 'Async Processing'] },
      { title: 'Ecosystem & Tools', color: '#C084FC', topics: ['CI/CD Pipelines', 'Containerization', 'Deployment', 'Monitoring', 'Cloud Hosting'] },
      { title: 'Career & Projects', color: '#F97316', topics: ['Real-World Projects', 'Portfolio Building', 'Interview Preparation', 'Best Practices', 'System Scale'] },
    ],
    journeyNodes: [
      {
        id: 'node-1',
        title: `${formattedTitle} Core Fundamentals`,
        color: '#a3a3a3',
        icon: 'fa-solid fa-code',
        tags: ['syntax', 'primitives', 'core mechanics', 'basics'],
        description: `Master the foundational syntax, runtime execution, and primary building blocks of ${formattedTitle}.`
      },
      {
        id: 'node-2',
        title: 'Core Architecture & Patterns',
        color: '#38BDF8',
        icon: 'fa-solid fa-layer-group',
        tags: ['design patterns', 'structure', 'modularity', 'APIs'],
        description: `Understand architectural patterns, component separation, and scalable coding conventions in ${formattedTitle}.`
      },
      {
        id: 'node-3',
        title: 'Tools & Ecosystem Integration',
        color: '#818CF8',
        icon: 'fa-solid fa-wrench',
        tags: ['tooling', 'ecosystem', 'testing', 'CI/CD'],
        description: `Integrate testing frameworks, automated pipelines, and developer tooling around ${formattedTitle}.`
      },
      {
        id: 'node-4',
        title: 'Production Deployment & Scale',
        color: '#C084FC',
        icon: 'fa-solid fa-rocket',
        tags: ['cloud', 'docker', 'monitoring', 'performance'],
        description: `Deploy production workloads, implement monitoring, and optimize performance for ${formattedTitle}.`
      }
    ],
    faqs: [
      { q: `How long does it take to learn ${formattedTitle}?`, a: `With 1-2 hours of daily study, learners typically master ${formattedTitle} in 3 to 6 months.` },
      { q: `What are the prerequisites for ${formattedTitle}?`, a: `Basic programming logic and computer literacy are all you need to start learning ${formattedTitle}.` }
    ]
  };
};

export const RoadmapDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [expandedFaqIdx, setExpandedFaqIdx] = useState<number | null>(null);

  const roadmapData = getRoadmapData(slug);

  return (
    <main className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-24 font-sans text-gray-200">
      
      {/* 1. BACK TO ROADMAPS BUTTON - DSA Sheet Aesthetics */}
      <div className="pt-2 sm:pt-4 mb-6">
        <Link
          to="/roadmaps"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition-all bg-neutral-800 border border-white/10 hover:border-neutral-700 px-4 py-2 rounded-xl shadow-md group"
        >
          <i className="fa-solid fa-arrow-left text-xs text-neutral-300 group-hover:-translate-x-0.5 transition-transform"></i>
          <span>Back to Roadmaps</span>
        </Link>
      </div>

      {/* 2. HERO HEADER SECTION - DSA Sheet Theme */}
      <section className="mb-10 text-center flex flex-col items-center">
        <h1 className="font-heading font-bold text-center text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-2.5 leading-tight">
          {roadmapData.title} <span className="text-neutral-300">Roadmap</span>
        </h1>
        <p className="text-center text-xs sm:text-sm font-sans mb-6 text-gray-400 max-w-2xl leading-relaxed">
          {roadmapData.subtitle}
        </p>

        {/* DSA Sheet Gradient Line */}
        <div className="flex justify-center mb-9">
          <div className="shrink-0 h-0.5 rounded-full w-60 bg-gradient-to-r from-neutral-700 via-[#38BDF8] to-[#C084FC]"></div>
        </div>

        {/* HERO DIAGRAM CONTAINER */}
        <div className="flex flex-col items-center w-full">
          
          {/* Top Banner Pill - LIME ACCENT */}
          <div
            className="flex items-center justify-center text-center font-heading font-bold text-black bg-neutral-100 text-neutral-900 border border-neutral-600 px-8 py-3 rounded-2xl text-sm sm:text-base  tracking-tight"
          >
            {roadmapData.title}
          </div>

          <div
            className="w-0.5 h-8 bg-gradient-to-b from-neutral-700/60 to-neutral-700/10"
          ></div>

          {/* Grid of Columns for Phases - DSA SHEET STYLING */}
          <div className="w-full max-w-4xl">
            <div className="relative">
              
              {/* Multi-Color Gradient Connection Line */}
              <div
                className="hidden sm:block absolute rounded-full top-0 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-neutral-700 via-[#38BDF8] via-[#818CF8] via-[#C084FC] to-[#F97316] shadow-[0_0_12px_rgba(163,230,53,0.2)]"
              ></div>

              {/* Watermark Tag */}
              <div
                className="hidden sm:flex absolute items-center justify-center gap-1 font-mono text-[10px] select-none -top-2.5 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/10 px-2.5 py-0.5 rounded-full text-gray-300 z-10"
              >
                <span className="text-neutral-300">✦</span>
                <span className="text-gray-300 font-bold">techroadmaps.in</span>
              </div>

              {/* 5 Column Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {roadmapData.phases.map((phase, pIdx) => {
                  const phaseColors = ['#a3a3a3', '#38BDF8', '#818CF8', '#C084FC', '#F97316'];
                  const curColor = phase.color || phaseColors[pIdx % phaseColors.length];

                  return (
                    <div key={pIdx} className="flex flex-col items-center">
                      <div
                        className="hidden sm:block w-0.5 h-5"
                        style={{ background: `linear-gradient(${curColor}, ${curColor}33)` }}
                      ></div>
                      <div
                        className="sm:hidden w-0.5 h-3"
                        style={{ background: `${curColor}40` }}
                      ></div>

                      <div
                        className="w-full rounded-xl p-3.5 bg-neutral-800 hover:bg-neutral-800 border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="text-[11px] font-poppins font-semibold mb-2 text-center"
                            style={{ color: curColor }}
                          >
                            Phase {pIdx + 1}
                          </div>

                          <h4 className="text-xs font-heading font-semibold text-center mb-3 text-white leading-snug">
                            {phase.title}
                          </h4>

                          <div className="flex flex-col gap-1.5">
                            {phase.topics.map((topItem, tIdx) => (
                              <div
                                key={tIdx}
                                className="text-[11px] font-sans text-center rounded-lg bg-neutral-900 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all py-1.5 px-2.5 shadow-xs"
                              >
                                {topItem}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom CTA Pill - LIME ACCENT */}
            <div className="w-0.5 h-7 mx-auto mt-2 bg-gradient-to-b from-[#F97316]/30 to-neutral-700/60"></div>

            <div className="flex flex-col items-center">
              <div
                className="inline-flex items-center justify-center text-center font-bold text-xs sm:text-sm text-black bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-600 px-6 py-2.5 rounded-xl shadow-[0_0_16px_rgba(163,230,53,0.2)] transition-all cursor-pointer"
              >
                <span>Access Full {roadmapData.title} Roadmap — Free</span>
                <i className="fa-solid fa-chevron-down ml-2 text-xs text-black"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LEARNING JOURNEY ACCORDION SECTION - DSA Sheet Aesthetics */}
      <div id="roadmap-journey">
        <section className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
            {roadmapData.title} <span className="text-neutral-300">Learning Journey</span>
          </h2>
          <p className="text-xs text-gray-400 font-sans mb-3">
            Click any section to explore learning resources
          </p>
          <div className="w-12 h-1 bg-neutral-100 text-neutral-900 rounded-full mb-8 opacity-90"></div>

          {/* Accordion Node List */}
          <div className="flex flex-col items-center w-full">
            {roadmapData.journeyNodes.map((node, nIdx) => {
              const curColor = node.color || '#a3a3a3';

              return (
                <React.Fragment key={node.id}>
                  {nIdx > 0 && (
                    <div className="w-0.5 h-8 bg-neutral-800"></div>
                  )}
                  <div className="flex flex-col items-center w-full max-w-lg">
                    <button
                      onClick={() => setExpandedNodeId(expandedNodeId === node.id ? null : node.id)}
                      className="w-full rounded-2xl p-5 flex items-start gap-4 text-left transition-all duration-200 bg-neutral-800 hover:bg-neutral-800 border border-white/10 hover:border-neutral-700 shadow-md cursor-pointer group"
                    >
                      {/* Icon Container */}
                      <div
                        className="w-11 h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-neutral-700 transition-colors shadow-sm"
                      >
                        <i className={`${node.icon || 'fa-solid fa-code'} text-base`} style={{ color: curColor }}></i>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm sm:text-base font-semibold font-heading text-white group-hover:text-white transition-colors">
                            {node.title}
                          </h3>
                          <i
                            className={`fa-solid fa-chevron-right text-xs text-neutral-300 transition-transform duration-200 ${
                              expandedNodeId === node.id ? 'rotate-90' : ''
                            }`}
                          ></i>
                        </div>

                        {/* Tag Chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {node.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-900 border border-white/10 text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Expanded details */}
                        {expandedNodeId === node.id && (
                          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3 text-xs text-gray-300 animate-fade-in">
                            <p className="leading-relaxed text-gray-300 font-sans">{node.description}</p>

                            {node.whyImportant && node.whyImportant.length > 0 && (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <span className="font-bold text-white font-heading">Why it matters:</span>
                                <ul className="list-disc list-inside space-y-1 text-gray-400 pl-1 font-sans">
                                  {node.whyImportant.map((wi, wIdx) => (
                                    <li key={wIdx}>{wi}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {node.problems && node.problems.length > 0 && (
                              <div className="flex flex-col gap-1.5 mt-2">
                                <span className="font-bold text-white font-heading">Practice Problems:</span>
                                <div className="grid grid-cols-1 gap-2">
                                  {node.problems.map((p, pIdx) => {
                                    const isOwn = (p as any).isOwnProblem !== false;
                                    return (
                                      <div
                                        key={pIdx}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-gray-200 gap-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="font-medium font-sans text-xs sm:text-sm text-white truncate">{p.title}</span>
                                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg shrink-0 ${
                                            p.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : p.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                          }`}>{p.difficulty}</span>
                                        </div>

                                        {isOwn ? (
                                          <Link
                                            to={`/problems/${p.slug}`}
                                            className="px-3 py-1 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-bold rounded-lg text-xs transition-all font-mono self-start sm:self-auto"
                                          >
                                            Solve
                                          </Link>
                                        ) : (
                                          /* External Platform Links (GeeksforGeeks, LeetCode, HackerRank) - Temporarily Commented Out */
                                          null
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>
      </div>

      {/* 4. FAQS ACCORDION SECTION - DSA Sheet Aesthetics */}
      <section className="mb-14">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
          Frequently Asked <span className="text-neutral-300">Questions</span>
        </h2>
        <div className="w-12 h-1 bg-neutral-100 text-neutral-900 rounded-full mb-6 opacity-90"></div>

        <div className="space-y-3">
          {roadmapData.faqs.map((faq, fIdx) => (
            <div
              key={fIdx}
              className="rounded-2xl overflow-hidden bg-neutral-800 border border-white/10 hover:border-white/20 transition-all shadow-md"
            >
              <button
                onClick={() => setExpandedFaqIdx(expandedFaqIdx === fIdx ? null : fIdx)}
                className="flex w-full items-center justify-between transition-all px-5 py-4 text-sm font-semibold font-heading text-white hover:text-white text-left cursor-pointer"
              >
                <span>{faq.q}</span>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-neutral-300 transition-transform duration-200 ${
                    expandedFaqIdx === fIdx ? 'rotate-180' : ''
                  }`}
                ></i>
              </button>
              {expandedFaqIdx === fIdx && (
                <div className="px-5 pb-4 text-xs font-sans text-gray-300 leading-relaxed border-t border-white/10 pt-3 bg-neutral-900">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs font-sans mt-8 text-gray-400">
          Still have questions?{' '}
          <span className="text-neutral-300">Explore the roadmap above and start learning step-by-step.</span>
        </p>
      </section>

    </main>
  );
};

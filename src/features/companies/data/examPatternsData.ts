export interface ExamSection {
  num: number;
  name: string;
  questions: string;
  time: string;
  avgTimePerQ: string;
  marking: string;
  difficulty: 'Easy' | 'Medium' | 'Medium-Hard' | 'Hard';
  diffBg: string;
  diffText: string;
  focusTopics: string[];
}

export interface RecruitmentStage {
  step: number;
  title: string;
  roundType: string;
  duration: string;
  description: string;
  keyTopics: string[];
}

export interface SyllabusCategory {
  title: string;
  icon: string;
  importance: 'High Priority' | 'Medium Priority' | 'Must Master';
  topics: {
    name: string;
    freq: 'High' | 'Medium' | 'Frequent';
  }[];
}

export interface HiringRole {
  title: string;
  package: string;
}

export interface CompanyExamPattern {
  id: string;
  slug: string;
  companySlug: string;
  name: string;
  fullName: string;
  category: 'Service Giant' | 'Product Global' | 'Consulting & Core' | 'FinTech & Quant';
  logoTag: string;
  logoUrl: string;
  logo?: string;
  roles: string;
  hiringRoles: HiringRole[];
  ctcPackage: string;
  duration: string;
  questionsCount: string;
  negativeMarking: string;
  adaptiveMode: string;
  eligibility: string;
  overview: string;
  quickSections: string[];
  sections: ExamSection[];
  stages: RecruitmentStage[];
  syllabus: SyllabusCategory[];
  prepStrategy: {
    doList: string[];
    dontList: string[];
    cutoffInsight: string;
  };
}

export const examPatternsData: CompanyExamPattern[] = [
  {
    "id": "tcs-nqt",
    "slug": "tcs-nqt",
    "name": "TCS NQT 2026",
    "fullName": "TCS National Qualifier Test (NQT)",
    "category": "Service Giant",
    "logoTag": "TCS",
    "roles": "Ninja Developer & Digital Developer",
    "ctcPackage": "",
    "duration": "166 Mins",
    "questionsCount": "92 Questions",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Non-Adaptive (Sectional Timed)",
    "eligibility": "60% or 6.0 CGPA throughout 10th, 12th, and B.Tech / MCA / M.Tech. Max 1 active backlog allowed at exam time.",
    "overview": "TCS NQT is the unified campus assessment test used by Tata Consultancy Services to recruit fresh engineering graduates for Ninja and Digital roles.",
    "quickSections": [
      "Numerical (40m)",
      "Verbal (30m)",
      "Reasoning (45m)",
      "Advanced Quant (20m)",
      "Coding (45m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Numerical Ability",
        "questions": "20 Questions",
        "time": "40 Mins",
        "avgTimePerQ": "2.0 Mins",
        "marking": "+1 / 0",
        "difficulty": "Medium",
        "diffBg": "bg-neutral-800 border border-neutral-700",
        "diffText": "text-neutral-300",
        "focusTopics": [
          "Percentages & Averages",
          "Profit, Loss & Discount",
          "Speed, Distance & Time",
          "Data Interpretation Graphs",
          "Permutations & Combinations"
        ]
      },
      {
        "num": 2,
        "name": "Verbal Ability",
        "questions": "25 Questions",
        "time": "30 Mins",
        "avgTimePerQ": "1.2 Mins",
        "marking": "+1 / 0",
        "difficulty": "Easy",
        "diffBg": "bg-emerald-500/15 border border-emerald-500/30",
        "diffText": "text-emerald-400",
        "focusTopics": [
          "Reading Comprehension",
          "Sentence Correction & Grammar",
          "Para Jumbles",
          "Cloze Test & Prepositions"
        ]
      },
      {
        "num": 3,
        "name": "Reasoning Ability",
        "questions": "20 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "2.25 Mins",
        "marking": "+1 / 0",
        "difficulty": "Medium",
        "diffBg": "bg-neutral-800 border border-neutral-700",
        "diffText": "text-neutral-300",
        "focusTopics": [
          "Blood Relations & Family Tree",
          "Seating Arrangements (Circular & Linear)",
          "Coding-Decoding",
          "Data Sufficiency",
          "Syllogisms"
        ]
      },
      {
        "num": 4,
        "name": "Advanced Reasoning & Quant",
        "questions": "15 Questions",
        "time": "20 Mins",
        "avgTimePerQ": "1.3 Mins",
        "marking": "+1 / 0",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Advanced Functions & Logs",
          "Probability & Statistics",
          "Flowchart Output Tracing",
          "Complex Logical Puzzles"
        ]
      },
      {
        "num": 5,
        "name": "Hands-on Coding",
        "questions": "2 Problems",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Case Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Array Transformations",
          "String Formatting & Parsing",
          "Matrix Rotations",
          "Basic Dynamic Programming",
          "Math & Prime Logic"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "National Qualifier Online Test",
        "roundType": "Automated CBT",
        "duration": "166 Mins",
        "description": "Evaluates Foundation Cognitive section + Advanced Technical & Hands-on Coding section.",
        "keyTopics": [
          "Quants",
          "Verbal",
          "Reasoning",
          "Hands-on Coding"
        ]
      },
      {
        "step": 2,
        "title": "Technical Interview",
        "roundType": "Face to Face / Online",
        "duration": "30-45 Mins",
        "description": "Deep dive into your resume projects, core CS fundamentals (OOPs, DBMS, OS), and live coding problem solving.",
        "keyTopics": [
          "Data Structures",
          "OOPs Principles",
          "SQL Queries",
          "Project Architecture"
        ]
      },
      {
        "step": 3,
        "title": "Managerial & HR Interview",
        "roundType": "Interview",
        "duration": "20 Mins",
        "description": "Assesses communication skills, willingness to work in night shifts, location preferences, and scenario situations.",
        "keyTopics": [
          "Behavioral Scenarios",
          "Relocation Flexibility",
          "Career Aspirations"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Quantitative Aptitude",
        "icon": "fa-solid fa-calculator",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Number System & Divisibility",
            "freq": "High"
          },
          {
            "name": "Percentages, Profit & Loss",
            "freq": "High"
          },
          {
            "name": "Time, Speed & Distance",
            "freq": "High"
          },
          {
            "name": "Time & Work / Pipes",
            "freq": "Medium"
          },
          {
            "name": "Data Interpretation Charts",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Reasoning & Logic",
        "icon": "fa-solid fa-brain",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Seating Arrangements",
            "freq": "High"
          },
          {
            "name": "Data Sufficiency",
            "freq": "High"
          },
          {
            "name": "Syllogisms & Deductions",
            "freq": "Medium"
          },
          {
            "name": "Blood Relations",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Hands-on Coding",
        "icon": "fa-solid fa-code",
        "importance": "High Priority",
        "topics": [
          {
            "name": "Array Manipulation & Two Pointers",
            "freq": "High"
          },
          {
            "name": "String Pattern Matching",
            "freq": "High"
          },
          {
            "name": "Matrix Transpose & Rotations",
            "freq": "Medium"
          },
          {
            "name": "Recursion & Basic DP",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Attempt all questions in Foundation section since there is ZERO negative marking.",
        "To get shortlisted for TCS Digital, solve BOTH hands-on coding problems with 100% test cases passed.",
        "Practice timed problem solving for Advanced Reasoning where time limit is tight (20 mins for 15 Qs)."
      ],
      "dontList": [
        "Do not get stuck on a single difficult Quant question \u2014 mark an answer and move forward.",
        "Do not ignore basic Verbal grammar rules; easy Verbal marks build overall percentage score."
      ],
      "cutoffInsight": "Foundation section cutoff is around 65-70%. Digital track requires clearing Advanced Reasoning + 2 Coding problems."
    },
    "hiringRoles": [
      {
        "title": "Ninja Developer",
        "package": ""
      },
      {
        "title": "Digital Developer",
        "package": ""
      },
      {
        "title": "Prime Developer",
        "package": ""
      }
    ],
    "companySlug": "tcs-nqt",
    "logoUrl": "https://www.google.com/s2/favicons?domain=tcs.com&sz=128",
    "logo": "https://cdn.simpleicons.org/tataconsultancyservices"
  },
  {
    "id": "infosys",
    "slug": "infosys",
    "name": "Infosys Placement 2026",
    "fullName": "Infosys Campus Placement Assessment",
    "category": "Service Giant",
    "logoTag": "INF",
    "roles": "System Engineer, DSE & Power Programmer",
    "ctcPackage": "",
    "duration": "100 Mins",
    "questionsCount": "54 Questions",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Strict Sectional Timed",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and Graduation with no active backlogs at the time of interview.",
    "overview": "Infosys selection process features a fast-paced online test emphasizing Mathematical Ability, Logical Reasoning, Verbal Ability, Pseudo Code tracing, and Grid Puzzles.",
    "quickSections": [
      "Math (35m)",
      "Logical (25m)",
      "Verbal (20m)",
      "Pseudo Code (10m)",
      "Puzzles (10m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Mathematical Ability",
        "questions": "15 Questions",
        "time": "35 Mins",
        "avgTimePerQ": "2.3 Mins",
        "marking": "+1 / 0",
        "difficulty": "Medium",
        "diffBg": "bg-neutral-800 border border-neutral-700",
        "diffText": "text-neutral-300",
        "focusTopics": [
          "Percentages & Averages",
          "Permutation & Combination",
          "Probability",
          "Analytical Geometry",
          "Speed & Distance"
        ]
      },
      {
        "num": 2,
        "name": "Logical Reasoning",
        "questions": "15 Questions",
        "time": "25 Mins",
        "avgTimePerQ": "1.6 Mins",
        "marking": "+1 / 0",
        "difficulty": "Medium",
        "diffBg": "bg-neutral-800 border border-neutral-700",
        "diffText": "text-neutral-300",
        "focusTopics": [
          "Data Sufficiency",
          "Syllogisms",
          "Number Series",
          "Logical Deductions",
          "Clocks & Calendars"
        ]
      },
      {
        "num": 3,
        "name": "Verbal Ability",
        "questions": "20 Questions",
        "time": "20 Mins",
        "avgTimePerQ": "1.0 Mins",
        "marking": "+1 / 0",
        "difficulty": "Easy",
        "diffBg": "bg-emerald-500/15 border border-emerald-500/30",
        "diffText": "text-emerald-400",
        "focusTopics": [
          "Sentence Completion",
          "Error Spotting",
          "Reading Passages",
          "Critical Reasoning"
        ]
      },
      {
        "num": 4,
        "name": "Pseudo Code",
        "questions": "5 Questions",
        "time": "10 Mins",
        "avgTimePerQ": "2.0 Mins",
        "marking": "+1 / 0",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Algorithm Tracing",
          "Bitwise Operators",
          "Recursion Output",
          "Loop Iterations"
        ]
      },
      {
        "num": 5,
        "name": "Puzzle Solving",
        "questions": "4 Questions",
        "time": "10 Mins",
        "avgTimePerQ": "2.5 Mins",
        "marking": "+1 / 0",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Grid Puzzles",
          "Mathematical Brainteasers",
          "Pattern Recognition",
          "Sequence Matrix"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Infosys Online Test",
        "roundType": "Online CBT",
        "duration": "100 Mins",
        "description": "5 sectional timed tests focusing heavily on Speed, Pseudo Code, and Puzzles.",
        "keyTopics": [
          "Math",
          "Reasoning",
          "Pseudo Code",
          "Puzzles"
        ]
      },
      {
        "step": 2,
        "title": "Technical & HR Interview",
        "roundType": "Online / Campus",
        "duration": "30 Mins",
        "description": "Discussion on major college projects, programming concepts (OOPs, SQL), and logical puzzles.",
        "keyTopics": [
          "College Projects",
          "OOPs Concepts",
          "SQL Queries",
          "Basic Data Structures"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Pseudo Code & Algorithm Tracing",
        "icon": "fa-solid  fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "C/C++/Java Loop Output Tracing",
            "freq": "High"
          },
          {
            "name": "Bitwise Operators (&, |, ^, <<, >>)",
            "freq": "High"
          },
          {
            "name": "Recursion Call Stack Tracing",
            "freq": "High"
          },
          {
            "name": "Array & Pointer Off-by-one Evaluation",
            "freq": "Medium"
          }
        ]
      },
      {
        "title": "Grid Puzzles",
        "icon": "fa-solid  fa-puzzle-piece",
        "importance": "High Priority",
        "topics": [
          {
            "name": "Matrix Grid Number Search",
            "freq": "High"
          },
          {
            "name": "Pattern Missing Number Deduction",
            "freq": "High"
          },
          {
            "name": "Cryptarithmetic Equations",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Practice manual dry-running of recursive code loops for Pseudo Code section.",
        "Solve 20+ grid arrangement puzzles without looking at options first.",
        "Maintain high accuracy in Verbal as time limit is 1 min per question."
      ],
      "dontList": [
        "Do not spend more than 2 minutes per question in Logical Reasoning.",
        "Do not guess randomly in Puzzles section; try back-substituting options."
      ],
      "cutoffInsight": "Sectional cutoff for Pseudo Code and Puzzles is key for clearing the Infosys threshold."
    },
    "hiringRoles": [
      {
        "title": "System Engineer",
        "package": ""
      },
      {
        "title": "Digital Specialist Engineer",
        "package": ""
      },
      {
        "title": "Power Programmer",
        "package": ""
      }
    ],
    "companySlug": "infosys",
    "logoUrl": "https://www.google.com/s2/favicons?domain=infosys.com&sz=128",
    "logo": "https://cdn.simpleicons.org/infosys"
  },
  {
    "id": "accenture",
    "slug": "accenture",
    "name": "Accenture Assessment 2026",
    "fullName": "Accenture Recruitment Assessment",
    "category": "Service Giant",
    "logoTag": "ACN",
    "roles": "Associate Software Engineer & Advanced ASE",
    "ctcPackage": "",
    "duration": "90 Mins",
    "questionsCount": "92 Questions + Voice Test",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Real-time Elimination",
    "eligibility": "60% CGPA in graduation with no active backlogs. Educational gaps must not exceed 1 year.",
    "overview": "Accenture assessment evaluates Cognitive & Technical skills in a combined 90-minute real-time elimination test, followed by Hands-on Coding and AI Communication Test.",
    "quickSections": [
      "Cognitive (50m)",
      "Technical (40m)",
      "Coding (45m)",
      "AI Voice (20m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Cognitive Assessment",
        "questions": "50 Questions",
        "time": "50 Mins",
        "avgTimePerQ": "1.0 Min",
        "marking": "+1 / 0",
        "difficulty": "Medium",
        "diffBg": "bg-neutral-800 border border-neutral-700",
        "diffText": "text-neutral-300",
        "focusTopics": [
          "English Ability",
          "Critical Reasoning",
          "Abstract Reasoning",
          "Analytical Ability"
        ]
      },
      {
        "num": 2,
        "name": "Technical Assessment",
        "questions": "40 Questions",
        "time": "40 Mins",
        "avgTimePerQ": "1.0 Min",
        "marking": "+1 / 0",
        "difficulty": "Medium",
        "diffBg": "bg-neutral-800 border border-neutral-700",
        "diffText": "text-neutral-300",
        "focusTopics": [
          "Common Tech Concepts",
          "Pseudo Code Output",
          "Networking Fundamentals",
          "Cloud & Security Basics"
        ]
      },
      {
        "num": 3,
        "name": "Coding Assessment",
        "questions": "2 Problems",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Case Score",
        "difficulty": "Medium",
        "diffBg": "bg-neutral-800 border border-neutral-700",
        "diffText": "text-neutral-300",
        "focusTopics": [
          "Array Transformation",
          "String Manipulation",
          "Basic Mathematical Logic"
        ]
      },
      {
        "num": 4,
        "name": "Communication Test",
        "questions": "Interactive Voice",
        "time": "20 Mins",
        "avgTimePerQ": "N/A",
        "marking": "AI Speech Score",
        "difficulty": "Easy",
        "diffBg": "bg-emerald-500/15 border border-emerald-500/30",
        "diffText": "text-emerald-400",
        "focusTopics": [
          "Sentence Reading",
          "Listening & Repeating",
          "Vocabulary & Fluency",
          "Story Retelling"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Cognitive & Technical Test",
        "roundType": "Real-time Elimination",
        "duration": "90 Mins",
        "description": "Combined 90-minute assessment. Clearing sectional cutoff triggers immediate Coding Round.",
        "keyTopics": [
          "English",
          "Critical Reasoning",
          "Pseudo Code",
          "Cloud Basics"
        ]
      },
      {
        "step": 2,
        "title": "Coding Assessment",
        "roundType": "Hands-on Coding",
        "duration": "45 Mins",
        "description": "2 programming problems evaluated on public & hidden test cases.",
        "keyTopics": [
          "Arrays",
          "Strings",
          "Math Logic"
        ]
      },
      {
        "step": 3,
        "title": "Communication Assessment",
        "roundType": "Automated AI Voice",
        "duration": "20 Mins",
        "description": "Automated speech test evaluating pronunciation, sentence mastery, and voice clarity.",
        "keyTopics": [
          "Reading",
          "Listening",
          "Fluency"
        ]
      },
      {
        "step": 4,
        "title": "Interview Round",
        "roundType": "Virtual Interview",
        "duration": "20 Mins",
        "description": "Technical cum HR discussion focused on learning agility, teamwork, and project contributions.",
        "keyTopics": [
          "Projects",
          "Agility",
          "Behavioral"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Cognitive & Critical Reasoning",
        "icon": "fa-solid  fa-brain",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Reading Passages & Vocabulary",
            "freq": "High"
          },
          {
            "name": "Abstract Figure Series",
            "freq": "High"
          },
          {
            "name": "Statement & Assumptions",
            "freq": "Medium"
          }
        ]
      },
      {
        "title": "Technical MCQs & Cloud",
        "icon": "fa-solid  fa-cloud",
        "importance": "High Priority",
        "topics": [
          {
            "name": "Pseudo Code Output",
            "freq": "High"
          },
          {
            "name": "Networking & Security Basics",
            "freq": "Medium"
          },
          {
            "name": "Cloud Computing Architecture",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Keep a steady pace in Round 1 \u2014 failure to cross Cognitive cutoff leads to immediate elimination.",
        "Use a good headset microphone in the Communication round and speak without long pauses.",
        "Review basic array manipulation and string reverse logic for coding."
      ],
      "dontList": [
        "Do not shout or speak too soft during the AI Communication voice evaluation.",
        "Do not spend excessive time on abstract pattern series."
      ],
      "cutoffInsight": "Real-time elimination requires crossing sectional thresholds in both Cognitive and Technical modules."
    },
    "hiringRoles": [
      {
        "title": "Associate Software Engineer",
        "package": ""
      },
      {
        "title": "Advanced ASE",
        "package": ""
      }
    ],
    "companySlug": "accenture",
    "logoUrl": "https://www.google.com/s2/favicons?domain=accenture.com&sz=128",
    "logo": "https://cdn.simpleicons.org/accenture"
  },
  {
    "id": "adobe",
    "slug": "adobe",
    "name": "Adobe Recruitment 2026",
    "fullName": "Adobe Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "ADBE",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Adobe campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays & Hashing (45m)",
      "Trees (30m)",
      "Dynamic Programming (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Hashing & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays & Hashing",
          "Trees",
          "Dynamic Programming"
        ]
      },
      {
        "num": 2,
        "name": "Trees & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Trees",
          "Dynamic Programming"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Online Assessment",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Questions + Aptitude",
        "keyTopics": [
          "Arrays & Hashing",
          "Trees",
          "Dynamic Programming"
        ]
      },
      {
        "step": 2,
        "title": "Technical Loop",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "3 Technical Rounds on DSA & System Architecture",
        "keyTopics": [
          "Arrays & Hashing",
          "Trees",
          "Dynamic Programming"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays & Hashing",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Dynamic Programming",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays & Hashing, Trees problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Adobe online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Member of Technical Staff",
        "package": ""
      },
      {
        "title": "Solution Engineer",
        "package": ""
      }
    ],
    "companySlug": "adobe",
    "logoUrl": "https://www.google.com/s2/favicons?domain=adobe.com&sz=128",
    "logo": "https://cdn.simpleicons.org/adobe"
  },
  {
    "id": "affirm",
    "slug": "affirm",
    "name": "Affirm Recruitment 2026",
    "fullName": "Affirm Placement Drive & Exam Pattern",
    "category": "FinTech & Quant",
    "logoTag": "AFFI",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Affirm campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Maps (45m)",
      "Graphs (30m)",
      "Design (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Maps & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Maps",
          "Graphs",
          "Design"
        ]
      },
      {
        "num": 2,
        "name": "Graphs & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Graphs",
          "Design"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Phone Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "1 Coding Question on Data Structures",
        "keyTopics": [
          "Hash Maps",
          "Graphs",
          "Design"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Maps",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Design",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Maps, Graphs problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Affirm online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "16.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "affirm",
    "logoUrl": "https://www.google.com/s2/favicons?domain=affirm.com&sz=128",
    "logo": "https://cdn.simpleicons.org/affirm"
  },
  {
    "id": "airbnb",
    "slug": "airbnb",
    "name": "AirBnb Recruitment 2026",
    "fullName": "AirBnb Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "ABNB",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "AirBnb campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Two Pointers (45m)",
      "BFS/DFS (30m)",
      "System Design (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Two Pointers & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Two Pointers",
          "BFS/DFS",
          "System Design"
        ]
      },
      {
        "num": 2,
        "name": "BFS/DFS & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "BFS/DFS",
          "System Design"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Interview",
        "roundType": "Interview",
        "duration": "60 Mins",
        "description": "2 Technical Rounds",
        "keyTopics": [
          "Two Pointers",
          "BFS/DFS",
          "System Design"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Two Pointers",
            "freq": "High"
          },
          {
            "name": "BFS/DFS",
            "freq": "High"
          },
          {
            "name": "System Design",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Two Pointers, BFS/DFS problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing AirBnb online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "airbnb",
    "logoUrl": "https://www.google.com/s2/favicons?domain=airbnb.com&sz=128",
    "logo": "https://cdn.simpleicons.org/airbnb"
  },
  {
    "id": "akuna-capital",
    "slug": "akuna-capital",
    "name": "Akuna Capital Recruitment 2026",
    "fullName": "Akuna Capital Placement Drive & Exam Pattern",
    "category": "FinTech & Quant",
    "logoTag": "AKUN",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Akuna Capital campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Bit Manipulation (45m)",
      "Math (30m)",
      "Concurrency (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Bit Manipulation & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Bit Manipulation",
          "Math",
          "Concurrency"
        ]
      },
      {
        "num": 2,
        "name": "Math & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Math",
          "Concurrency"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Quant OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Math + C++ Optimization",
        "keyTopics": [
          "Bit Manipulation",
          "Math",
          "Concurrency"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Bit Manipulation",
            "freq": "High"
          },
          {
            "name": "Math",
            "freq": "High"
          },
          {
            "name": "Concurrency",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Bit Manipulation, Math problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Akuna Capital online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "16.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "akuna-capital",
    "logoUrl": "https://www.google.com/s2/favicons?domain=akunacapital.com&sz=128",
    "logo": "https://cdn.simpleicons.org/akunacapital"
  },
  {
    "id": "alibaba",
    "slug": "alibaba",
    "name": "Alibaba Recruitment 2026",
    "fullName": "Alibaba Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "ALIB",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Alibaba campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Distributed Cache (30m)",
      "Graphs (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Distributed Cache",
          "Graphs"
        ]
      },
      {
        "num": 2,
        "name": "Distributed Cache & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Distributed Cache",
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Assessment",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "Algorithm & Distributed Systems",
        "keyTopics": [
          "Trees",
          "Distributed Cache",
          "Graphs"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Distributed Cache",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Distributed Cache problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Alibaba online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "alibaba",
    "logoUrl": "https://www.google.com/s2/favicons?domain=alibaba.com&sz=128",
    "logo": "https://cdn.simpleicons.org/alibaba"
  },
  {
    "id": "amazon",
    "slug": "amazon",
    "name": "Amazon Recruitment 2026",
    "fullName": "Amazon Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "AMZ",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Amazon campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays & Hashing (45m)",
      "BFS/DFS (30m)",
      "Heaps (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Hashing & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays & Hashing",
          "BFS/DFS",
          "Heaps"
        ]
      },
      {
        "num": 2,
        "name": "BFS/DFS & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "BFS/DFS",
          "Heaps"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "OA 1 & OA 2",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Debugging + 2 Coding Questions + Leadership survey",
        "keyTopics": [
          "Arrays & Hashing",
          "BFS/DFS",
          "Heaps"
        ]
      },
      {
        "step": 2,
        "title": "Technical Onsite",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "4 Rounds (Coding, System Design, Leadership)",
        "keyTopics": [
          "Arrays & Hashing",
          "BFS/DFS",
          "Heaps"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays & Hashing",
            "freq": "High"
          },
          {
            "name": "BFS/DFS",
            "freq": "High"
          },
          {
            "name": "Heaps",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays & Hashing, BFS/DFS problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Amazon online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "SDE-1 (Software Engineer)",
        "package": ""
      },
      {
        "title": "WOW Scholar / Intern",
        "package": ""
      },
      {
        "title": "Support Engineer",
        "package": ""
      }
    ],
    "companySlug": "amazon",
    "logoUrl": "https://www.google.com/s2/favicons?domain=amazon.com&sz=128",
    "logo": "https://cdn.simpleicons.org/amazon"
  },
  {
    "id": "appdynamics",
    "slug": "appdynamics",
    "name": "AppDynamics Recruitment 2026",
    "fullName": "AppDynamics Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "APPD",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "AppDynamics campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Strings (45m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Strings & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Strings",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Trees & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Test",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Questions",
        "keyTopics": [
          "Strings",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Strings, Trees problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing AppDynamics online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "appdynamics",
    "logoUrl": "https://www.google.com/s2/favicons?domain=appdynamics.com&sz=128",
    "logo": "https://cdn.simpleicons.org/appdynamics"
  },
  {
    "id": "apple",
    "slug": "apple",
    "name": "Apple Recruitment 2026",
    "fullName": "Apple Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "AAPL",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Apple campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Linked Lists (45m)",
      "Arrays (30m)",
      "System Design (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Linked Lists & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Linked Lists",
          "Arrays",
          "System Design"
        ]
      },
      {
        "num": 2,
        "name": "Arrays & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Arrays",
          "System Design"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Phone Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding & Low Level System Design",
        "keyTopics": [
          "Linked Lists",
          "Arrays",
          "System Design"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Linked Lists",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "System Design",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Linked Lists, Arrays problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Apple online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "apple",
    "logoUrl": "https://www.google.com/s2/favicons?domain=apple.com&sz=128",
    "logo": "https://cdn.simpleicons.org/apple"
  },
  {
    "id": "atlassian",
    "slug": "atlassian",
    "name": "Atlassian Recruitment 2026",
    "fullName": "Atlassian Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "ATLA",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Atlassian campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Data Structures (45m)",
      "Design Patterns (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Data Structures & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Data Structures",
          "Design Patterns"
        ]
      },
      {
        "num": 2,
        "name": "Design Patterns & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Design Patterns"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Code Design",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Object Oriented Design & Coding",
        "keyTopics": [
          "Data Structures",
          "Design Patterns"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Data Structures",
            "freq": "High"
          },
          {
            "name": "Design Patterns",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Data Structures, Design Patterns problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Atlassian online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "atlassian",
    "logoUrl": "https://www.google.com/s2/favicons?domain=atlassian.com&sz=128",
    "logo": "https://cdn.simpleicons.org/atlassian"
  },
  {
    "id": "audible",
    "slug": "audible",
    "name": "Audible Recruitment 2026",
    "fullName": "Audible Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "AUDI",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Audible campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Maps (45m)",
      "Strings (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Maps & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Maps",
          "Strings"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Online Assessment",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Problems",
        "keyTopics": [
          "Hash Maps",
          "Strings"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Maps",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Maps, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Audible online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "audible",
    "logoUrl": "https://www.google.com/s2/favicons?domain=audible.com&sz=128",
    "logo": "https://cdn.simpleicons.org/audible"
  },
  {
    "id": "bloomberg",
    "slug": "bloomberg",
    "name": "Bloomberg Recruitment 2026",
    "fullName": "Bloomberg Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "BLOO",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Bloomberg campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Ordered Sets (45m)",
      "Strings (30m)",
      "Graphs (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Ordered Sets & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Ordered Sets",
          "Strings",
          "Graphs"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings",
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Phone Interview",
        "roundType": "Technical & Coding",
        "duration": "60 Mins",
        "description": "1-2 Coding Questions",
        "keyTopics": [
          "Ordered Sets",
          "Strings",
          "Graphs"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Ordered Sets",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Ordered Sets, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Bloomberg online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "bloomberg",
    "logoUrl": "https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128",
    "logo": "https://cdn.simpleicons.org/bloomberg"
  },
  {
    "id": "bytedance",
    "slug": "bytedance",
    "name": "ByteDance Recruitment 2026",
    "fullName": "ByteDance Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "BYTE",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "ByteDance campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Dynamic Programming (45m)",
      "Sliding Window (30m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Dynamic Programming & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Dynamic Programming",
          "Sliding Window",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Sliding Window & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Sliding Window",
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screening",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding + Dynamic Programming",
        "keyTopics": [
          "Dynamic Programming",
          "Sliding Window",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Dynamic Programming",
            "freq": "High"
          },
          {
            "name": "Sliding Window",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Dynamic Programming, Sliding Window problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing ByteDance online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "bytedance",
    "logoUrl": "https://www.google.com/s2/favicons?domain=bytedance.com&sz=128",
    "logo": "https://cdn.simpleicons.org/bytedance"
  },
  {
    "id": "capital-one",
    "slug": "capital-one",
    "name": "Capital One Recruitment 2026",
    "fullName": "Capital One Placement Drive & Exam Pattern",
    "category": "FinTech & Quant",
    "logoTag": "CAPI",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Capital One campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Strings (30m)",
      "Sorting (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Strings",
          "Sorting"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings",
          "Sorting"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Codesignal OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "4 Coding Questions in 70 Mins",
        "keyTopics": [
          "Arrays",
          "Strings",
          "Sorting"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Sorting",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Capital One online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "16.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "capital-one",
    "logoUrl": "https://www.google.com/s2/favicons?domain=capitalone.com&sz=128",
    "logo": "https://cdn.simpleicons.org/capitalone"
  },
  {
    "id": "cisco",
    "slug": "cisco",
    "name": "Cisco Recruitment 2026",
    "fullName": "Cisco Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "CISC",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Cisco campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Networking (45m)",
      "Bit Manipulation (30m)",
      "Arrays (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Networking & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Networking",
          "Bit Manipulation",
          "Arrays"
        ]
      },
      {
        "num": 2,
        "name": "Bit Manipulation & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Bit Manipulation",
          "Arrays"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Test",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Aptitude + Coding",
        "keyTopics": [
          "Networking",
          "Bit Manipulation",
          "Arrays"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Networking",
            "freq": "High"
          },
          {
            "name": "Bit Manipulation",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Networking, Bit Manipulation problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Cisco online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "cisco",
    "logoUrl": "https://www.google.com/s2/favicons?domain=cisco.com&sz=128",
    "logo": "https://cdn.simpleicons.org/cisco"
  },
  {
    "id": "citadel",
    "slug": "citadel",
    "name": "Citadel Recruitment 2026",
    "fullName": "Citadel Placement Drive & Exam Pattern",
    "category": "FinTech & Quant",
    "logoTag": "CITA",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Citadel campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hard DP (45m)",
      "Graphs (30m)",
      "Math (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hard DP & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hard DP",
          "Graphs",
          "Math"
        ]
      },
      {
        "num": 2,
        "name": "Graphs & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Graphs",
          "Math"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "HackerRank OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Hard Coding Questions",
        "keyTopics": [
          "Hard DP",
          "Graphs",
          "Math"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hard DP",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Math",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hard DP, Graphs problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Citadel online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "16.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "citadel",
    "logoUrl": "https://www.google.com/s2/favicons?domain=citadel.com&sz=128",
    "logo": "https://cdn.simpleicons.org/citadel"
  },
  {
    "id": "citrix",
    "slug": "citrix",
    "name": "Citrix Recruitment 2026",
    "fullName": "Citrix Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "CITR",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Citrix campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Pointers (45m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Pointers & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Pointers",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Trees & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "OA Test",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Technical Questions",
        "keyTopics": [
          "Pointers",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Pointers",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Pointers, Trees problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Citrix online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "citrix",
    "logoUrl": "https://www.google.com/s2/favicons?domain=citrix.com&sz=128",
    "logo": "https://cdn.simpleicons.org/citrix"
  },
  {
    "id": "cohesity",
    "slug": "cohesity",
    "name": "Cohesity Recruitment 2026",
    "fullName": "Cohesity Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "COHE",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Cohesity campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Maps (45m)",
      "System Design (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Maps & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Maps",
          "System Design"
        ]
      },
      {
        "num": 2,
        "name": "System Design & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "System Design"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "Data Structures & File Systems",
        "keyTopics": [
          "Hash Maps",
          "System Design"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Maps",
            "freq": "High"
          },
          {
            "name": "System Design",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Maps, System Design problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Cohesity online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "cohesity",
    "logoUrl": "https://www.google.com/s2/favicons?domain=cohesity.com&sz=128",
    "logo": "https://cdn.simpleicons.org/cohesity"
  },
  {
    "id": "coursera",
    "slug": "coursera",
    "name": "Coursera Recruitment 2026",
    "fullName": "Coursera Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "COUR",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Coursera campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "API Design (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "API Design"
        ]
      },
      {
        "num": 2,
        "name": "API Design & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "API Design"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Interview",
        "roundType": "Technical & Coding",
        "duration": "60 Mins",
        "description": "Coding & Product Architecture",
        "keyTopics": [
          "Arrays",
          "API Design"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "API Design",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, API Design problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Coursera online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "coursera",
    "logoUrl": "https://www.google.com/s2/favicons?domain=coursera.com&sz=128",
    "logo": "https://cdn.simpleicons.org/coursera"
  },
  {
    "id": "cruise-automation",
    "slug": "cruise-automation",
    "name": "Cruise Automation Recruitment 2026",
    "fullName": "Cruise Automation Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "CRUI",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Cruise Automation campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Math (45m)",
      "Geometry (30m)",
      "Graphs (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Math & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Math",
          "Geometry",
          "Graphs"
        ]
      },
      {
        "num": 2,
        "name": "Geometry & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Geometry",
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Robotics Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "C++ Geometry & Graph Traversal",
        "keyTopics": [
          "Math",
          "Geometry",
          "Graphs"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Math",
            "freq": "High"
          },
          {
            "name": "Geometry",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Math, Geometry problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Cruise Automation online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "cruise-automation",
    "logoUrl": "https://www.google.com/s2/favicons?domain=getcruise.com&sz=128",
    "logo": "https://cdn.simpleicons.org/cruise"
  },
  {
    "id": "data-bricks",
    "slug": "data-bricks",
    "name": "Data Bricks Recruitment 2026",
    "fullName": "Data Bricks Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "DATA",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Data Bricks campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Tries (30m)",
      "Distributed Systems (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Tries",
          "Distributed Systems"
        ]
      },
      {
        "num": 2,
        "name": "Tries & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Tries",
          "Distributed Systems"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Complex Data Structures",
        "keyTopics": [
          "Trees",
          "Tries",
          "Distributed Systems"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Tries",
            "freq": "High"
          },
          {
            "name": "Distributed Systems",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Tries problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Data Bricks online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "data-bricks",
    "logoUrl": "https://www.google.com/s2/favicons?domain=databricks.com&sz=128",
    "logo": "https://cdn.simpleicons.org/databricks"
  },
  {
    "id": "doordash",
    "slug": "doordash",
    "name": "DoorDash Recruitment 2026",
    "fullName": "DoorDash Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "DOOR",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "DoorDash campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Intervals (30m)",
      "Heap (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Intervals",
          "Heap"
        ]
      },
      {
        "num": 2,
        "name": "Intervals & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Intervals",
          "Heap"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding & Algorithmic Efficiency",
        "keyTopics": [
          "Arrays",
          "Intervals",
          "Heap"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Intervals",
            "freq": "High"
          },
          {
            "name": "Heap",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Intervals problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing DoorDash online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "doordash",
    "logoUrl": "https://www.google.com/s2/favicons?domain=doordash.com&sz=128",
    "logo": "https://cdn.simpleicons.org/doordash"
  },
  {
    "id": "dropbox",
    "slug": "dropbox",
    "name": "DropBox Recruitment 2026",
    "fullName": "DropBox Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "DROP",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "DropBox campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Data Structures (45m)",
      "Concurrency (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Data Structures & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Data Structures",
          "Concurrency"
        ]
      },
      {
        "num": 2,
        "name": "Concurrency & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Concurrency"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Loop",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "File Systems & Concurrent Programming",
        "keyTopics": [
          "Data Structures",
          "Concurrency"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Data Structures",
            "freq": "High"
          },
          {
            "name": "Concurrency",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Data Structures, Concurrency problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing DropBox online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "dropbox",
    "logoUrl": "https://www.google.com/s2/favicons?domain=dropbox.com&sz=128",
    "logo": "https://cdn.simpleicons.org/dropbox"
  },
  {
    "id": "ebay",
    "slug": "ebay",
    "name": "Ebay Recruitment 2026",
    "fullName": "Ebay Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "EBAY",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Ebay campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Strings (45m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Strings & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Strings",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Trees & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Algorithmic Questions",
        "keyTopics": [
          "Strings",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Strings, Trees problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Ebay online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "ebay",
    "logoUrl": "https://www.google.com/s2/favicons?domain=ebay.com&sz=128",
    "logo": "https://cdn.simpleicons.org/ebay"
  },
  {
    "id": "facebook",
    "slug": "facebook",
    "name": "FaceBook Recruitment 2026",
    "fullName": "FaceBook Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "META",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "FaceBook campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Binary Search (45m)",
      "Trees (30m)",
      "Recursion (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Binary Search & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Binary Search",
          "Trees",
          "Recursion"
        ]
      },
      {
        "num": 2,
        "name": "Trees & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Trees",
          "Recursion"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Phone Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Questions in 45 Mins",
        "keyTopics": [
          "Binary Search",
          "Trees",
          "Recursion"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Binary Search",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Recursion",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Binary Search, Trees problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing FaceBook online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "facebook",
    "logoUrl": "https://www.google.com/s2/favicons?domain=meta.com&sz=128",
    "logo": "https://cdn.simpleicons.org/meta"
  },
  {
    "id": "flipkart",
    "slug": "flipkart",
    "name": "Flipkart Recruitment 2026",
    "fullName": "Flipkart Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "FLIP",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Flipkart campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Object Oriented Design (45m)",
      "DP (30m)",
      "Graphs (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Object Oriented Design & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Object Oriented Design",
          "DP",
          "Graphs"
        ]
      },
      {
        "num": 2,
        "name": "DP & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "DP",
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Machine Coding Round",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Low-Level Design & Coding in 90 Mins",
        "keyTopics": [
          "Object Oriented Design",
          "DP",
          "Graphs"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Object Oriented Design",
            "freq": "High"
          },
          {
            "name": "DP",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Object Oriented Design, DP problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Flipkart online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "SDE-1",
        "package": ""
      },
      {
        "title": "UI Engineer",
        "package": ""
      }
    ],
    "companySlug": "flipkart",
    "logoUrl": "https://www.google.com/s2/favicons?domain=flipkart.com&sz=128",
    "logo": "https://cdn.simpleicons.org/flipkart"
  },
  {
    "id": "goldman-sachs",
    "slug": "goldman-sachs",
    "name": "Goldman Sachs Recruitment 2026",
    "fullName": "Goldman Sachs Placement Drive & Exam Pattern",
    "category": "FinTech & Quant",
    "logoTag": "GOLD",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Goldman Sachs campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Math (45m)",
      "Arrays (30m)",
      "Dynamic Programming (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Math & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Math",
          "Arrays",
          "Dynamic Programming"
        ]
      },
      {
        "num": 2,
        "name": "Arrays & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Arrays",
          "Dynamic Programming"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "HackerRank Assessment",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Math + Coding + Aptitude",
        "keyTopics": [
          "Math",
          "Arrays",
          "Dynamic Programming"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Math",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Dynamic Programming",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Math, Arrays problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Goldman Sachs online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Engineering Analyst",
        "package": ""
      },
      {
        "title": "Quant Analyst",
        "package": ""
      }
    ],
    "companySlug": "goldman-sachs",
    "logoUrl": "https://www.google.com/s2/favicons?domain=goldmansachs.com&sz=128",
    "logo": "https://cdn.simpleicons.org/goldmansachs"
  },
  {
    "id": "google",
    "slug": "google",
    "name": "Google Recruitment 2026",
    "fullName": "Google Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "GOOG",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Google campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Graphs (45m)",
      "Dynamic Programming (30m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Graphs & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Graphs",
          "Dynamic Programming",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Dynamic Programming & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Dynamic Programming",
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Online Assessment",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Questions (90 Mins)",
        "keyTopics": [
          "Graphs",
          "Dynamic Programming",
          "Trees"
        ]
      },
      {
        "step": 2,
        "title": "Onsite Loop",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "4 Coding Rounds + Googleyness",
        "keyTopics": [
          "Graphs",
          "Dynamic Programming",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Dynamic Programming",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Graphs, Dynamic Programming problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Google online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "SWE L3 (Software Engineer)",
        "package": ""
      },
      {
        "title": "STEP Scholar",
        "package": ""
      }
    ],
    "companySlug": "google",
    "logoUrl": "https://www.google.com/s2/favicons?domain=google.com&sz=128",
    "logo": "https://cdn.simpleicons.org/google"
  },
  {
    "id": "hulu",
    "slug": "hulu",
    "name": "Hulu Recruitment 2026",
    "fullName": "Hulu Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "HULU",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Hulu campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Queue (45m)",
      "Hash Maps (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Queue & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Queue",
          "Hash Maps"
        ]
      },
      {
        "num": 2,
        "name": "Hash Maps & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Hash Maps"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding & Media Streaming Logic",
        "keyTopics": [
          "Queue",
          "Hash Maps"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Queue",
            "freq": "High"
          },
          {
            "name": "Hash Maps",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Queue, Hash Maps problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Hulu online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "hulu",
    "logoUrl": "https://www.google.com/s2/favicons?domain=hulu.com&sz=128",
    "logo": "https://cdn.simpleicons.org/hulu"
  },
  {
    "id": "ibm",
    "slug": "ibm",
    "name": "IBM Recruitment 2026",
    "fullName": "IBM Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "IBM",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "IBM campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Strings (45m)",
      "Matrices (30m)",
      "Sorting (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Strings & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Strings",
          "Matrices",
          "Sorting"
        ]
      },
      {
        "num": 2,
        "name": "Matrices & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Matrices",
          "Sorting"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "HackerRank OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Cognitive Assessment + Coding",
        "keyTopics": [
          "Strings",
          "Matrices",
          "Sorting"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Matrices",
            "freq": "High"
          },
          {
            "name": "Sorting",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Strings, Matrices problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing IBM online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "ibm",
    "logoUrl": "https://www.google.com/s2/favicons?domain=ibm.com&sz=128",
    "logo": "https://cdn.simpleicons.org/ibm"
  },
  {
    "id": "intel",
    "slug": "intel",
    "name": "Intel Recruitment 2026",
    "fullName": "Intel Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "INTE",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Intel campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Bit Manipulation (45m)",
      "Pointers (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Bit Manipulation & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Bit Manipulation",
          "Pointers"
        ]
      },
      {
        "num": 2,
        "name": "Pointers & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Pointers"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "C/C++ Pointer & Memory Logic",
        "keyTopics": [
          "Bit Manipulation",
          "Pointers"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Bit Manipulation",
            "freq": "High"
          },
          {
            "name": "Pointers",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Bit Manipulation, Pointers problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Intel online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "intel",
    "logoUrl": "https://www.google.com/s2/favicons?domain=intel.com&sz=128",
    "logo": "https://cdn.simpleicons.org/intel"
  },
  {
    "id": "intuit",
    "slug": "intuit",
    "name": "Intuit Recruitment 2026",
    "fullName": "Intuit Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "INTU",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Intuit campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Trees (30m)",
      "API Design (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Trees",
          "API Design"
        ]
      },
      {
        "num": 2,
        "name": "Trees & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Trees",
          "API Design"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Karat Interview",
        "roundType": "Technical & Coding",
        "duration": "60 Mins",
        "description": "1 Coding Question + Architecture",
        "keyTopics": [
          "Arrays",
          "Trees",
          "API Design"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "API Design",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Trees problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Intuit online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "intuit",
    "logoUrl": "https://www.google.com/s2/favicons?domain=intuit.com&sz=128",
    "logo": "https://cdn.simpleicons.org/intuit"
  },
  {
    "id": "jp-morgan",
    "slug": "jp-morgan",
    "name": "Jp Morgan Recruitment 2026",
    "fullName": "Jp Morgan Placement Drive & Exam Pattern",
    "category": "FinTech & Quant",
    "logoTag": "JP M",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Jp Morgan campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Strings (30m)",
      "Dynamic Programming (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Strings",
          "Dynamic Programming"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings",
          "Dynamic Programming"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "HireVue Assessment",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Problems + Behavioral Video",
        "keyTopics": [
          "Arrays",
          "Strings",
          "Dynamic Programming"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Dynamic Programming",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Jp Morgan online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer Trainee",
        "package": ""
      },
      {
        "title": "Tech Analyst",
        "package": ""
      }
    ],
    "companySlug": "jp-morgan",
    "logoUrl": "https://www.google.com/s2/favicons?domain=jpmorganchase.com&sz=128",
    "logo": "https://cdn.simpleicons.org/jpmorgan"
  },
  {
    "id": "linkedin",
    "slug": "linkedin",
    "name": "Linkedin Recruitment 2026",
    "fullName": "Linkedin Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "LINK",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Linkedin campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Graphs (30m)",
      "Concurrency (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Graphs",
          "Concurrency"
        ]
      },
      {
        "num": 2,
        "name": "Graphs & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Graphs",
          "Concurrency"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Phone Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Questions",
        "keyTopics": [
          "Trees",
          "Graphs",
          "Concurrency"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Concurrency",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Graphs problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Linkedin online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "linkedin",
    "logoUrl": "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128",
    "logo": "https://cdn.simpleicons.org/linkedin"
  },
  {
    "id": "lyft",
    "slug": "lyft",
    "name": "Lyft Recruitment 2026",
    "fullName": "Lyft Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "LYFT",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Lyft campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Intervals (45m)",
      "Maps (30m)",
      "Sliding Window (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Intervals & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Intervals",
          "Maps",
          "Sliding Window"
        ]
      },
      {
        "num": 2,
        "name": "Maps & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Maps",
          "Sliding Window"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "Intervals & Algorithmic Logic",
        "keyTopics": [
          "Intervals",
          "Maps",
          "Sliding Window"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Intervals",
            "freq": "High"
          },
          {
            "name": "Maps",
            "freq": "High"
          },
          {
            "name": "Sliding Window",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Intervals, Maps problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Lyft online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "lyft",
    "logoUrl": "https://www.google.com/s2/favicons?domain=lyft.com&sz=128",
    "logo": "https://cdn.simpleicons.org/lyft"
  },
  {
    "id": "mathworks",
    "slug": "mathworks",
    "name": "MathWorks Recruitment 2026",
    "fullName": "MathWorks Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "MATH",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "MathWorks campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Matrices (45m)",
      "Algorithms (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Matrices & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Matrices",
          "Algorithms"
        ]
      },
      {
        "num": 2,
        "name": "Algorithms & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Algorithms"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "OA Test",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Math & Data Structures",
        "keyTopics": [
          "Matrices",
          "Algorithms"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Matrices",
            "freq": "High"
          },
          {
            "name": "Algorithms",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Matrices, Algorithms problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing MathWorks online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "mathworks",
    "logoUrl": "https://www.google.com/s2/favicons?domain=mathworks.com&sz=128",
    "logo": "https://cdn.simpleicons.org/mathworks"
  },
  {
    "id": "microsoft",
    "slug": "microsoft",
    "name": "Microsoft Recruitment 2026",
    "fullName": "Microsoft Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "MSFT",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Microsoft campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Strings (45m)",
      "Linked Lists (30m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Strings & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Strings",
          "Linked Lists",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Linked Lists & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Linked Lists",
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Codility OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "3 Coding Questions in 100 Mins",
        "keyTopics": [
          "Strings",
          "Linked Lists",
          "Trees"
        ]
      },
      {
        "step": 2,
        "title": "Final Loop",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "4 Technical Rounds",
        "keyTopics": [
          "Strings",
          "Linked Lists",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Linked Lists",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Strings, Linked Lists problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Microsoft online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "SDE-1",
        "package": ""
      },
      {
        "title": "Software Support Engineer",
        "package": ""
      }
    ],
    "companySlug": "microsoft",
    "logoUrl": "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
    "logo": "https://cdn.simpleicons.org/microsoft"
  },
  {
    "id": "nvidia",
    "slug": "nvidia",
    "name": "Nvidia Recruitment 2026",
    "fullName": "Nvidia Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "NVID",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Nvidia campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Bit Manipulation (45m)",
      "Arrays (30m)",
      "Pointers (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Bit Manipulation & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Bit Manipulation",
          "Arrays",
          "Pointers"
        ]
      },
      {
        "num": 2,
        "name": "Arrays & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Arrays",
          "Pointers"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "C++ Memory Management & Algorithms",
        "keyTopics": [
          "Bit Manipulation",
          "Arrays",
          "Pointers"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Bit Manipulation",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Pointers",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Bit Manipulation, Arrays problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Nvidia online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "nvidia",
    "logoUrl": "https://www.google.com/s2/favicons?domain=nvidia.com&sz=128",
    "logo": "https://cdn.simpleicons.org/nvidia"
  },
  {
    "id": "oracle",
    "slug": "oracle",
    "name": "Oracle Recruitment 2026",
    "fullName": "Oracle Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "ORAC",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Oracle campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "SQL (30m)",
      "Arrays (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "SQL",
          "Arrays"
        ]
      },
      {
        "num": 2,
        "name": "SQL & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "SQL",
          "Arrays"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Test",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Algorithmic Questions",
        "keyTopics": [
          "Trees",
          "SQL",
          "Arrays"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "SQL",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, SQL problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Oracle online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "oracle",
    "logoUrl": "https://www.google.com/s2/favicons?domain=oracle.com&sz=128",
    "logo": "https://cdn.simpleicons.org/oracle"
  },
  {
    "id": "salesforce",
    "slug": "salesforce",
    "name": "SalesForce Recruitment 2026",
    "fullName": "SalesForce Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "SALE",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "SalesForce campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Maps (45m)",
      "Strings (30m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Maps & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Maps",
          "Strings",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings",
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "CodeSignal OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "4 Coding Problems",
        "keyTopics": [
          "Hash Maps",
          "Strings",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Maps",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Maps, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing SalesForce online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "salesforce",
    "logoUrl": "https://www.google.com/s2/favicons?domain=salesforce.com&sz=128",
    "logo": "https://cdn.simpleicons.org/salesforce"
  },
  {
    "id": "samsung",
    "slug": "samsung",
    "name": "Samsung Recruitment 2026",
    "fullName": "Samsung Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "SAMS",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Samsung campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "BFS/DFS Grid Traversal (45m)",
      "Backtracking (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "BFS/DFS Grid Traversal & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "BFS/DFS Grid Traversal",
          "Backtracking"
        ]
      },
      {
        "num": 2,
        "name": "Backtracking & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Backtracking"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Samsung SW Competency Test",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "1 Hard BFS/DFS Grid Question in 3 Hours",
        "keyTopics": [
          "BFS/DFS Grid Traversal",
          "Backtracking"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "BFS/DFS Grid Traversal",
            "freq": "High"
          },
          {
            "name": "Backtracking",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master BFS/DFS Grid Traversal, Backtracking problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Samsung online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "samsung",
    "logoUrl": "https://www.google.com/s2/favicons?domain=samsung.com&sz=128",
    "logo": "https://cdn.simpleicons.org/samsung"
  },
  {
    "id": "sap",
    "slug": "sap",
    "name": "Sap Recruitment 2026",
    "fullName": "Sap Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "SAP",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Sap campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Strings (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Strings"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Test",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "Aptitude & Basic DSA",
        "keyTopics": [
          "Arrays",
          "Strings"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Sap online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "sap",
    "logoUrl": "https://www.google.com/s2/favicons?domain=sap.com&sz=128",
    "logo": "https://cdn.simpleicons.org/sap"
  },
  {
    "id": "servicenow",
    "slug": "servicenow",
    "name": "ServiceNow Recruitment 2026",
    "fullName": "ServiceNow Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "SERV",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "ServiceNow campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Dynamic Programming (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Dynamic Programming"
        ]
      },
      {
        "num": 2,
        "name": "Dynamic Programming & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Dynamic Programming"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "HackerRank OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "3 Coding Questions",
        "keyTopics": [
          "Trees",
          "Dynamic Programming"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Dynamic Programming",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Dynamic Programming problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing ServiceNow online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "servicenow",
    "logoUrl": "https://www.google.com/s2/favicons?domain=servicenow.com&sz=128",
    "logo": "https://cdn.simpleicons.org/servicenow"
  },
  {
    "id": "snapchat",
    "slug": "snapchat",
    "name": "Snapchat Recruitment 2026",
    "fullName": "Snapchat Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "SNAP",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Snapchat campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Graphs (45m)",
      "Heap (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Graphs & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Graphs",
          "Heap"
        ]
      },
      {
        "num": 2,
        "name": "Heap & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Heap"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Phone Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding & Data Structure Design",
        "keyTopics": [
          "Graphs",
          "Heap"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Heap",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Graphs, Heap problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Snapchat online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "snapchat",
    "logoUrl": "https://www.google.com/s2/favicons?domain=snapchat.com&sz=128",
    "logo": "https://cdn.simpleicons.org/snapchat"
  },
  {
    "id": "splunk",
    "slug": "splunk",
    "name": "Splunk Recruitment 2026",
    "fullName": "Splunk Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "SPLU",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Splunk campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Strings (45m)",
      "Maps (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Strings & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Strings",
          "Maps"
        ]
      },
      {
        "num": 2,
        "name": "Maps & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Maps"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Test",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Algorithmic Questions",
        "keyTopics": [
          "Strings",
          "Maps"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Maps",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Strings, Maps problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Splunk online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "splunk",
    "logoUrl": "https://www.google.com/s2/favicons?domain=splunk.com&sz=128",
    "logo": "https://cdn.simpleicons.org/splunk"
  },
  {
    "id": "spotify",
    "slug": "spotify",
    "name": "Spotify Recruitment 2026",
    "fullName": "Spotify Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "SPOT",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Spotify campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Lists (45m)",
      "System Architecture (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Lists & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Lists",
          "System Architecture"
        ]
      },
      {
        "num": 2,
        "name": "System Architecture & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "System Architecture"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Technical Questions",
        "keyTopics": [
          "Lists",
          "System Architecture"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Lists",
            "freq": "High"
          },
          {
            "name": "System Architecture",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Lists, System Architecture problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Spotify online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "spotify",
    "logoUrl": "https://www.google.com/s2/favicons?domain=spotify.com&sz=128",
    "logo": "https://cdn.simpleicons.org/spotify"
  },
  {
    "id": "square",
    "slug": "square",
    "name": "Square Recruitment 2026",
    "fullName": "Square Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "SQUA",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Square campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Object Oriented Design (45m)",
      "Arrays (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Object Oriented Design & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Object Oriented Design",
          "Arrays"
        ]
      },
      {
        "num": 2,
        "name": "Arrays & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Arrays"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Pair Programming Interview",
        "roundType": "Technical & Coding",
        "duration": "60 Mins",
        "description": "Refactoring & API Coding",
        "keyTopics": [
          "Object Oriented Design",
          "Arrays"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Object Oriented Design",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Object Oriented Design, Arrays problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Square online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "square",
    "logoUrl": "https://www.google.com/s2/favicons?domain=squareup.com&sz=128",
    "logo": "https://cdn.simpleicons.org/square"
  },
  {
    "id": "sumologic",
    "slug": "sumologic",
    "name": "SumoLogic Recruitment 2026",
    "fullName": "SumoLogic Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "SUMO",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "SumoLogic campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Tables (45m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Tables & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Tables"
        ]
      },
      {
        "num": 2,
        "name": "Algorithms & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "DP",
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "Data Structures",
        "keyTopics": [
          "Hash Tables"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Tables",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Tables problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing SumoLogic online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "sumologic",
    "logoUrl": "https://www.google.com/s2/favicons?domain=sumologic.com&sz=128",
    "logo": "https://cdn.simpleicons.org/sumologic"
  },
  {
    "id": "tableau",
    "slug": "tableau",
    "name": "Tableau Recruitment 2026",
    "fullName": "Tableau Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "TABL",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Tableau campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Graphs (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Graphs"
        ]
      },
      {
        "num": 2,
        "name": "Graphs & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Test",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding & Analytics",
        "keyTopics": [
          "Trees",
          "Graphs"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Graphs problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Tableau online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "tableau",
    "logoUrl": "https://www.google.com/s2/favicons?domain=tableau.com&sz=128",
    "logo": "https://cdn.simpleicons.org/tableau"
  },
  {
    "id": "tencent",
    "slug": "tencent",
    "name": "Tencent Recruitment 2026",
    "fullName": "Tencent Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "TENC",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Tencent campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Dynamic Programming (45m)",
      "Graphs (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Dynamic Programming & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Dynamic Programming",
          "Graphs"
        ]
      },
      {
        "num": 2,
        "name": "Graphs & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Interview",
        "roundType": "Interview",
        "duration": "60 Mins",
        "description": "Algorithms & System Design",
        "keyTopics": [
          "Dynamic Programming",
          "Graphs"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Dynamic Programming",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Dynamic Programming, Graphs problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Tencent online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "tencent",
    "logoUrl": "https://www.google.com/s2/favicons?domain=tencent.com&sz=128",
    "logo": "https://cdn.simpleicons.org/tencent"
  },
  {
    "id": "tesla",
    "slug": "tesla",
    "name": "Tesla Recruitment 2026",
    "fullName": "Tesla Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "TESL",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Tesla campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Math (45m)",
      "Geometry (30m)",
      "C++ Pointers (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Math & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Math",
          "Geometry",
          "C++ Pointers"
        ]
      },
      {
        "num": 2,
        "name": "Geometry & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Geometry",
          "C++ Pointers"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Interview",
        "roundType": "Technical & Coding",
        "duration": "60 Mins",
        "description": "Coding & Low-level Optimization",
        "keyTopics": [
          "Math",
          "Geometry",
          "C++ Pointers"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Math",
            "freq": "High"
          },
          {
            "name": "Geometry",
            "freq": "High"
          },
          {
            "name": "C++ Pointers",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Math, Geometry problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Tesla online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "tesla",
    "logoUrl": "https://www.google.com/s2/favicons?domain=tesla.com&sz=128",
    "logo": "https://cdn.simpleicons.org/tesla"
  },
  {
    "id": "tripadvisor",
    "slug": "tripadvisor",
    "name": "Tripadvisor Recruitment 2026",
    "fullName": "Tripadvisor Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "TRIP",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Tripadvisor campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Strings (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Strings"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Algorithmic Questions",
        "keyTopics": [
          "Arrays",
          "Strings"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Tripadvisor online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "tripadvisor",
    "logoUrl": "https://www.google.com/s2/favicons?domain=tripadvisor.com&sz=128",
    "logo": "https://cdn.simpleicons.org/tripadvisor"
  },
  {
    "id": "triplebyte",
    "slug": "triplebyte",
    "name": "TripleByte Recruitment 2026",
    "fullName": "TripleByte Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "TRIP",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "TripleByte campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Debugging (45m)",
      "Arrays (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Debugging & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Debugging",
          "Arrays"
        ]
      },
      {
        "num": 2,
        "name": "Arrays & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Arrays"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Assessment",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "DSA Quiz & Practical Code",
        "keyTopics": [
          "Debugging",
          "Arrays"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Debugging",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Debugging, Arrays problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing TripleByte online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "triplebyte",
    "logoUrl": "https://www.google.com/s2/favicons?domain=triplebyte.com&sz=128",
    "logo": "https://cdn.simpleicons.org/triplebyte"
  },
  {
    "id": "twilio",
    "slug": "twilio",
    "name": "Twilio Recruitment 2026",
    "fullName": "Twilio Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "TWIL",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Twilio campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Maps (45m)",
      "Strings (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Maps & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Maps",
          "Strings"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "API & Algorithmic Problem Solving",
        "keyTopics": [
          "Hash Maps",
          "Strings"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Maps",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Maps, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Twilio online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "twilio",
    "logoUrl": "https://www.google.com/s2/favicons?domain=twilio.com&sz=128",
    "logo": "https://cdn.simpleicons.org/twilio"
  },
  {
    "id": "twitch",
    "slug": "twitch",
    "name": "Twitch Recruitment 2026",
    "fullName": "Twitch Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "TWIT",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Twitch campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Queue (45m)",
      "Trees (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Queue & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Queue",
          "Trees"
        ]
      },
      {
        "num": 2,
        "name": "Trees & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Trees"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Interview",
        "roundType": "Technical & Coding",
        "duration": "60 Mins",
        "description": "System & Algorithmic Coding",
        "keyTopics": [
          "Queue",
          "Trees"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Queue",
            "freq": "High"
          },
          {
            "name": "Trees",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Queue, Trees problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Twitch online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "twitch",
    "logoUrl": "https://www.google.com/s2/favicons?domain=twitch.tv&sz=128",
    "logo": "https://cdn.simpleicons.org/twitch"
  },
  {
    "id": "twitter",
    "slug": "twitter",
    "name": "Twitter Recruitment 2026",
    "fullName": "Twitter Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "TWTR",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Twitter campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Graphs (45m)",
      "Tries (30m)",
      "Heap (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Graphs & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Graphs",
          "Tries",
          "Heap"
        ]
      },
      {
        "num": 2,
        "name": "Tries & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Tries",
          "Heap"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "HackerRank OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Algorithmic Problems",
        "keyTopics": [
          "Graphs",
          "Tries",
          "Heap"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Tries",
            "freq": "High"
          },
          {
            "name": "Heap",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Graphs, Tries problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Twitter online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "twitter",
    "logoUrl": "https://www.google.com/s2/favicons?domain=x.com&sz=128",
    "logo": "https://cdn.simpleicons.org/x"
  },
  {
    "id": "two-sigma",
    "slug": "two-sigma",
    "name": "Two Sigma Recruitment 2026",
    "fullName": "Two Sigma Placement Drive & Exam Pattern",
    "category": "FinTech & Quant",
    "logoTag": "TWO ",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Two Sigma campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hard DP (45m)",
      "Graphs (30m)",
      "Concurrency (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hard DP & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hard DP",
          "Graphs",
          "Concurrency"
        ]
      },
      {
        "num": 2,
        "name": "Graphs & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Graphs",
          "Concurrency"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical OA",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Mathematical & Data Structure Problems",
        "keyTopics": [
          "Hard DP",
          "Graphs",
          "Concurrency"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hard DP",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Concurrency",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hard DP, Graphs problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Two Sigma online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "16.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "two-sigma",
    "logoUrl": "https://www.google.com/s2/favicons?domain=twosigma.com&sz=128",
    "logo": "https://cdn.simpleicons.org/twosigma"
  },
  {
    "id": "uber",
    "slug": "uber",
    "name": "Uber Recruitment 2026",
    "fullName": "Uber Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "UBER",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Uber campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Graphs (45m)",
      "Intervals (30m)",
      "Heap (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Graphs & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Graphs",
          "Intervals",
          "Heap"
        ]
      },
      {
        "num": 2,
        "name": "Intervals & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Intervals",
          "Heap"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Algorithmic Questions",
        "keyTopics": [
          "Graphs",
          "Intervals",
          "Heap"
        ]
      },
      {
        "step": 2,
        "title": "Onsite Loop",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding + Architecture",
        "keyTopics": [
          "Graphs",
          "Intervals",
          "Heap"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Graphs",
            "freq": "High"
          },
          {
            "name": "Intervals",
            "freq": "High"
          },
          {
            "name": "Heap",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Graphs, Intervals problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Uber online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "uber",
    "logoUrl": "https://www.google.com/s2/favicons?domain=uber.com&sz=128",
    "logo": "https://cdn.simpleicons.org/uber"
  },
  {
    "id": "visa",
    "slug": "visa",
    "name": "Visa Recruitment 2026",
    "fullName": "Visa Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "VISA",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Visa campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Strings (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Strings"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "CodeSignal Test",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "4 Coding Questions",
        "keyTopics": [
          "Arrays",
          "Strings"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Visa online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "visa",
    "logoUrl": "https://www.google.com/s2/favicons?domain=visa.com&sz=128",
    "logo": "https://cdn.simpleicons.org/visa"
  },
  {
    "id": "vmware",
    "slug": "vmware",
    "name": "VMWARE Recruitment 2026",
    "fullName": "VMWARE Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "VMWA",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "VMWARE campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Graphs (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Graphs"
        ]
      },
      {
        "num": 2,
        "name": "Graphs & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Online Assessment",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "2 Coding Questions",
        "keyTopics": [
          "Trees",
          "Graphs"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Graphs",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Graphs problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing VMWARE online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "vmware",
    "logoUrl": "https://www.google.com/s2/favicons?domain=vmware.com&sz=128",
    "logo": "https://cdn.simpleicons.org/vmware"
  },
  {
    "id": "wayfair",
    "slug": "wayfair",
    "name": "WayFair Recruitment 2026",
    "fullName": "WayFair Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "WAYF",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "WayFair campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Maps (45m)",
      "Arrays (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Maps & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Maps",
          "Arrays"
        ]
      },
      {
        "num": 2,
        "name": "Arrays & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Arrays"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Coding & System Discussion",
        "keyTopics": [
          "Hash Maps",
          "Arrays"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Maps",
            "freq": "High"
          },
          {
            "name": "Arrays",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Maps, Arrays problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing WayFair online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "wayfair",
    "logoUrl": "https://www.google.com/s2/favicons?domain=wayfair.com&sz=128",
    "logo": "https://cdn.simpleicons.org/wayfair"
  },
  {
    "id": "wish",
    "slug": "wish",
    "name": "Wish Recruitment 2026",
    "fullName": "Wish Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "WISH",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Wish campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Strings (45m)",
      "Pointers (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Strings & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Strings",
          "Pointers"
        ]
      },
      {
        "num": 2,
        "name": "Pointers & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Pointers"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Test",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Technical Questions",
        "keyTopics": [
          "Strings",
          "Pointers"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Strings",
            "freq": "High"
          },
          {
            "name": "Pointers",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Strings, Pointers problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Wish online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "wish",
    "logoUrl": "https://www.google.com/s2/favicons?domain=wish.com&sz=128",
    "logo": "https://cdn.simpleicons.org/wish"
  },
  {
    "id": "yahoo",
    "slug": "yahoo",
    "name": "Yahoo Recruitment 2026",
    "fullName": "Yahoo Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "YAHO",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Yahoo campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Hash Maps (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Hash Maps"
        ]
      },
      {
        "num": 2,
        "name": "Hash Maps & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Hash Maps"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "DSA Fundamentals",
        "keyTopics": [
          "Trees",
          "Hash Maps"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Hash Maps",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Hash Maps problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Yahoo online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "yahoo",
    "logoUrl": "https://www.google.com/s2/favicons?domain=yahoo.com&sz=128",
    "logo": "https://cdn.simpleicons.org/yahoo"
  },
  {
    "id": "yandex",
    "slug": "yandex",
    "name": "Yandex Recruitment 2026",
    "fullName": "Yandex Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "YAND",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Yandex campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Two Pointers (45m)",
      "Binary Search (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Two Pointers & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Two Pointers",
          "Binary Search"
        ]
      },
      {
        "num": 2,
        "name": "Binary Search & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Binary Search"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Algorithmic Questions",
        "keyTopics": [
          "Two Pointers",
          "Binary Search"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Two Pointers",
            "freq": "High"
          },
          {
            "name": "Binary Search",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Two Pointers, Binary Search problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Yandex online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "yandex",
    "logoUrl": "https://www.google.com/s2/favicons?domain=yandex.com&sz=128",
    "logo": "https://cdn.simpleicons.org/yandex"
  },
  {
    "id": "yelp",
    "slug": "yelp",
    "name": "Yelp Recruitment 2026",
    "fullName": "Yelp Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "YELP",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Yelp campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Hash Maps (45m)",
      "Strings (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Hash Maps & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Hash Maps",
          "Strings"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "1 Coding Question + Design",
        "keyTopics": [
          "Hash Maps",
          "Strings"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Hash Maps",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Hash Maps, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Yelp online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "yelp",
    "logoUrl": "https://www.google.com/s2/favicons?domain=yelp.com&sz=128",
    "logo": "https://cdn.simpleicons.org/yelp"
  },
  {
    "id": "zenefits",
    "slug": "zenefits",
    "name": "Zenefits Recruitment 2026",
    "fullName": "Zenefits Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "ZENE",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Zenefits campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays"
        ]
      },
      {
        "num": 2,
        "name": "Algorithms & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "DP",
          "Graphs"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Test",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Basic Algorithmic Questions",
        "keyTopics": [
          "Arrays"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Zenefits online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "zenefits",
    "logoUrl": "https://www.google.com/s2/favicons?domain=zenefits.com&sz=128",
    "logo": "https://cdn.simpleicons.org/zenefits"
  },
  {
    "id": "zillow",
    "slug": "zillow",
    "name": "Zillow Recruitment 2026",
    "fullName": "Zillow Placement Drive & Exam Pattern",
    "category": "Consulting & Core",
    "logoTag": "ZILL",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Zillow campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Trees (45m)",
      "Hash Maps (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Trees & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Trees",
          "Hash Maps"
        ]
      },
      {
        "num": 2,
        "name": "Hash Maps & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Medium",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Hash Maps"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Technical Screen",
        "roundType": "Technical & Coding",
        "duration": "90 Mins",
        "description": "Data Structure Coding",
        "keyTopics": [
          "Trees",
          "Hash Maps"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Trees",
            "freq": "High"
          },
          {
            "name": "Hash Maps",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Trees, Hash Maps problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Zillow online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "8.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "zillow",
    "logoUrl": "https://www.google.com/s2/favicons?domain=zillow.com&sz=128",
    "logo": "https://cdn.simpleicons.org/zillow"
  },
  {
    "id": "zoho",
    "slug": "zoho",
    "name": "Zoho Recruitment 2026",
    "fullName": "Zoho Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "ZOHO",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Zoho campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Matrix Operations (45m)",
      "Recursion (30m)",
      "Data Structures (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Matrix Operations & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Matrix Operations",
          "Recursion",
          "Data Structures"
        ]
      },
      {
        "num": 2,
        "name": "Recursion & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Recursion",
          "Data Structures"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "C/C++ Programming Round",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "Matrices & Pattern Printing",
        "keyTopics": [
          "Matrix Operations",
          "Recursion",
          "Data Structures"
        ]
      },
      {
        "step": 2,
        "title": "Advanced Programming Round",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "Complex Data Structure Implementation",
        "keyTopics": [
          "Matrix Operations",
          "Recursion",
          "Data Structures"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Matrix Operations",
            "freq": "High"
          },
          {
            "name": "Recursion",
            "freq": "High"
          },
          {
            "name": "Data Structures",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Matrix Operations, Recursion problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Zoho online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Developer",
        "package": ""
      },
      {
        "title": "Member of Technical Staff",
        "package": ""
      }
    ],
    "companySlug": "zoho",
    "logoUrl": "https://www.google.com/s2/favicons?domain=zoho.com&sz=128",
    "logo": "https://cdn.simpleicons.org/zoho"
  },
  {
    "id": "zulily",
    "slug": "zulily",
    "name": "Zulily Recruitment 2026",
    "fullName": "Zulily Placement Drive & Exam Pattern",
    "category": "Product Global",
    "logoTag": "ZULI",
    "roles": "Software Engineer & Technology Analyst",
    "ctcPackage": "",
    "duration": "90 \u2013 120 Mins",
    "questionsCount": "2 \u2013 4 Coding Problems",
    "negativeMarking": "No Negative Marking",
    "adaptiveMode": "Online Assessment (OA)",
    "eligibility": "60% or 6.0 CGPA in 10th, 12th, and B.Tech / M.Tech / MCA with no active backlogs.",
    "overview": "Zulily campus placement hiring process evaluates strong Data Structures, Algorithms, problem solving speed, and technical fundamentals.",
    "quickSections": [
      "Arrays (45m)",
      "Strings (30m)"
    ],
    "sections": [
      {
        "num": 1,
        "name": "Arrays & Data Structures",
        "questions": "2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Test Cases Score",
        "difficulty": "Medium-Hard",
        "diffBg": "bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        "diffText": "text-[#38BDF8]",
        "focusTopics": [
          "Arrays",
          "Strings"
        ]
      },
      {
        "num": 2,
        "name": "Strings & Advanced Logic",
        "questions": "1-2 Questions",
        "time": "45 Mins",
        "avgTimePerQ": "22.5 Mins",
        "marking": "Code Efficiency",
        "difficulty": "Hard",
        "diffBg": "bg-[#A855F7]/15 border border-[#A855F7]/30",
        "diffText": "text-[#A855F7]",
        "focusTopics": [
          "Strings"
        ]
      }
    ],
    "stages": [
      {
        "step": 1,
        "title": "Coding Test",
        "roundType": "Interview",
        "duration": "90 Mins",
        "description": "2 Technical Questions",
        "keyTopics": [
          "Arrays",
          "Strings"
        ]
      }
    ],
    "syllabus": [
      {
        "title": "Core Technical & DSA",
        "icon": "fa-solid fa-code",
        "importance": "Must Master",
        "topics": [
          {
            "name": "Arrays",
            "freq": "High"
          },
          {
            "name": "Strings",
            "freq": "High"
          }
        ]
      },
      {
        "title": "Computer Science Fundamentals",
        "icon": "fa-solid fa-layer-group",
        "importance": "High Priority",
        "topics": [
          {
            "name": "OOPs Concepts & Polymorphism",
            "freq": "High"
          },
          {
            "name": "DBMS Indexing & SQL Queries",
            "freq": "High"
          },
          {
            "name": "OS Process Threading & Memory",
            "freq": "Medium"
          }
        ]
      }
    ],
    "prepStrategy": {
      "doList": [
        "Master Arrays, Strings problem patterns thoroughly on our DSA sheet.",
        "Explain your space and time complexity trade-offs clearly.",
        "Ensure all public and hidden edge cases pass cleanly."
      ],
      "dontList": [
        "Do not write brute force solutions without discussing optimal O(N) or O(N log N) approaches.",
        "Do not jump directly to coding without first dry-running sample inputs."
      ],
      "cutoffInsight": "Clearing Zulily online assessment requires passing 100% test cases for coding problems."
    },
    "hiringRoles": [
      {
        "title": "Software Engineer",
        "package": "14.0"
      },
      {
        "title": "Senior Tech Specialist",
        "package": ""
      }
    ],
    "companySlug": "zulily",
    "logoUrl": "https://www.google.com/s2/favicons?domain=zulily.com&sz=128",
    "logo": "https://cdn.simpleicons.org/zulily"
  }
];

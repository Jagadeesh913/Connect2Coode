import React, { useState } from 'react';
import { Badge } from '../../../shared/components/ui/Badge';

export interface InterviewQuestionItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  frequency: string;
  companies: string[];
  codeExample?: string;
}

const CORE_CS_QUESTIONS: InterviewQuestionItem[] = [
  {
    id: 'dbms-1',
    category: 'DBMS',
    question: 'What are ACID properties in a Database Management System?',
    answer: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.\n• Atomicity: Entire transaction happens at once or doesn’t happen at all.\n• Consistency: Database must remain in a consistent state before and after the transaction.\n• Isolation: Multiple transactions occur independently without interference.\n• Durability: Changes of a successful transaction are permanently saved even in case of system failure.',
    frequency: 'High',
    companies: ['Amazon', 'Microsoft', 'TCS', 'Infosys'],
    codeExample: 'START TRANSACTION;\nUPDATE Accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE Accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;',
  },
  {
    id: 'dbms-2',
    category: 'DBMS',
    question: 'What is the difference between Primary Key, Unique Key, and Foreign Key?',
    answer: '• Primary Key: Uniquely identifies each record in a table. Does not allow NULL values.\n• Unique Key: Uniquely identifies each record, but allows one NULL value.\n• Foreign Key: A field in one table that uniquely identifies a row of another table, maintaining referential integrity.',
    frequency: 'Very High',
    companies: ['Accenture', 'Cognizant', 'Capgemini', 'Wipro'],
  },
  {
    id: 'os-1',
    category: 'Operating Systems',
    question: 'What is the difference between Process and Thread?',
    answer: '• Process: An executing instance of a program with its own dedicated memory space (address space).\n• Thread: A lightweight unit of execution within a process sharing the process memory and resources, with faster context switching.',
    frequency: 'High',
    companies: ['Google', 'Adobe', 'Oracle', 'Samsung'],
  },
  {
    id: 'os-2',
    category: 'Operating Systems',
    question: 'What is Deadlock and what are the 4 Coffman conditions required for Deadlock to occur?',
    answer: 'A Deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process.\n1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.\n2. Hold and Wait: A process is holding at least one resource and requesting additional resources.\n3. No Preemption: Resources cannot be forcibly taken from a process.\n4. Circular Wait: A set of processes waiting for each other in a circular chain.',
    frequency: 'Very High',
    companies: ['Amazon', 'Cisco', 'Qualcomm', 'Intel'],
  },
  {
    id: 'cn-1',
    category: 'Computer Networks',
    question: 'What is the difference between TCP and UDP?',
    answer: '• TCP (Transmission Control Protocol): Connection-oriented, reliable (guarantees delivery via ACKs), error-checking, flow control, slower. Used in HTTP/HTTPS, FTP, SMTP.\n• UDP (User Datagram Protocol): Connectionless, unreliable (no ACK/guarantee), fast, lightweight. Used in Video streaming, VoIP, DNS queries, Online gaming.',
    frequency: 'Very High',
    companies: ['Cisco', 'Paytm', 'Swiggy', 'Zomato'],
  },
  {
    id: 'oops-1',
    category: 'OOPS',
    question: 'Explain the 4 Pillars of Object-Oriented Programming with real-world examples.',
    answer: '1. Encapsulation: Wrapping data (variables) and code (methods) together into a single unit (class) and restricting direct access (private fields with getters/setters).\n2. Abstraction: Hiding internal implementation details and showing only necessary features to the user (interfaces, abstract classes).\n3. Inheritance: Mechanism where a child class acquires properties and behaviors of a parent class (code reusability).\n4. Polymorphism: Ability to take more than one form — Compile-time (Method Overloading) and Runtime (Method Overriding).',
    frequency: 'Top Asked',
    companies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Amazon'],
    codeExample: '// Polymorphism (Method Overriding)\nclass Animal {\n  void sound() { System.out.println("Animal sound"); }\n}\nclass Dog extends Animal {\n  @Override\n  void sound() { System.out.println("Bark"); }\n}',
  },
];

export const InterviewPrep: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  const categories = ['All', 'DBMS', 'Operating Systems', 'Computer Networks', 'OOPS'];

  const filteredQuestions = activeCategory === 'All'
    ? CORE_CS_QUESTIONS
    : CORE_CS_QUESTIONS.filter((q) => q.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-heading">
          Core Computer Science Interview Questions
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Frequently asked technical interview questions for DBMS, Operating Systems, Networks, and OOPS.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-neutral-100 text-neutral-900 text-black border-neutral-600 font-bold shadow-sm'
                : 'bg-neutral-800 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Questions Accordion List */}
      <div className="flex flex-col gap-3.5">
        {filteredQuestions.map((q) => {
          const isExpanded = expandedAnswers[q.id];
          return (
            <div
              key={q.id}
              className="bg-neutral-800 border border-white/10 hover:border-neutral-700 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleExpand(q.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary">{q.category}</Badge>
                    <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Freq: {q.frequency}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100 mt-1">{q.question}</h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <i className={`fa-solid ${isExpanded ? 'fa-chevron-up text-neutral-300' : 'fa-chevron-down text-gray-500'} text-sm`}></i>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/10 flex flex-col gap-4 text-xs font-sans leading-relaxed text-gray-300">
                  <div className="whitespace-pre-line bg-neutral-900 p-4 rounded-xl border border-white/10">
                    {q.answer}
                  </div>

                  {q.codeExample && (
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-gray-400 block mb-1.5">
                        Code / Implementation Example:
                      </span>
                      <pre className="p-3 bg-neutral-900 border border-white/10 rounded-lg text-xs font-mono text-neutral-300 overflow-x-auto">
                        <code>{q.codeExample}</code>
                      </pre>
                    </div>
                  )}

                  {q.companies && q.companies.length > 0 && (
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-building text-gray-500 text-xs"></i>
                      <span className="text-gray-500 font-mono text-[11px]">Asked at:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {q.companies.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] font-mono bg-neutral-900 text-gray-400 border border-white/10 px-2 py-0.5 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewPrep;

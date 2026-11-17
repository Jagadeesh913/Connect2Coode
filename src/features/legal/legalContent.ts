export type LegalPageId =
  | 'privacy'
  | 'cookies'
  | 'terms'
  | 'disclaimer'
  | 'accessibility'
  | 'support'
  | 'data-rights'
  | 'copyright';

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  notice?: string;
}

export interface LegalPageContent {
  id: LegalPageId;
  path: string;
  eyebrow: string;
  title: string;
  summary: string;
  lastReviewed: string;
  sections: LegalSection[];
}

const lastReviewed = '17 November 2026';

export const LEGAL_PAGES: Record<LegalPageId, LegalPageContent> = {
  privacy: {
    id: 'privacy',
    path: '/privacy',
    eyebrow: 'Privacy and trust',
    title: 'Privacy Policy',
    summary:
      'This notice describes the personal data the current Connect2Code website and API flows use, why it is used, and which controls are available.',
    lastReviewed,
    sections: [
      {
        id: 'scope',
        title: 'Scope and operator details',
        paragraphs: [
          'This notice applies to the Connect2Code placement-preparation website, its account features, coding workspace, learning tools, and administration interface.',
          'The repository does not identify the legal entity operating the service, its registered address, or a verified privacy or grievance contact. Those details must be approved and published by the service owner before production launch. Until then, do not send personal data to an address that is not published on the official Connect2Code website.',
        ],
        notice:
          'Owner action required: add the operator’s legal name, address, verified privacy contact, grievance contact, and—if applicable—data protection officer or EU representative.',
      },
      {
        id: 'data-collected',
        title: 'Data used by current features',
        bullets: [
          'Account and authentication data: email address, name, password submitted to the API, account identifier, role, and authentication state.',
          'Optional profile and academic data: registration number, joining and passing years, college name and identifier, biography, gender reference, and date of birth when supplied.',
          'Learning and assessment activity: bookmarks, attempted and solved problem identifiers, code, selected language, custom input, submissions, answers, and results.',
          'Preferences and device-local data: theme preference, per-account progress cache, code drafts, sign-in return path, and short-lived cross-tab session events.',
          'Google sign-in data: identity information returned through the backend’s Google OAuth flow. The exact Google scopes and provider configuration require backend-owner confirmation.',
          'Technical and operational data may be recorded by the API or hosting providers, such as IP address, request metadata, diagnostics, and security logs. This frontend repository cannot verify those server-side records.',
        ],
      },
      {
        id: 'purposes',
        title: 'Why the data is used',
        bullets: [
          'Create and authenticate accounts, restore sessions, secure protected requests, and support password recovery.',
          'Provide coding practice, code execution, submissions, bookmarks, progress, learning sheets, aptitude practice, and profile features.',
          'Keep account-specific preferences and drafts separated on the same browser.',
          'Operate and protect the service, diagnose failures, enforce roles, and prevent misuse where the backend provides those controls.',
          'Meet legal obligations and respond to valid rights or security requests where applicable.',
        ],
      },
      {
        id: 'storage',
        title: 'Cookies and browser storage',
        paragraphs: [
          'The access token and signed-in identity are held in page memory rather than local storage. The backend is designed to use an HttpOnly refresh cookie for session restoration. The frontend cannot read that cookie.',
          'Local storage is used for account-scoped theme preferences, progress cache, and code drafts. Session storage is used for a post-sign-in return path and a one-time logout notice. No analytics, advertising, tag-manager, or tracking SDK is present in the reviewed frontend source.',
        ],
      },
      {
        id: 'sharing',
        title: 'Services and recipients',
        bullets: [
          'The Connect2Code Spring Boot API receives account, profile, learning, and code-execution requests.',
          'Google is involved only when a user chooses Google sign-in; the backend owns the provider exchange.',
          'The static hosting provider serves the website. Google Fonts and cdnjs currently receive browser requests for fonts and icon styles when a page loads.',
          'The backend mediates code execution through Judge0; the browser does not contact Judge0 directly.',
          'Some company or problem links and images may load from the external destination selected by the user or supplied by the API.',
        ],
        notice:
          'Owner action required: confirm all processors, hosting regions, contracts, international transfers, server logs, analytics, and subprocessors before legal approval.',
      },
      {
        id: 'retention',
        title: 'Retention and deletion',
        paragraphs: [
          'Browser-held drafts, progress cache, and preferences remain until cleared by the user, removed by the application, or erased by browser controls. Logout clears the departing account’s local cache except its theme preference.',
          'The backend’s retention periods for accounts, profiles, submissions, security logs, backups, and deleted records are not defined in this frontend repository. Connect2Code must not promise a deletion deadline until the backend owner has documented and tested it.',
        ],
      },
      {
        id: 'rights',
        title: 'Your privacy rights',
        paragraphs: [
          'Depending on applicable law and your location, you may have rights to information, access, correction, erasure, restriction or objection, portability, consent withdrawal, grievance redressal, or nomination. Some rights are subject to legal exceptions.',
          'The current API has profile editing but no verified account deletion, complete data export, or privacy-request endpoint. See Data & Account Rights for the currently available device controls and the backend work still required.',
        ],
      },
      {
        id: 'children',
        title: 'Children and age assurance',
        paragraphs: [
          'Connect2Code is described as a placement-preparation service for college students and job seekers. The current product has no verified age-assurance or parental-consent flow. The owner must decide the permitted age range and implement any required child-data controls before knowingly serving children.',
        ],
      },
      {
        id: 'security',
        title: 'Security and changes',
        paragraphs: [
          'The frontend uses HTTPS production endpoints, memory-only access tokens, account-scoped browser storage, credential stripping, and route-level role presentation. Client-side guards are not a substitute for backend authorization.',
          'This notice should be updated when data practices, providers, purposes, or legal obligations change. Material changes should be communicated through an appropriate in-product or account channel once one is configured.',
        ],
      },
    ],
  },
  cookies: {
    id: 'cookies',
    path: '/cookies',
    eyebrow: 'Privacy and trust',
    title: 'Cookie & Storage Policy',
    summary:
      'Connect2Code currently uses required authentication and local feature storage, not advertising or analytics cookies.',
    lastReviewed,
    sections: [
      {
        id: 'current-use',
        title: 'Current use',
        paragraphs: [
          'The reviewed frontend does not install analytics, advertising, social-pixel, or behavior-tracking tools. It does not create a marketing cookie.',
          'A consent banner is therefore not shown merely to obtain consent for required authentication or user-requested local features. If optional analytics, advertising, or other non-essential storage is introduced, it must remain disabled until the required choice is obtained, and this policy and the preference controls must be updated first.',
        ],
      },
      {
        id: 'inventory',
        title: 'Cookie and storage inventory',
        table: {
          headers: ['Mechanism', 'Purpose', 'Owner', 'Duration / removal', 'Required'],
          rows: [
            [
              'Refresh-session cookie (exact name unverified)',
              'Restore and rotate an authenticated session',
              'Connect2Code API',
              'Backend-configured; exact lifetime and flags require owner verification',
              'Yes, for signed-in sessions',
            ],
            [
              'In-memory access token and user identity',
              'Authorize protected API requests in the current tab',
              'Connect2Code frontend',
              'Until refresh, logout, session failure, or page close/reload',
              'Yes, for signed-in features',
            ],
            [
              'Account-scoped local storage',
              'Theme, progress cache, and code drafts',
              'Connect2Code frontend',
              'Until removed in-app or through browser controls; logout preserves theme',
              'Feature storage',
            ],
            [
              'Session storage',
              'Return path after sign-in and one-time logout notice',
              'Connect2Code frontend',
              'Current browser tab/session or earlier application removal',
              'Yes, for the requested flow',
            ],
            [
              'BroadcastChannel / transient storage event',
              'Notify other same-origin tabs that session state changed; contains no token or profile',
              'Connect2Code frontend',
              'Message-only; fallback marker is removed immediately',
              'Session coordination',
            ],
          ],
        },
      },
      {
        id: 'third-parties',
        title: 'Third-party browser requests',
        paragraphs: [
          'Google Fonts and cdnjs currently receive requests for font and icon assets when the document loads. These are network requests, not Connect2Code marketing cookies. Their providers may receive ordinary request metadata such as IP address and user-agent information under their own practices.',
          'Choosing Google sign-in navigates to the backend-managed Google OAuth flow. External company or problem links and some remote images may contact their destination when opened or loaded.',
        ],
      },
      {
        id: 'controls',
        title: 'Your controls',
        bullets: [
          'You can block or remove cookies and site storage through your browser. Blocking the refresh cookie will prevent signed-in session restoration.',
          'Use the Data & Account Rights page to clear Connect2Code data for the active account from this device.',
          'There is currently no optional analytics category to enable or disable, so a preference toggle would not change any tracking behavior.',
        ],
      },
      {
        id: 'verification',
        title: 'Backend verification still required',
        notice:
          'The API owner must confirm the refresh cookie’s name, Secure, HttpOnly, SameSite, Path, Domain, expiry, rotation, revocation, and whether any server-side service adds cookies or analytics not visible in this frontend repository.',
      },
    ],
  },
  terms: {
    id: 'terms',
    path: '/terms',
    eyebrow: 'Service terms',
    title: 'Terms & Conditions',
    summary:
      'These terms describe responsible use of the current Connect2Code learning and assessment features.',
    lastReviewed,
    sections: [
      {
        id: 'approval',
        title: 'Legal status of these terms',
        paragraphs: [
          'These terms reflect the website’s current technical behavior. The service owner must add its legal identity, permitted age, governing law, dispute forum, official notice address, and effective-date approval before relying on them as a final contract.',
        ],
        notice: 'Legal approval required before production reliance.',
      },
      {
        id: 'service',
        title: 'The service',
        paragraphs: [
          'Connect2Code provides placement-preparation resources, coding practice, code execution, DSA learning sheets, company-preparation content, aptitude practice, profiles, progress, and administrative content tools. Features may depend on the Connect2Code API and external execution infrastructure.',
        ],
      },
      {
        id: 'accounts',
        title: 'Accounts and security',
        bullets: [
          'Provide accurate information and keep account credentials confidential.',
          'Do not share accounts, impersonate another person, bypass role controls, or access another user’s data.',
          'Notify the official support channel when it is published if you believe an account is compromised.',
          'Google sign-in is optional and also subject to Google’s applicable terms and privacy practices.',
        ],
      },
      {
        id: 'acceptable-use',
        title: 'Acceptable use',
        bullets: [
          'Use the service for lawful learning, preparation, assessment, and authorized administration.',
          'Do not attack, scrape excessively, disrupt, reverse engineer protected services, evade limits, introduce malware, or attempt unauthorized access.',
          'Do not submit unlawful, infringing, abusive, or privacy-invasive content.',
          'Do not use code execution to target systems, mine cryptocurrency, consume disproportionate resources, or run workloads unrelated to the requested coding exercise.',
          'Respect assessment rules and the rights of content and trademark owners.',
        ],
      },
      {
        id: 'content',
        title: 'Your code and platform content',
        paragraphs: [
          'You retain whatever rights you already have in code and information you submit. A final operator-approved license for processing submissions has not been specified in this repository and must be added before these terms are finalized.',
          'Company names, logos, problem references, and third-party links may belong to their respective owners. Their appearance does not imply sponsorship or affiliation.',
        ],
      },
      {
        id: 'availability',
        title: 'Availability, changes, and enforcement',
        paragraphs: [
          'The service may change, suspend, or remove features for security, maintenance, legal, or operational reasons. Backend failures, provider outages, and content changes may affect availability.',
          'Accounts or access may be restricted for misuse, security risk, or legal requirements, subject to the final operator-approved process and applicable law.',
        ],
      },
      {
        id: 'liability',
        title: 'No placement or correctness guarantee',
        paragraphs: [
          'Connect2Code is an educational preparation tool. It does not guarantee employment, interview selection, examination results, uninterrupted availability, or that every explanation, company pattern, salary, deadline, or test result is complete or current.',
          'Any enforceable warranty exclusions, liability limits, indemnities, governing law, and dispute terms require owner and legal approval and are intentionally not invented here.',
        ],
      },
    ],
  },
  disclaimer: {
    id: 'disclaimer',
    path: '/disclaimer',
    eyebrow: 'Service information',
    title: 'Disclaimer',
    summary:
      'Connect2Code supports preparation and practice; it is not a recruiter, employer, examination authority, or professional adviser.',
    lastReviewed,
    sections: [
      {
        id: 'education',
        title: 'Educational use',
        paragraphs: [
          'Coding problems, aptitude questions, explanations, company patterns, role information, salary figures, roadmaps, and interview resources are provided for learning and preparation. Verify time-sensitive recruitment information with the relevant company or institution.',
        ],
      },
      {
        id: 'outcomes',
        title: 'No outcome guarantee',
        paragraphs: [
          'Practice performance does not predict or guarantee hiring, academic credit, certification, examination scores, eligibility, or employment. Recruiters and institutions make their own decisions.',
        ],
      },
      {
        id: 'execution',
        title: 'Code execution and results',
        paragraphs: [
          'Run and submission results depend on backend compiler mappings, test cases, time and memory limits, and the remote execution service. Do not treat a browser result as proof that code is safe, secure, or suitable for production.',
        ],
      },
      {
        id: 'third-party',
        title: 'Third-party content and links',
        paragraphs: [
          'External websites, company trademarks, problem references, OAuth services, fonts, icons, and infrastructure are controlled by their respective providers. Connect2Code does not control their availability, content, terms, or privacy practices.',
        ],
      },
      {
        id: 'professional',
        title: 'No professional advice',
        paragraphs: [
          'Nothing on the service is legal, financial, employment, immigration, or other professional advice. Obtain qualified advice for decisions that require it.',
        ],
      },
    ],
  },
  accessibility: {
    id: 'accessibility',
    path: '/accessibility',
    eyebrow: 'Inclusive experience',
    title: 'Accessibility Statement',
    summary:
      'Connect2Code aims to provide a usable keyboard, screen-reader, zoom, contrast, and reduced-motion experience across learning and account features.',
    lastReviewed,
    sections: [
      {
        id: 'measures',
        title: 'Measures in the current interface',
        bullets: [
          'Semantic headings, landmarks, labels, status regions, and keyboard-accessible controls are used across shared components.',
          'Shared dialogs manage focus and Escape dismissal; custom selects support keyboard navigation.',
          'Light and dark themes use project design tokens, and motion is reduced when the operating system requests it.',
          'The coding editor enables Monaco accessibility auto-detection, while splitters and major workspace views include keyboard alternatives.',
          'Responsive layouts support mobile widths and browser zoom without requiring a separate mobile site.',
        ],
      },
      {
        id: 'limitations',
        title: 'Known limitations',
        bullets: [
          'The codebase has not been independently certified against WCAG 2.2 AA.',
          'Some legacy icon usage and complex coding, chart, and assessment interfaces may require further assistive-technology testing.',
          'Assessment-integrity controls restrict selection, clipboard, printing, and some shortcuts on protected learner routes; the admin interface is excluded. These controls may affect some assistive workflows and require product/legal review.',
          'Third-party pages and services have their own accessibility practices.',
        ],
      },
      {
        id: 'feedback',
        title: 'Accessibility feedback',
        paragraphs: [
          'A verified accessibility-support contact is not configured in this repository. The owner must publish one before launch. When reporting a barrier, include the page, the task you were trying to complete, browser/device, and assistive technology, but do not include passwords, tokens, or unnecessary personal data.',
        ],
      },
      {
        id: 'standard',
        title: 'Target and review',
        paragraphs: [
          'The recommended production target is WCAG 2.2 Level AA, supplemented by applicable Indian accessibility requirements. Conformance must be established through automated checks and manual keyboard, screen-reader, zoom, contrast, and mobile testing—not by this statement alone.',
        ],
      },
    ],
  },
  support: {
    id: 'support',
    path: '/support',
    eyebrow: 'Help and contact',
    title: 'Contact & Support',
    summary:
      'Use these safe troubleshooting steps while the service owner configures verified support, privacy, grievance, and security-reporting channels.',
    lastReviewed,
    sections: [
      {
        id: 'contact-status',
        title: 'Official contact status',
        paragraphs: [
          'No verified public support email, postal address, grievance officer, privacy contact, or security-reporting channel is defined in this repository. To prevent phishing and misdirected personal data, this page does not invent one.',
        ],
        notice:
          'Production blocker: the owner must publish verified support, privacy/grievance, accessibility, and security contacts with response expectations.',
      },
      {
        id: 'self-help',
        title: 'Before requesting help',
        bullets: [
          'Check your connection and retry once; the API may take longer to respond after an idle period.',
          'For sign-in trouble, use the password-reset flow or retry Google sign-in from the official site.',
          'For a coding issue, record the problem URL, selected language, visible error, and approximate time. Do not include access tokens or private test data.',
          'For missing profile or progress data, confirm you are signed into the intended account before changing anything.',
          'Never send a password, OTP, refresh cookie, access token, or full authentication screenshot to support.',
        ],
      },
      {
        id: 'request-types',
        title: 'Requests that need dedicated handling',
        bullets: [
          'Account access and security incidents.',
          'Privacy access, correction, export, deletion, consent, or grievance requests.',
          'Accessibility barriers and accommodation requests.',
          'Copyright or trademark notices with enough detail to identify the material and the claimant’s authority.',
          'Responsible security reports. Do not test production accounts, data, or infrastructure without written authorization.',
        ],
      },
    ],
  },
  'data-rights': {
    id: 'data-rights',
    path: '/data-rights',
    eyebrow: 'Account controls',
    title: 'Data & Account Rights',
    summary:
      'Review what you can change now, clear this browser’s account-scoped data, and understand which account rights still need backend support.',
    lastReviewed,
    sections: [
      {
        id: 'available',
        title: 'Controls available now',
        bullets: [
          'Profile: authenticated users can review and update the profile and academic fields supported by the current API.',
          'Bookmarks: authenticated users can add and remove saved problems.',
          'Theme: users can change the current appearance preference.',
          'Local data: the control below can remove the active account’s Connect2Code drafts, progress cache, and theme preference from this browser. It does not delete server records.',
          'Logout: clears the in-memory session and the account’s local cache except the theme preference, then asks the backend to end the refresh session.',
        ],
      },
      {
        id: 'server-rights',
        title: 'Server-side rights and requests',
        paragraphs: [
          'The current frontend/API contract has no verified endpoint for deleting an account, exporting a complete copy, restricting processing, recording an objection, withdrawing optional consent, or tracking a privacy request.',
          'Those requests require a verified contact channel and backend workflow that authenticates the requester, finds primary and derived records, handles legal exceptions, propagates deletion or correction, and records completion without exposing another user’s data.',
        ],
        notice:
          'Backend dependency: implement authenticated account deletion and export/request workflows, retention rules, backup handling, and auditable completion before claiming these rights are self-service.',
      },
      {
        id: 'request-safety',
        title: 'Request safety',
        bullets: [
          'Use only the verified contact published on the official website once configured.',
          'Expect identity verification proportionate to the request; never send a password, OTP, cookie, or access token.',
          'A response period cannot be promised until the owner confirms the applicable laws, process, and service level.',
          'If a request is denied or limited, the final process should explain the reason and available grievance or appeal path where required.',
        ],
      },
    ],
  },
  copyright: {
    id: 'copyright',
    path: '/copyright',
    eyebrow: 'Content and rights',
    title: 'Copyright & Trademark Notice',
    summary:
      'This notice distinguishes Connect2Code interface materials from recruiter brands, linked problems, and other third-party content.',
    lastReviewed,
    sections: [
      {
        id: 'platform-materials',
        title: 'Connect2Code materials',
        paragraphs: [
          'The site interface, original written material, code, and brand assets may be protected by copyright, trademark, contract, or other law. The repository does not identify the legal rights-holder or license terms for every asset, so the owner must complete an asset and license register before asserting a comprehensive ownership claim.',
        ],
      },
      {
        id: 'third-party',
        title: 'Third-party names, logos, and content',
        paragraphs: [
          'Company names, logos, service marks, linked coding problems, recruitment information, and external resources belong to their respective owners. They are used for identification and preparation context and do not imply sponsorship, endorsement, partnership, or affiliation.',
          'Bundled company logos and referenced problem sources require a documented license, permission, or defensible legal basis. A source URL alone is not proof of reuse rights.',
        ],
        notice:
          'Owner action required: verify the license and attribution requirements for every bundled logo, image, font, icon, question, explanation, and imported content item.',
      },
      {
        id: 'user-submissions',
        title: 'User submissions',
        paragraphs: [
          'Users should submit only code and content they are entitled to use. A final operator-approved license describing how Connect2Code may process, store, evaluate, and display submissions has not yet been specified and must be added to the Terms before launch.',
        ],
      },
      {
        id: 'notices',
        title: 'Rights notices',
        paragraphs: [
          'A verified copyright or trademark notice channel is not configured. The owner must publish one with a process for identifying the work, location, claimant authority, requested action, and good-faith contact details while avoiding unnecessary personal data.',
        ],
      },
    ],
  },
};

export const LEGAL_PAGE_LINKS = (Object.values(LEGAL_PAGES) as LegalPageContent[]).map(
  ({ id, path, title }) => ({ id, path, title })
);


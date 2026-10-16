import React from 'react';

interface CompanyBrandLogoProps {
  name: string;
  className?: string;
  watermark?: boolean;
}

export const CompanyBrandLogo: React.FC<CompanyBrandLogoProps> = ({
  name,
  className = 'w-10 h-10',
  watermark = false,
}) => {
  const norm = (name || '').toLowerCase().trim();

  // ==========================================
  // WATERMARK SILHOUETTES (Rendered in faint opacity on cards)
  // ==========================================
  if (watermark) {
    if (norm.includes('google')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      );
    }
    if (norm.includes('amazon')) {
      return (
        <svg viewBox="0 0 48 48" className={className} fill="currentColor">
          <path d="M38 33c-8 6-22 6-32 0-.3-.2-.5.2-.2.4 8 6 24 6 32 0 .4-.2.2-.6-.2-.4z" />
          <path d="M39 31l1.5 4-4 .5z" />
        </svg>
      );
    }
    if (norm.includes('microsoft')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M11 0H0v11h11V0zm13 0H13v11h11V0zM11 13H0v11h11V13zm13 0H13v11h11V13z" />
        </svg>
      );
    }
    if (norm.includes('meta') || norm.includes('facebook')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 7.2c-2.4 0-4.3 1.5-5.5 3.5-1.1-1.9-3-3.5-5.3-3.5C.5 7.2 0 8.1 0 10.4c0 3.2 2.7 6.4 5.9 6.4 2.3 0 4.2-1.5 5.3-3.5 1.1 2 3.1 3.5 5.5 3.5 3.2 0 5.9-3.2 5.9-6.4 0-2.3-.5-3.2-1.2-3.2-2.3 0-4.2 1.6-5.3 3.5-1.2-2-3.1-3.5-4.1-3.5z" />
        </svg>
      );
    }
    if (norm.includes('apple')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.78 1.08-1.87.96-2.96-.93.04-2.06.62-2.73 1.4-.58.68-1.1 1.77-.96 2.84 1.04.08 2.09-.5 2.73-1.28" />
        </svg>
      );
    }
    if (norm.includes('accenture')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M4 2.5l14 9.5-14 9.5v-4.5l7.5-5-7.5-5z" />
        </svg>
      );
    }
    if (norm.includes('tcs') || norm.includes('tata')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-6xl tracking-tighter select-none opacity-80`}>
          tcs
        </div>
      );
    }
    if (norm.includes('infosys')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.78 1.08-1.87.96-2.96-.93.04-2.06.62-2.73 1.4-.58.68-1.1 1.77-.96 2.84 1.04.08 2.09-.5 2.73-1.28" />
        </svg>
      );
    }
    if (norm.includes('wipro')) {
      return (
        <svg viewBox="0 0 48 48" className={className} fill="currentColor">
          <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="3 3" />
        </svg>
      );
    }
    if (norm.includes('zoho')) {
      return (
        <div className={`${className} flex items-center justify-center gap-1 opacity-80`}>
          <div className="w-6 h-6 border-4 border-current rounded-sm"></div>
          <div className="w-6 h-6 border-4 border-current rounded-sm"></div>
        </div>
      );
    }
    if (norm.includes('ibm')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-6xl tracking-widest font-mono opacity-80`}>
          IBM
        </div>
      );
    }
    if (norm.includes('adobe')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M14.5 3H24v18L14.5 3zM9.5 3H0v18L9.5 3zm2.5 7.5l4 9.5h-3.2l-1.5-3.8h-3.6l2.8-5.7z" />
        </svg>
      );
    }
    // Generic subtle watermark
    return (
      <div className={`${className} flex items-center justify-center font-black text-6xl select-none opacity-60`}>
        {name ? name.charAt(0).toUpperCase() : 'C'}
      </div>
    );
  }

  // ==========================================
  // FULL COLOR BRAND LOGOS (Matching Screenshot)
  // ==========================================

  // 1. Google (Official 4-color G)
  if (norm.includes('google')) {
    return (
      <svg viewBox="0 0 48 48" className={className}>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    );
  }

  // 2. Amazon (Bold black 'a' with smile arrow)
  if (norm.includes('amazon')) {
    return (
      <svg viewBox="0 0 48 48" className={className}>
        <text
          x="4"
          y="31"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="36"
          fill="currentColor"
        >
          a
        </text>
        <path
          d="M8 37c8 5 21 5 31-4"
          fill="none"
          stroke="#FF9900"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M38 31l2.5 4.5-4 .5"
          fill="#FF9900"
          stroke="#FF9900"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // 3. Microsoft (4 colored squares)
  if (norm.includes('microsoft')) {
    return (
      <svg viewBox="0 0 48 48" className={className}>
        <rect x="3" y="3" width="19" height="19" fill="#F25022" rx="1.5" />
        <rect x="26" y="3" width="19" height="19" fill="#7FBA00" rx="1.5" />
        <rect x="3" y="26" width="19" height="19" fill="#00A4EF" rx="1.5" />
        <rect x="26" y="26" width="19" height="19" fill="#FFB900" rx="1.5" />
      </svg>
    );
  }

  // 4. Meta (Blue infinity loop)
  if (norm.includes('meta') || norm.includes('facebook')) {
    return (
      <svg viewBox="0 0 48 48" className={className}>
        <path
          d="M24 20.5c-4.2-6.5-9.8-10.5-15.6-10.5C3.8 10 0 14.5 0 21.8c0 8.8 6.5 16.2 14.8 16.2 6.2 0 11.2-4.5 14.8-10.5 3.6 6 8.6 10.5 14.8 10.5 8.3 0 14.8-7.4 14.8-16.2C64.4 14.5 60.6 10 55.2 10c-5.8 0-11.4 4-15.6 10.5zm0 0c2.8-4.2 6.8-7.2 10.8-7.2 4 0 6.5 3.2 6.5 8.5 0 6-4.5 11.5-10 11.5-4.5 0-8.2-3.5-10.8-7.8-2.6 4.3-6.3 7.8-10.8 7.8-5.5 0-10-5.5-10-11.5 0-5.3 2.5-8.5 6.5-8.5 4 0 8 3 10.8 7.2z"
          fill="#0081FB"
          transform="scale(0.75) translate(4, 5)"
        />
      </svg>
    );
  }

  // 5. Apple (Iconic black Apple logo)
  if (norm.includes('apple')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.78 1.08-1.87.96-2.96-.93.04-2.06.62-2.73 1.4-.58.68-1.1 1.77-.96 2.84 1.04.08 2.09-.5 2.73-1.28" />
      </svg>
    );
  }

  // 6. TCS ( टाटा कंसल्टेंसी - Lowercase tcs in gradient rose/coral)
  if (norm.includes('tcs') || norm.includes('tata')) {
    return (
      <div className={`${className} flex items-center justify-start font-black tracking-tighter text-2xl font-sans`}>
        <span className="text-[#FF2A6D] text-[28px] font-black leading-none">tcs</span>
      </div>
    );
  }

  // 7. Infosys (Classic royal blue Infosys wordmark)
  if (norm.includes('infosys')) {
    return (
      <div className={`${className} flex items-center justify-start font-bold text-2xl text-[#007cc3] tracking-tight font-sans italic`}>
        Infosys
      </div>
    );
  }

  // 8. Wipro (Rainbow dots constellation + wipro text)
  if (norm.includes('wipro')) {
    return (
      <div className={`${className} flex flex-col items-start justify-center`}>
        <svg viewBox="0 0 60 60" className="w-8 h-8">
          <circle cx="30" cy="10" r="3.5" fill="#E91E63" />
          <circle cx="44" cy="16" r="3.5" fill="#9C27B0" />
          <circle cx="50" cy="30" r="3.5" fill="#3F51B5" />
          <circle cx="44" cy="44" r="3.5" fill="#00BCD4" />
          <circle cx="30" cy="50" r="3.5" fill="#4CAF50" />
          <circle cx="16" cy="44" r="3.5" fill="#8BC34A" />
          <circle cx="10" cy="30" r="3.5" fill="#FFC107" />
          <circle cx="16" cy="16" r="3.5" fill="#FF5722" />
          <circle cx="30" cy="20" r="2.5" fill="#9C27B0" />
          <circle cx="38" cy="24" r="2.5" fill="#3F51B5" />
          <circle cx="38" cy="36" r="2.5" fill="#00BCD4" />
          <circle cx="30" cy="40" r="2.5" fill="#4CAF50" />
          <circle cx="22" cy="36" r="2.5" fill="#FFC107" />
          <circle cx="22" cy="24" r="2.5" fill="#FF5722" />
        </svg>
        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-none">
          wipro
        </span>
      </div>
    );
  }

  // 9. Accenture (Purple chevron >)
  if (norm.includes('accenture')) {
    return (
      <div className={`${className} flex items-center justify-start`}>
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#A100FF]" fill="currentColor">
          <path d="M4 2.5l14 9.5-14 9.5v-4.5l7.5-5-7.5-5z" />
        </svg>
      </div>
    );
  }

  // 10. Zoho (4 connected tilted colorful outline square tiles)
  if (norm.includes('zoho')) {
    return (
      <div className={`${className} flex items-center justify-start gap-1`}>
        <div className="w-3.5 h-3.5 rounded border-2 border-[#E53935] transform -rotate-6"></div>
        <div className="w-3.5 h-3.5 rounded border-2 border-[#43A047] transform rotate-3"></div>
        <div className="w-3.5 h-3.5 rounded border-2 border-[#1E88E5] transform -rotate-3"></div>
        <div className="w-3.5 h-3.5 rounded border-2 border-[#FDD835] transform rotate-6"></div>
      </div>
    );
  }

  // 11. IBM (8-bar horizontal striped IBM)
  if (norm.includes('ibm')) {
    return (
      <div className={`${className} flex items-center justify-start text-[#0F62FE] font-black text-2xl tracking-widest font-mono`}>
        IBM
      </div>
    );
  }

  // 12. Adobe (Red square with stylized white 'A')
  if (norm.includes('adobe')) {
    return (
      <div className={`${className} flex items-center justify-center bg-[#FA0F00] rounded-lg p-1.5 shadow-xs`}>
        <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="currentColor">
          <path d="M14.5 3H24v18L14.5 3zM9.5 3H0v18L9.5 3zm2.5 7.5l4 9.5h-3.2l-1.5-3.8h-3.6l2.8-5.7z" />
        </svg>
      </div>
    );
  }

  // Fallback initial badge
  return (
    <div className={`${className} rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm select-none`}>
      {name ? name.charAt(0).toUpperCase() : 'C'}
    </div>
  );
};

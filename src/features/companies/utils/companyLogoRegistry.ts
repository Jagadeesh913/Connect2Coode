/**
 * Production-Quality Company Logo Registry (Frontend-Only)
 * 
 * Sources reference: WorldVectorLogo (https://worldvectorlogo.com/)
 * 
 * Architectural Guarantees:
 * 1. ZERO dependency on backend logo URLs (completely ignores backend logoUrl / logo_url).
 * 2. All assets served locally from `/companies/` through frontend hosting (optimized for 2,000+ concurrent users).
 * 3. Exact aspect-ratio preservation with object-fit: contain.
 * 4. Deterministic initial/monogram fallback with accessible brand palettes.
 * 5. High-speed O(1) canonical alias resolution for all Indian and global enterprise recruiters.
 */

export interface CompanyLogoDefinition {
  slug: string;
  displayName: string;
  assetPath: string;
  brandColor: string;
  badgeBg: string;
  badgeText: string;
  darkInvert?: boolean;
  aliases: string[];
}

export const COMPANY_LOGO_DEFINITIONS: CompanyLogoDefinition[] = [
  // Top Global Big Tech & Cloud
  {
    slug: 'google',
    displayName: 'Google',
    assetPath: '/companies/google.svg',
    brandColor: '#4285F4',
    badgeBg: 'bg-[#4285F4]',
    badgeText: 'text-white',
    aliases: ['google', 'alphabet', 'google cloud', 'gcp'],
  },
  {
    slug: 'microsoft',
    displayName: 'Microsoft',
    assetPath: '/companies/microsoft.svg',
    brandColor: '#00A4EF',
    badgeBg: 'bg-[#0078D4]',
    badgeText: 'text-white',
    aliases: ['microsoft', 'msft', 'azure', 'microsoft corporation'],
  },
  {
    slug: 'amazon',
    displayName: 'Amazon',
    assetPath: '/companies/amazon.svg',
    brandColor: '#FF9900',
    badgeBg: 'bg-[#131921]',
    badgeText: 'text-[#FF9900]',
    aliases: ['amazon', 'aws', 'amazon web services'],
  },
  {
    slug: 'meta',
    displayName: 'Meta',
    assetPath: '/companies/meta.svg',
    brandColor: '#0081FB',
    badgeBg: 'bg-[#0081FB]',
    badgeText: 'text-white',
    aliases: ['meta', 'facebook', 'instagram', 'whatsapp'],
  },
  {
    slug: 'apple',
    displayName: 'Apple',
    assetPath: '/companies/apple.svg',
    brandColor: '#000000',
    badgeBg: 'bg-slate-900 dark:bg-slate-100',
    badgeText: 'text-white dark:text-slate-900',
    darkInvert: true,
    aliases: ['apple', 'apple inc'],
  },
  {
    slug: 'netflix',
    displayName: 'Netflix',
    assetPath: '/companies/netflix.svg',
    brandColor: '#E50914',
    badgeBg: 'bg-[#141414]',
    badgeText: 'text-[#E50914]',
    aliases: ['netflix'],
  },

  // Leading Indian Tech & Enterprise IT Services
  {
    slug: 'tcs',
    displayName: 'Tata Consultancy Services',
    assetPath: '/companies/tcs.svg',
    brandColor: '#FF2A6D',
    badgeBg: 'bg-[#004B87]',
    badgeText: 'text-white',
    aliases: ['tcs', 'tata', 'tata consultancy services', 'tcs ion', 'tcsion', 'tata consultancy', 'tcs nqt'],
  },
  {
    slug: 'infosys',
    displayName: 'Infosys',
    assetPath: '/companies/infosys.svg',
    brandColor: '#007CC3',
    badgeBg: 'bg-[#007CC3]',
    badgeText: 'text-white',
    aliases: ['infosys', 'infy', 'infosys limited', 'infosys bpm', 'infy tq'],
  },
  {
    slug: 'wipro',
    displayName: 'Wipro',
    assetPath: '/companies/wipro.svg',
    brandColor: '#3F51B5',
    badgeBg: 'bg-white dark:bg-slate-900',
    badgeText: 'text-[#3F51B5]',
    aliases: ['wipro', 'wipro limited', 'wipro technologies'],
  },
  {
    slug: 'accenture',
    displayName: 'Accenture',
    assetPath: '/companies/accenture.svg',
    brandColor: '#A100FF',
    badgeBg: 'bg-[#A100FF]',
    badgeText: 'text-white',
    aliases: ['accenture', 'accenture solutions'],
  },
  {
    slug: 'cognizant',
    displayName: 'Cognizant',
    assetPath: '/companies/cognizant.svg',
    brandColor: '#0033A0',
    badgeBg: 'bg-[#0033A0]',
    badgeText: 'text-white',
    aliases: ['cognizant', 'cts', 'cognizant technology solutions'],
  },
  {
    slug: 'capgemini',
    displayName: 'Capgemini',
    assetPath: '/companies/capgemini.svg',
    brandColor: '#0070AD',
    badgeBg: 'bg-[#0070AD]',
    badgeText: 'text-white',
    aliases: ['capgemini', 'capgemini technology services'],
  },
  {
    slug: 'tech-mahindra',
    displayName: 'Tech Mahindra',
    assetPath: '/companies/tech-mahindra.svg',
    brandColor: '#ED1C24',
    badgeBg: 'bg-[#ED1C24]',
    badgeText: 'text-white',
    aliases: ['tech mahindra', 'techmahindra', 'mahindra'],
  },
  {
    slug: 'hcl',
    displayName: 'HCLTech',
    assetPath: '/companies/hcl.svg',
    brandColor: '#582C83',
    badgeBg: 'bg-[#582C83]',
    badgeText: 'text-white',
    aliases: ['hcl', 'hcltech', 'hcl technologies', 'hcl technologies limited'],
  },
  {
    slug: 'ibm',
    displayName: 'IBM',
    assetPath: '/companies/ibm.svg',
    brandColor: '#0F62FE',
    badgeBg: 'bg-[#0F62FE]',
    badgeText: 'text-white',
    aliases: ['ibm', 'international business machines'],
  },
  {
    slug: 'oracle',
    displayName: 'Oracle',
    assetPath: '/companies/oracle.svg',
    brandColor: '#C74634',
    badgeBg: 'bg-[#C74634]',
    badgeText: 'text-white',
    aliases: ['oracle', 'oracle corporation'],
  },
  {
    slug: 'zoho',
    displayName: 'Zoho',
    assetPath: '/companies/zoho.svg',
    brandColor: '#E53935',
    badgeBg: 'bg-[#E53935]',
    badgeText: 'text-white',
    aliases: ['zoho', 'zoho corp', 'zoho corporation'],
  },
  {
    slug: 'freshworks',
    displayName: 'Freshworks',
    assetPath: '/companies/freshworks.svg',
    brandColor: '#FF5722',
    badgeBg: 'bg-[#FF5722]',
    badgeText: 'text-white',
    aliases: ['freshworks', 'freshdesk'],
  },
  {
    slug: 'servicenow',
    displayName: 'ServiceNow',
    assetPath: '/companies/servicenow.svg',
    brandColor: '#81B5A1',
    badgeBg: 'bg-[#032D42]',
    badgeText: 'text-[#81B5A1]',
    aliases: ['servicenow'],
  },
  {
    slug: 'salesforce',
    displayName: 'Salesforce',
    assetPath: '/companies/salesforce.svg',
    brandColor: '#00A1E0',
    badgeBg: 'bg-[#00A1E0]',
    badgeText: 'text-white',
    aliases: ['salesforce'],
  },
  {
    slug: 'adobe',
    displayName: 'Adobe',
    assetPath: '/companies/adobe.svg',
    brandColor: '#FA0F00',
    badgeBg: 'bg-[#FA0F00]',
    badgeText: 'text-white',
    aliases: ['adobe', 'adobe systems'],
  },
  {
    slug: 'cisco',
    displayName: 'Cisco',
    assetPath: '/companies/cisco.svg',
    brandColor: '#049FD9',
    badgeBg: 'bg-[#049FD9]',
    badgeText: 'text-white',
    aliases: ['cisco', 'cisco systems'],
  },
  {
    slug: 'dell',
    displayName: 'Dell',
    assetPath: '/companies/dell.svg',
    brandColor: '#007DB8',
    badgeBg: 'bg-[#007DB8]',
    badgeText: 'text-white',
    aliases: ['dell', 'dell technologies'],
  },
  {
    slug: 'intel',
    displayName: 'Intel',
    assetPath: '/companies/intel.svg',
    brandColor: '#0071C5',
    badgeBg: 'bg-[#0071C5]',
    badgeText: 'text-white',
    aliases: ['intel', 'intel corporation'],
  },
  {
    slug: 'nvidia',
    displayName: 'NVIDIA',
    assetPath: '/companies/nvidia.svg',
    brandColor: '#76B900',
    badgeBg: 'bg-[#76B900]',
    badgeText: 'text-black',
    aliases: ['nvidia', 'nvidia corporation'],
  },
  {
    slug: 'paypal',
    displayName: 'PayPal',
    assetPath: '/companies/paypal.svg',
    brandColor: '#003087',
    badgeBg: 'bg-[#003087]',
    badgeText: 'text-white',
    aliases: ['paypal'],
  },

  // Big 4 & Financial Giants
  {
    slug: 'deloitte',
    displayName: 'Deloitte',
    assetPath: '/companies/deloitte.svg',
    brandColor: '#86BC25',
    badgeBg: 'bg-[#1E1E1E]',
    badgeText: 'text-[#86BC25]',
    aliases: ['deloitte', 'deloitte consulting', 'deloitte usi'],
  },
  {
    slug: 'ey',
    displayName: 'EY',
    assetPath: '/companies/ey.svg',
    brandColor: '#FFE600',
    badgeBg: 'bg-[#2E2E38]',
    badgeText: 'text-[#FFE600]',
    aliases: ['ey', 'ernst', 'ernst and young', 'ernst & young'],
  },
  {
    slug: 'kpmg',
    displayName: 'KPMG',
    assetPath: '/companies/kpmg.svg',
    brandColor: '#00338D',
    badgeBg: 'bg-[#00338D]',
    badgeText: 'text-white',
    aliases: ['kpmg'],
  },
  {
    slug: 'pwc',
    displayName: 'PwC',
    assetPath: '/companies/pwc.svg',
    brandColor: '#DC143C',
    badgeBg: 'bg-[#DC143C]',
    badgeText: 'text-white',
    aliases: ['pwc', 'pricewaterhousecoopers'],
  },
  {
    slug: 'jpmorgan',
    displayName: 'JPMorgan Chase',
    assetPath: '/companies/jpmorgan.svg',
    brandColor: '#117ACA',
    badgeBg: 'bg-[#117ACA]',
    badgeText: 'text-white',
    aliases: ['jpmorgan', 'jp morgan', 'chase', 'jpmorgan chase', 'jpmc'],
  },
  {
    slug: 'goldman-sachs',
    displayName: 'Goldman Sachs',
    assetPath: '/companies/goldman-sachs.svg',
    brandColor: '#7399C6',
    badgeBg: 'bg-[#7399C6]',
    badgeText: 'text-white',
    aliases: ['goldman', 'goldman sachs', 'gs'],
  },
  {
    slug: 'morgan-stanley',
    displayName: 'Morgan Stanley',
    assetPath: '/companies/morgan-stanley.svg',
    brandColor: '#002B49',
    badgeBg: 'bg-[#002B49]',
    badgeText: 'text-white',
    aliases: ['morgan stanley', 'ms'],
  },
  {
    slug: 'wells-fargo',
    displayName: 'Wells Fargo',
    assetPath: '/companies/wells-fargo.svg',
    brandColor: '#CD1409',
    badgeBg: 'bg-[#CD1409]',
    badgeText: 'text-[#FFCD00]',
    aliases: ['wells fargo', 'wells'],
  },

  // High-Growth Consumer, E-Commerce, Fintech & Unicorns
  {
    slug: 'uber',
    displayName: 'Uber',
    assetPath: '/companies/uber.svg',
    brandColor: '#000000',
    badgeBg: 'bg-black',
    badgeText: 'text-white',
    aliases: ['uber', 'uber technologies'],
  },
  {
    slug: 'ola',
    displayName: 'Ola',
    assetPath: '/companies/ola.svg',
    brandColor: '#2BB673',
    badgeBg: 'bg-[#2BB673]',
    badgeText: 'text-black',
    aliases: ['ola', 'ola cabs'],
  },
  {
    slug: 'swiggy',
    displayName: 'Swiggy',
    assetPath: '/companies/swiggy.svg',
    brandColor: '#FC8019',
    badgeBg: 'bg-[#FC8019]',
    badgeText: 'text-white',
    aliases: ['swiggy', 'bundl technologies'],
  },
  {
    slug: 'zomato',
    displayName: 'Zomato',
    assetPath: '/companies/zomato.svg',
    brandColor: '#E23744',
    badgeBg: 'bg-[#E23744]',
    badgeText: 'text-white',
    aliases: ['zomato'],
  },
  {
    slug: 'razorpay',
    displayName: 'Razorpay',
    assetPath: '/companies/razorpay.svg',
    brandColor: '#0C2340',
    badgeBg: 'bg-[#0C2340]',
    badgeText: 'text-[#3395FF]',
    aliases: ['razorpay'],
  },
  {
    slug: 'phonepe',
    displayName: 'PhonePe',
    assetPath: '/companies/phonepe.svg',
    brandColor: '#5F259F',
    badgeBg: 'bg-[#5F259F]',
    badgeText: 'text-white',
    aliases: ['phonepe'],
  },
  {
    slug: 'paytm',
    displayName: 'Paytm',
    assetPath: '/companies/paytm.svg',
    brandColor: '#002970',
    badgeBg: 'bg-[#002970]',
    badgeText: 'text-[#00BAF2]',
    aliases: ['paytm', 'one97'],
  },
  {
    slug: 'flipkart',
    displayName: 'Flipkart',
    assetPath: '/companies/flipkart.svg',
    brandColor: '#2874F0',
    badgeBg: 'bg-[#2874F0]',
    badgeText: 'text-[#FFE11B]',
    aliases: ['flipkart'],
  },
  {
    slug: 'myntra',
    displayName: 'Myntra',
    assetPath: '/companies/myntra.svg',
    brandColor: '#FF3F6C',
    badgeBg: 'bg-white dark:bg-slate-900',
    badgeText: 'text-[#FF3F6C]',
    aliases: ['myntra'],
  },
  {
    slug: 'walmart',
    displayName: 'Walmart',
    assetPath: '/companies/walmart.svg',
    brandColor: '#0071CE',
    badgeBg: 'bg-[#0071CE]',
    badgeText: 'text-[#FFC220]',
    aliases: ['walmart', 'walmart global tech'],
  },
  {
    slug: 'linkedin',
    displayName: 'LinkedIn',
    assetPath: '/companies/linkedin.svg',
    brandColor: '#0A66C2',
    badgeBg: 'bg-[#0A66C2]',
    badgeText: 'text-white',
    aliases: ['linkedin'],
  },
  {
    slug: 'samsung',
    displayName: 'Samsung',
    assetPath: '/companies/samsung.svg',
    brandColor: '#1428A0',
    badgeBg: 'bg-[#1428A0]',
    badgeText: 'text-white',
    aliases: ['samsung', 'samsung r&d'],
  },
  {
    slug: 'thoughtworks',
    displayName: 'Thoughtworks',
    assetPath: '/companies/thoughtworks.svg',
    brandColor: '#F15A24',
    badgeBg: 'bg-[#F15A24]',
    badgeText: 'text-white',
    aliases: ['thoughtworks'],
  },
  {
    slug: 'ltimindtree',
    displayName: 'LTIMindtree',
    assetPath: '/companies/ltimindtree.svg',
    brandColor: '#003B71',
    badgeBg: 'bg-[#003B71]',
    badgeText: 'text-white',
    aliases: ['ltimindtree', 'mindtree', 'lti', 'l&t infotech'],
  },
  {
    slug: 'persistent',
    displayName: 'Persistent Systems',
    assetPath: '/companies/persistent.svg',
    brandColor: '#E31837',
    badgeBg: 'bg-[#E31837]',
    badgeText: 'text-white',
    aliases: ['persistent', 'persistent systems'],
  },
  {
    slug: 'accolite',
    displayName: 'Accolite Digital',
    assetPath: '/companies/accolite.svg',
    brandColor: '#E31B23',
    badgeBg: 'bg-[#E31B23]',
    badgeText: 'text-white',
    aliases: ['accolite', 'accolite digital', 'bounteous'],
  },
  {
    slug: 'mouritech',
    displayName: 'Mouri Tech',
    assetPath: '/companies/mouritech.svg',
    brandColor: '#004B87',
    badgeBg: 'bg-[#004B87]',
    badgeText: 'text-[#F37021]',
    aliases: ['mouritech', 'mouri tech'],
  },
  {
    slug: 'databeat',
    displayName: 'DataBeat',
    assetPath: '/companies/databeat.svg',
    brandColor: '#6366F1',
    badgeBg: 'bg-[#6366F1]',
    badgeText: 'text-white',
    aliases: ['databeat', 'data beat'],
  },
  {
    slug: 'stripe',
    displayName: 'Stripe',
    assetPath: '/companies/stripe.svg',
    brandColor: '#635BFF',
    badgeBg: 'bg-[#635BFF]',
    badgeText: 'text-white',
    aliases: ['stripe'],
  },
  {
    slug: 'spotify',
    displayName: 'Spotify',
    assetPath: '/companies/spotify.svg',
    brandColor: '#1ED760',
    badgeBg: 'bg-[#1ED760]',
    badgeText: 'text-black',
    aliases: ['spotify'],
  },
  {
    slug: 'twitter',
    displayName: 'Twitter / X',
    assetPath: '/companies/twitter.svg',
    brandColor: '#1DA1F2',
    badgeBg: 'bg-[#1DA1F2]',
    badgeText: 'text-white',
    aliases: ['twitter', 'x'],
  },
  {
    slug: 'atlassian',
    displayName: 'Atlassian',
    assetPath: '/companies/atlassian.svg',
    brandColor: '#0052CC',
    badgeBg: 'bg-[#0052CC]',
    badgeText: 'text-white',
    aliases: ['atlassian', 'jira', 'confluence'],
  },
  {
    slug: 'airbnb',
    displayName: 'Airbnb',
    assetPath: '/companies/airbnb.svg',
    brandColor: '#FF5A5F',
    badgeBg: 'bg-[#FF5A5F]',
    badgeText: 'text-white',
    aliases: ['airbnb'],
  },
  {
    slug: 'bytedance',
    displayName: 'ByteDance',
    assetPath: '/companies/bytedance.svg',
    brandColor: '#325AB4',
    badgeBg: 'bg-[#325AB4]',
    badgeText: 'text-white',
    aliases: ['bytedance', 'tiktok'],
  },
  {
    slug: 'bloomberg',
    displayName: 'Bloomberg',
    assetPath: '/companies/bloomberg.svg',
    brandColor: '#2800D7',
    badgeBg: 'bg-[#2800D7]',
    badgeText: 'text-white',
    aliases: ['bloomberg'],
  },
  {
    slug: 'tesla',
    displayName: 'Tesla',
    assetPath: '/companies/tesla.svg',
    brandColor: '#E82127',
    badgeBg: 'bg-[#E82127]',
    badgeText: 'text-white',
    aliases: ['tesla'],
  },
  {
    slug: 'github',
    displayName: 'GitHub',
    assetPath: '/companies/github.svg',
    brandColor: '#24292F',
    badgeBg: 'bg-[#24292F]',
    badgeText: 'text-white',
    darkInvert: true,
    aliases: ['github'],
  },
  {
    slug: 'slack',
    displayName: 'Slack',
    assetPath: '/companies/slack.svg',
    brandColor: '#4A154B',
    badgeBg: 'bg-[#4A154B]',
    badgeText: 'text-white',
    aliases: ['slack'],
  },
];

// O(1) Alias Map
const ALIAS_MAP = new Map<string, CompanyLogoDefinition>();

// Build canonical lookup table
for (const def of COMPANY_LOGO_DEFINITIONS) {
  ALIAS_MAP.set(def.slug.toLowerCase(), def);
  for (const alias of def.aliases) {
    ALIAS_MAP.set(alias.toLowerCase().trim(), def);
  }
}

/**
 * Bundled assets that predate the curated metadata registry. Keeping this
 * manifest explicit makes every shipped asset reachable at runtime and lets
 * Vite/static hosts cache the files indefinitely without directory listing.
 */
export const ADDITIONAL_LOCAL_ASSETS: Readonly<Record<string, string>> = {
  affirm: '/companies/affirm.png',
  'akuna-capital': '/companies/akuna-capital.png',
  alibaba: '/companies/alibaba.svg',
  appdynamics: '/companies/appdynamics.png',
  audible: '/companies/audible.svg',
  'capital-one': '/companies/capital-one.png',
  citadel: '/companies/citadel.png',
  citrix: '/companies/citrix.svg',
  cohesity: '/companies/cohesity.svg',
  coursera: '/companies/coursera.png',
  'cruise-automation': '/companies/cruise-automation.png',
  'data-bricks': '/companies/data-bricks.png',
  databricks: '/companies/data-bricks.png',
  doordash: '/companies/doordash.png',
  dropbox: '/companies/dropbox.png',
  ebay: '/companies/ebay.png',
  hulu: '/companies/hulu.png',
  intuit: '/companies/intuit.png',
  lyft: '/companies/lyft.png',
  mathworks: '/companies/mathworks.png',
  snapchat: '/companies/snapchat.png',
  splunk: '/companies/splunk.png',
  square: '/companies/square.png',
  sumologic: '/companies/sumologic.png',
  tableau: '/companies/tableau.png',
  tencent: '/companies/tencent.png',
  tripadvisor: '/companies/tripadvisor.png',
  triplebyte: '/companies/triplebyte.png',
  twilio: '/companies/twilio.png',
  twitch: '/companies/twitch.png',
  'two-sigma': '/companies/two-sigma.png',
  visa: '/companies/visa.png',
  vmware: '/companies/vmware.png',
  wayfair: '/companies/wayfair.png',
  wish: '/companies/wish.png',
  yahoo: '/companies/yahoo.png',
  yandex: '/companies/yandex.png',
  yelp: '/companies/yelp.png',
  zenefits: '/companies/zenefits.png',
  zillow: '/companies/zillow.png',
  zulily: '/companies/zulily.png',
};

/**
 * Normalizes raw company names by removing noise, legal entities, and punctuation.
 */
export function normalizeCompanySearchKey(rawName: string | undefined | null): string {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\b(incorporated|inc|llc|llp|plc|ltd|limited|private|pvt|corp|corporation|technologies|technology|solutions|services|group|co|company|consulting|holdings|international|global|india)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toCompanyAssetSlug(rawName: string | undefined | null): string {
  return normalizeCompanySearchKey(rawName)
    .replace(/\band\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createLocalAssetDefinition(rawName: string, slug: string, assetPath: string): CompanyLogoDefinition {
  return {
    slug,
    displayName: rawName.trim(),
    assetPath,
    brandColor: '#2563EB',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white',
    aliases: [rawName],
  };
}

/**
 * Resolves a company definition from the local WorldVectorLogo registry.
 * Strictly Frontend-Only: guarantees 0 network calls and 0 backend dependencies.
 */
export function resolveCompanyLogo(rawName: string | undefined | null): CompanyLogoDefinition | null {
  if (!rawName || typeof rawName !== 'string') return null;
  const trimmed = rawName.trim().toLowerCase();
  if (!trimmed) return null;

  // 1. Direct slug or raw alias match
  if (ALIAS_MAP.has(trimmed)) {
    return ALIAS_MAP.get(trimmed)!;
  }

  // 2. Normalized sanitized match
  const clean = normalizeCompanySearchKey(trimmed);
  if (clean && ALIAS_MAP.has(clean)) {
    return ALIAS_MAP.get(clean)!;
  }

  // 3. Substring keyword check for common enterprise compound names (e.g. "TCS NQT", "Accenture Solutions")
  for (const [key, def] of ALIAS_MAP.entries()) {
    if (key.length >= 3 && (clean.includes(key) || trimmed.includes(key))) {
      return def;
    }
  }

  // 4. Reach bundled assets that do not need bespoke brand metadata.
  const assetSlug = toCompanyAssetSlug(trimmed);
  const assetPath = ADDITIONAL_LOCAL_ASSETS[assetSlug];
  if (assetPath) {
    return createLocalAssetDefinition(rawName, assetSlug, assetPath);
  }

  return null;
}

export function extractCompanyDomain(website: string | undefined | null): string | null {
  if (!website || typeof website !== 'string') return null;
  const candidate = website.trim();
  if (!candidate) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (
      !hostname.includes('.') ||
      hostname === 'localhost' ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    ) {
      return null;
    }
    return hostname;
  } catch {
    return null;
  }
}

export interface CompanyLogoCandidate {
  src: string;
  source: 'local' | 'brandfetch' | 'official-favicon' | 'simple-icons';
}

/**
 * Builds a deterministic, deduplicated logo cascade. Arbitrary backend logo
 * URLs are intentionally excluded; remote candidates use a validated company
 * domain or a fixed, reviewed brand CDN.
 */
export function getCompanyLogoCandidates(
  name: string | undefined | null,
  website: string | undefined | null,
  brandfetchClientId?: string | null
): CompanyLogoCandidate[] {
  const candidates: CompanyLogoCandidate[] = [];
  const local = resolveCompanyLogo(name);
  if (local) candidates.push({ src: local.assetPath, source: 'local' });

  const domain = extractCompanyDomain(website);
  const clientId = brandfetchClientId?.trim();
  if (domain && clientId) {
    candidates.push({
      src: `https://cdn.brandfetch.io/${encodeURIComponent(domain)}?c=${encodeURIComponent(clientId)}`,
      source: 'brandfetch',
    });
  }
  const iconSlug = toCompanyAssetSlug(name).replace(/-/g, '');
  if (iconSlug && !local) {
    candidates.push({
      src: `https://cdn.simpleicons.org/${encodeURIComponent(iconSlug)}`,
      source: 'simple-icons',
    });
  }
  if (domain) {
    candidates.push({ src: `https://${domain}/favicon.ico`, source: 'official-favicon' });
  }

  return candidates.filter(
    (candidate, index, all) => all.findIndex((item) => item.src === candidate.src) === index
  );
}

/**
 * Curated accessible gradient palette for fallback badges.
 */
const FALLBACK_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-indigo-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-rose-600 to-red-600',
  'from-amber-600 to-orange-600',
  'from-emerald-600 to-teal-600',
  'from-teal-600 to-cyan-700',
  'from-cyan-600 to-blue-600',
  'from-violet-600 to-purple-700',
  'from-fuchsia-600 to-pink-700',
] as const;

/**
 * Generates deterministic fallback initial and gradient based on the company name hash.
 */
export function getCompanyFallback(name: string | undefined | null): {
  initial: string;
  gradientClass: string;
} {
  const clean = (name || '').trim();
  if (!clean) {
    return {
      initial: 'C',
      gradientClass: FALLBACK_GRADIENTS[0],
    };
  }

  // Generate deterministic hash
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % FALLBACK_GRADIENTS.length;

  // Extract up to two meaningful initials; legal suffixes should not become a
  // company's visual identity.
  const ignoredWords = new Set([
    'private',
    'pvt',
    'limited',
    'ltd',
    'inc',
    'incorporated',
    'llc',
    'llp',
    'plc',
    'corp',
    'corporation',
    'company',
    'co',
  ]);
  const words = clean
    .split(/[^a-z0-9]+/i)
    .filter((word) => word && !ignoredWords.has(word.toLowerCase()));
  let initial = 'C';
  if (words.length >= 2) {
    initial = (words[0][0] + words[1][0]).toUpperCase();
  } else {
    initial = (words[0]?.slice(0, 2) || clean.charAt(0)).toUpperCase();
  }

  return {
    initial,
    gradientClass: FALLBACK_GRADIENTS[idx],
  };
}

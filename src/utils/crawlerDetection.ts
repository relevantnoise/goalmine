/**
 * Crawler Detection Utility
 * 
 * Detects web crawlers and bots to provide optimized content delivery.
 * Used to bypass authentication flows and provide immediate content access for SEO.
 */

/**
 * Comprehensive list of crawler user agents
 * Includes major search engines, social media crawlers, and SEO tools
 */
const CRAWLER_USER_AGENTS = [
  // Search Engine Crawlers
  'googlebot',
  'bingbot', 
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  
  // Social Media Crawlers
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  
  // SEO & Analytics Tools
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'screaming frog',
  'seobility',
  'sitebulb',
  
  // Generic Patterns
  'bot',
  'crawler',
  'spider',
  'scraper',
  'crawling',
  'indexer'
];

/**
 * Detects if the current request is from a web crawler
 * 
 * @returns {boolean} True if request is from a crawler, false otherwise
 */
export function isCrawler(): boolean {
  // Server-side rendering check - assume crawler during SSR
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }
  
  // Get user agent safely
  const userAgent = navigator.userAgent?.toLowerCase() || '';
  
  // Check if user agent matches any known crawler patterns
  return CRAWLER_USER_AGENTS.some(crawlerPattern => 
    userAgent.includes(crawlerPattern.toLowerCase())
  );
}

/**
 * Get the detected crawler type for logging/analytics
 * 
 * @returns {string | null} The crawler type or null if not a crawler
 */
export function getCrawlerType(): string | null {
  if (!isCrawler()) {
    return null;
  }
  
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'ssr';
  }
  
  const userAgent = navigator.userAgent?.toLowerCase() || '';
  
  // Return the first matching crawler pattern
  const matchedCrawler = CRAWLER_USER_AGENTS.find(crawlerPattern => 
    userAgent.includes(crawlerPattern.toLowerCase())
  );
  
  return matchedCrawler || 'unknown-crawler';
}

/**
 * Log crawler detection for monitoring and debugging
 */
export function logCrawlerDetection(): void {
  if (isCrawler()) {
    const crawlerType = getCrawlerType();
    console.log(`🤖 Crawler detected: ${crawlerType}`, {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      timestamp: new Date().toISOString()
    });
  }
}
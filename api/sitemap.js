export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current date for lastmod
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Core static pages
    const staticPages = [
      {
        loc: 'https://goalmine.ai/',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '1.0'
      },
      {
        loc: 'https://goalmine.ai/auth',
        lastmod: currentDate,
        changefreq: 'monthly', 
        priority: '0.8'
      }
    ];

    // Landing page sections (from CrawlerLandingPage anchors)
    const landingSections = [
      {
        loc: 'https://goalmine.ai/#features',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        loc: 'https://goalmine.ai/#pricing',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.9'
      }
    ];

    // Combine all URLs
    const allUrls = [...staticPages, ...landingSections];

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls.map(url => `  
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}

</urlset>`;

    // Set proper headers for XML sitemap
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    
    return res.status(200).send(sitemap);
    
  } catch (error) {
    console.error('[SITEMAP] Error generating sitemap:', error);
    return res.status(500).json({ 
      error: 'Failed to generate sitemap',
      message: error.message 
    });
  }
}
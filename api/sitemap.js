// Serves /sitemap.xml (see vercel.json). Static pages plus every live
// location and published story from Sanity, so new content is picked up
// without a redeploy. Falls back to the static pages + seed content if
// Sanity is unreachable.
const SITE = 'https://www.clvchusa.com';
const SANITY_QUERY_URL = 'https://yi9utzrz.apicdn.sanity.io/v2024-01-01/data/query/production';

const STATIC_PAGES = [
  { path: '/',          changefreq: 'weekly',  priority: '1.0' },
  { path: '/locations', changefreq: 'weekly',  priority: '0.8' },
  { path: '/menu',      changefreq: 'weekly',  priority: '0.9' },
  { path: '/stories',   changefreq: 'weekly',  priority: '0.7' },
  { path: '/contact',   changefreq: 'monthly', priority: '0.6' },
  { path: '/reserve',   changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy',   changefreq: 'yearly',  priority: '0.2' },
  { path: '/terms',     changefreq: 'yearly',  priority: '0.2' },
];

// Mirrors the seed data in source/app.js, used only if Sanity is down
const FALLBACK = {
  locations: [{ id: 'atlanta' }],
  stories: [
    { slug: 'game-day-at-clvch-atlanta' },
    { slug: 'why-we-built-clvch' },
    { slug: 'the-perfect-pre-game' },
  ],
};

const QUERY = `{
  "locations": *[_type == "location" && disabled != true && defined(id)]{ id, _updatedAt },
  "stories": *[_type == "story" && published == true && defined(slug.current)]{ "slug": slug.current, publishedDate, _updatedAt }
}`;

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (d) => (d ? String(d).slice(0, 10) : null);

async function loadContent() {
  try {
    const r = await fetch(`${SANITY_QUERY_URL}?query=${encodeURIComponent(QUERY)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(`Sanity ${r.status}`);
    const { result } = await r.json();
    if (!result) throw new Error('empty result');
    return {
      locations: Array.isArray(result.locations) && result.locations.length ? result.locations : FALLBACK.locations,
      stories: Array.isArray(result.stories) ? result.stories : FALLBACK.stories,
    };
  } catch (err) {
    console.error('[sitemap] Sanity fetch failed, using fallback:', err.message);
    return FALLBACK;
  }
}

export default async function handler(req, res) {
  const { locations, stories } = await loadContent();

  const urls = [
    ...STATIC_PAGES.map((p) => ({ loc: SITE + p.path, changefreq: p.changefreq, priority: p.priority })),
    ...locations.map((l) => ({
      loc: `${SITE}/locations/${encodeURIComponent(l.id)}`,
      lastmod: day(l._updatedAt), changefreq: 'weekly', priority: '0.9',
    })),
    ...stories.map((s) => ({
      loc: `${SITE}/stories/${encodeURIComponent(s.slug)}`,
      lastmod: day(s._updatedAt || s.publishedDate), changefreq: 'monthly', priority: '0.6',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(body);
}

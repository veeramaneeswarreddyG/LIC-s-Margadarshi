import { NextRequest, NextResponse } from 'next/server';

// Curated fallback news for when no API key is set or quota is exhausted
const FALLBACK_NEWS = [
  {
    title: 'LIC launches Bima Kavach (Plan 887) – Enhanced Term Cover with Critical Illness Rider',
    description: 'Life Insurance Corporation of India introduced Plan 887, Bima Kavach, offering higher sum assured options and an integrated critical illness rider for comprehensive protection.',
    link: 'https://licindia.in/press-release',
    pubDate: '2025-04-10',
    source: 'LIC Press Release',
    category: 'Product Launch',
  },
  {
    title: "LIC's DIVE Project: Digital Innovation for better customer experience",
    description: 'LIC\'s DIVE (Digital Innovation & Value Enhancement) initiative is transforming policyholder services, with real-time claim processing and AI-powered advisor tools rolling out across India.',
    link: 'https://licindia.in/corporate-news',
    pubDate: '2026-04-08',
    source: 'LIC Corporate',
    category: 'Technology',
  },
  {
    title: 'LIC announces Special Revival Campaign for lapsed policies – April to June 2026',
    description: 'LIC has announced a special revival campaign allowing policyholders to revive their lapsed policies with concessional charges on late fee from April 1 to June 30, 2026.',
    link: 'https://licindia.in/special-campaign',
    pubDate: '2026-04-01',
    source: 'LIC India',
    category: 'Campaign',
  },
  {
    title: "LIC's FY2025-26 Annual Premium Equivalent: ₹48,000 Crore milestone",
    description: 'Life Insurance Corporation of India reported record Annual Premium Equivalent (APE) of ₹48,000 crores for FY2025-26, driven by strong retail and group policy sales.',
    link: 'https://licindia.in/investor-relations',
    pubDate: '2026-04-15',
    source: 'LIC Investor Relations',
    category: 'Financial Results',
  },
  {
    title: 'LIC Jeevan Utsav (Plan 871): New whole life plan with guaranteed income from day one',
    description: 'LIC\'s Jeevan Utsav plan offers guaranteed annual income after the premium payment term ends, along with whole life coverage up to age 100. Plan 871 is seeing strong uptake in metro cities.',
    link: 'https://licindia.in/products',
    pubDate: '2026-03-28',
    source: 'LIC India',
    category: 'Product Update',
  },
  {
    title: 'LIC extends office hours at select branches during tax-saving season',
    description: 'LIC has extended working hours at over 500 key branches till March 31 to accommodate the surge in insurance purchases during the tax-saving season.',
    link: 'https://licindia.in/customer-service',
    pubDate: '2026-03-20',
    source: 'LIC Customer Service',
    category: 'Service Update',
  },
  {
    title: 'LIC becomes India\'s largest institutional investor with ₹52 lakh crore AUM',
    description: 'LIC\'s total Assets Under Management crossed ₹52 lakh crore making it not just India\'s largest insurer but also the country\'s largest institutional investor ahead of all mutual funds combined.',
    link: 'https://licindia.in/investor-relations',
    pubDate: '2026-03-15',
    source: 'Business Standard',
    category: 'Corporate',
  },
  {
    title: 'LIC settles 99.04% of individual claims in FY2025-26',
    description: 'LIC maintained its industry-leading claim settlement ratio of 99.04% during FY2025-26, reinforcing trust among 35+ crore policyholders across India.',
    link: 'https://licindia.in/claim-settlement',
    pubDate: '2026-04-05',
    source: 'IRDAI Report',
    category: 'Claims',
  },
];

export async function GET(request: NextRequest) {
  const apiKey = process.env.NEWSDATA_API_KEY;

  // If no API key is configured, return curated fallback news
  if (!apiKey || apiKey === 'YOUR_NEWSDATA_API_KEY') {
    return NextResponse.json({
      status: 'fallback',
      results: FALLBACK_NEWS,
      source: 'curated',
    });
  }

  try {
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=%22LIC+of+India%22+OR+%22Life+Insurance+Corporation%22&country=in&language=en&category=business`;

    const res = await fetch(url, {
      next: { revalidate: 1800 }, // cache 30 min
    });

    if (!res.ok) {
      throw new Error(`NewsData API error: ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'API error');
    }

    // Normalize the response
    const articles = (data.results || []).slice(0, 15).map((a: any) => ({
      title: a.title || '',
      description: a.description || a.content || '',
      link: a.link || '',
      pubDate: a.pubDate || '',
      source: a.source_id || 'NewsData',
      category: a.category?.[0] || 'News',
      imageUrl: a.image_url || null,
    }));

    return NextResponse.json({
      status: 'live',
      results: articles,
      source: 'newsdata.io',
    });
  } catch (error: any) {
    console.error('News fetch error:', error.message);
    // Fallback to curated on error
    return NextResponse.json({
      status: 'fallback',
      results: FALLBACK_NEWS,
      source: 'curated',
      error: error.message,
    });
  }
}

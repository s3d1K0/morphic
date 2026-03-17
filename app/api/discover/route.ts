import { NextRequest } from 'next/server'

const SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:4000'

const topicSources: Record<string, string[]> = {
  tech: ['techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com'],
  finance: ['bloomberg.com', 'reuters.com', 'ft.com', 'wsj.com'],
  art: ['artnet.com', 'theartnewspaper.com', 'hyperallergic.com'],
  sports: ['espn.com', 'bbc.com/sport', 'theathletic.com'],
  entertainment: ['variety.com', 'deadline.com', 'hollywoodreporter.com'],
}

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get('topic') || 'tech'
  const sources = topicSources[topic] || topicSources.tech

  try {
    // Try SearXNG first
    const searchQuery = `${topic} news ${sources.slice(0, 2).join(' OR ')}`
    const res = await fetch(
      `${SEARXNG_URL}/search?q=${encodeURIComponent(searchQuery)}&format=json&categories=news`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (res.ok) {
      const data = await res.json()
      const articles = (data.results || [])
        .slice(0, 10)
        .map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          thumbnail: r.thumbnail || r.img_src,
        }))

      return Response.json({ articles })
    }
  } catch {
    // SearXNG not available, return empty
  }

  return Response.json({ articles: [] })
}

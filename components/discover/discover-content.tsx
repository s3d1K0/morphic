'use client'

import { useEffect, useState } from 'react'
import { Cpu, DollarSign, Palette, Trophy, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MajorNewsCard } from './major-news-card'
import { SmallNewsCard } from './small-news-card'

const topics = [
  { id: 'tech', label: 'Tech', icon: Cpu },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Entertainment', icon: Tv },
]

interface NewsItem {
  title: string
  url: string
  content?: string
  thumbnail?: string
}

export function DiscoverContent() {
  const [activeTopic, setActiveTopic] = useState('tech')
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/discover?topic=${activeTopic}`)
        if (res.ok) {
          const data = await res.json()
          setNews(data.articles || [])
        }
      } catch (err) {
        console.error('Failed to fetch news:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [activeTopic])

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {topics.map(topic => {
          const Icon = topic.icon
          return (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                activeTopic === topic.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Icon className="size-4" />
              {topic.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-muted-foreground text-center py-8">Loading news...</div>
      ) : news.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">No news available</div>
      ) : (
        <div className="space-y-4">
          {news[0] && <MajorNewsCard article={news[0]} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.slice(1).map((article, i) => (
              <SmallNewsCard key={i} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

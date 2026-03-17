import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SmallNewsCardProps {
  article: {
    title: string
    url: string
    content?: string
    thumbnail?: string
  }
}

export function SmallNewsCard({ article }: SmallNewsCardProps) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4 flex gap-3">
          {article.thumbnail && (
            <div className="size-16 shrink-0 rounded overflow-hidden">
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium line-clamp-2 flex items-start gap-1">
              {article.title}
              <ExternalLink className="size-3 shrink-0 mt-0.5 text-muted-foreground" />
            </h3>
            {article.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {article.content}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

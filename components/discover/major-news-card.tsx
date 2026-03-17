import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MajorNewsCardProps {
  article: {
    title: string
    url: string
    content?: string
    thumbnail?: string
  }
}

export function MajorNewsCard({ article }: MajorNewsCardProps) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer">
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        {article.thumbnail && (
          <div className="w-full h-48 overflow-hidden">
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-lg flex items-start gap-2">
            {article.title}
            <ExternalLink className="size-4 shrink-0 mt-1 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        {article.content && (
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {article.content}
            </p>
          </CardContent>
        )}
      </Card>
    </a>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Globe, Clock, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CrawlerActivityProps {
  query?: string
  results: Array<{
    url?: string
    endpoint?: string
    type?: string
    method?: string
    status?: number
  }>
  timing?: number
}

export function CrawlerActivity({ query, results, timing }: CrawlerActivityProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!results || results.length === 0) return null

  return (
    <Card className="my-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-blue-500" />
                <CardTitle className="text-sm font-medium">
                  API Discovery
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {results.length} endpoints
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{timing}ms</span>
                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3">
            <p className="text-xs text-muted-foreground mb-2">Query: {query}</p>
            <div className="space-y-1.5">
              {results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 text-sm"
                >
                  {result.method && (
                    <Badge
                      variant={result.method === 'GET' ? 'default' : 'secondary'}
                      className="text-[10px] font-mono px-1.5 py-0"
                    >
                      {result.method}
                    </Badge>
                  )}
                  <span className="font-mono text-xs truncate flex-1">
                    {result.endpoint || result.url}
                  </span>
                  {result.type && (
                    <Badge variant="outline" className="text-[10px]">
                      {result.type}
                    </Badge>
                  )}
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

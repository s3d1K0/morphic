'use client'

import React from 'react'

import type { DataPart } from '@/lib/types/ai'

import { BrowserActivity } from './browser-activity'
import { CrawlerActivity } from './crawler-activity'
import { RelatedQuestions } from './related-questions'
import { WidgetRenderer } from './widgets/widget-renderer'

interface DataSectionProps {
  part: DataPart
  onQuerySelect?: (query: string) => void
}

export function DataSection({ part, onQuerySelect }: DataSectionProps) {
  switch (part.type) {
    case 'data-relatedQuestions':
      if (onQuerySelect) {
        return (
          <RelatedQuestions data={part.data} onQuerySelect={onQuerySelect} />
        )
      }
      return null

    case 'data-widget':
      return (
        <WidgetRenderer
          widgetType={part.data.widgetType}
          params={part.data.params}
        />
      )

    case 'data-crawler':
      return (
        <CrawlerActivity
          query={part.data.query}
          results={part.data.results || []}
          timing={part.data.timing}
        />
      )

    case 'data-browser': {
      const actions = part.data.actions || (part.data.tool
        ? [{ tool: part.data.tool, description: part.data.description || '', result: part.data.result }]
        : [])
      return <BrowserActivity actions={actions} />
    }

    default:
      return null
  }
}

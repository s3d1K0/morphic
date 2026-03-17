'use client'

import { UseChatHelpers } from '@ai-sdk/react'
import { Brain, Check } from 'lucide-react'

import type { DeepResearchSource } from '@/lib/tools/deep-research'
import type { ToolPart, UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

import { StatusIndicator } from './ui/status-indicator'
import { CollapsibleMessage } from './collapsible-message'
import { SearchSkeleton } from './default-skeleton'
import ProcessHeader from './process-header'
import { SearchResults } from './search-results'
import { Section } from './section'
import { SourceFavicons } from './source-favicons'

interface DeepResearchSectionProps {
  tool: ToolPart<'deepResearch'>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  borderless?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function DeepResearchSection({
  tool,
  isOpen,
  onOpenChange,
  status,
  borderless = false,
  isFirst = false,
  isLast = false
}: DeepResearchSectionProps) {
  const isLoading = status === 'submitted' || status === 'streaming'
  const isToolLoading =
    tool.state === 'input-streaming' || tool.state === 'input-available'

  const output = tool.state === 'output-available' ? tool.output : undefined
  const isResearching = output?.state === 'researching'
  const isSourcesFound = output?.state === 'sources_found'
  const isComplete = output?.state === 'complete'
  const isError = tool.state === 'output-error'

  const query = tool.input?.query || output?.query || ''
  const sources: DeepResearchSource[] = output?.sources || []
  const optimizationMode = output?.optimizationMode

  // Convert sources to SearchResults-compatible format
  const searchResultItems = sources.map((s) => ({
    title: s.title,
    url: s.url,
    content: s.content || ''
  }))

  const header = (
    <ProcessHeader
      isLoading={isLoading && (isToolLoading || isResearching)}
      label={
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Brain className="h-4 w-4 shrink-0 text-purple-500" />
          <span className="truncate block min-w-0 max-w-full">{query}</span>
        </div>
      }
      meta={
        isComplete && sources.length > 0 ? (
          <div className="flex items-center gap-2">
            <StatusIndicator icon={Check} iconClassName="text-green-500">
              {sources.length} sources
            </StatusIndicator>
            {searchResultItems.length > 0 && (
              <SourceFavicons results={searchResultItems} maxDisplay={3} />
            )}
            {optimizationMode && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {optimizationMode}
              </span>
            )}
          </div>
        ) : isSourcesFound && sources.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {sources.length} sources found
            </span>
            {searchResultItems.length > 0 && (
              <SourceFavicons results={searchResultItems} maxDisplay={3} />
            )}
          </div>
        ) : isToolLoading || isResearching ? (
          <span className="animate-pulse">Researching...</span>
        ) : undefined
      }
    />
  )

  return (
    <div className="relative">
      {borderless && (
        <>
          {!isFirst && (
            <div className="absolute left-[19.5px] w-px bg-border h-2 top-0" />
          )}
          {!isLast && (
            <div className="absolute left-[19.5px] w-px bg-border h-2 bottom-0" />
          )}
        </>
      )}
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        header={header}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
        showBorder={!borderless}
        variant="default"
        showSeparator={false}
        headerClickBehavior="split"
      >
        <div className="flex">
          {borderless && (
            <>
              <div className="w-[16px] shrink-0 flex justify-center">
                <div
                  className={cn(
                    'w-px bg-border/50 transition-opacity duration-200',
                    isOpen ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    marginTop: isFirst ? '0' : '-1rem',
                    marginBottom: isLast ? '0' : '-1rem'
                  }}
                />
              </div>
              <div className="w-2 shrink-0" />
            </>
          )}
          <div className="flex-1">
            {isError ? (
              <Section>
                <div className="bg-card rounded-lg">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm text-destructive block flex-1 min-w-0">
                      {tool.errorText || 'Deep research failed'}
                    </span>
                  </div>
                </div>
              </Section>
            ) : (isLoading && isToolLoading) || isResearching ? (
              <SearchSkeleton />
            ) : searchResultItems.length > 0 ? (
              <Section title="Sources">
                <SearchResults results={searchResultItems} />
              </Section>
            ) : null}
          </div>
        </div>
      </CollapsibleMessage>
    </div>
  )
}

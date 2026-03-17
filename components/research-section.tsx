'use client'

import { UseChatHelpers } from '@ai-sdk/react'
import { Check, Lightbulb, Microscope, Search } from 'lucide-react'

import type { ResearchSource } from '@/lib/tools/research'
import type { ToolPart, UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

import { StatusIndicator } from './ui/status-indicator'
import { CollapsibleMessage } from './collapsible-message'
import { SearchSkeleton } from './default-skeleton'
import ProcessHeader from './process-header'
import { SearchResults } from './search-results'
import { Section } from './section'
import { SourceFavicons } from './source-favicons'

interface ResearchSectionProps {
  tool: ToolPart<'research'>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  borderless?: boolean
  isFirst?: boolean
  isLast?: boolean
}

const stateLabels: Record<string, string> = {
  researching: 'Starting research...',
  planning: 'Planning...',
  searching: 'Searching...',
  reading: 'Reading sources...',
  complete: 'Research complete'
}

const stateIcons: Record<string, typeof Microscope> = {
  researching: Microscope,
  planning: Lightbulb,
  searching: Search,
  reading: Microscope,
  complete: Check
}

export function ResearchSection({
  tool,
  isOpen,
  onOpenChange,
  status,
  borderless = false,
  isFirst = false,
  isLast = false
}: ResearchSectionProps) {
  const isLoading = status === 'submitted' || status === 'streaming'
  const isToolLoading =
    tool.state === 'input-streaming' || tool.state === 'input-available'

  const output = tool.state === 'output-available' ? tool.output : undefined
  const currentState = output?.state || 'researching'
  const isComplete = currentState === 'complete'
  const isError = tool.state === 'output-error'

  const query = tool.input?.query || output?.query || ''
  const sources: ResearchSource[] = output?.sources || []
  const steps = output?.steps || []
  const optimizationMode = output?.optimizationMode

  // Convert sources to SearchResults-compatible format
  const searchResultItems = sources.map((s) => ({
    title: s.title,
    url: s.url,
    content: s.content || ''
  }))

  const StateIcon = stateIcons[currentState] || Microscope

  const header = (
    <ProcessHeader
      isLoading={isLoading && !isComplete}
      label={
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Microscope className="h-4 w-4 shrink-0 text-purple-500" />
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
        ) : isError ? (
          <span className="text-xs text-destructive">
            {tool.errorText || 'Research failed'}
          </span>
        ) : !isComplete ? (
          <div className="flex items-center gap-2">
            <StateIcon className="h-3 w-3 text-muted-foreground animate-pulse" />
            <span className="text-xs text-muted-foreground animate-pulse">
              {stateLabels[currentState] || 'Researching...'}
            </span>
            {steps.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {steps.length} steps
              </span>
            )}
          </div>
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
                      {tool.errorText || 'Research failed'}
                    </span>
                  </div>
                </div>
              </Section>
            ) : (isLoading && isToolLoading) ||
              currentState === 'researching' ? (
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

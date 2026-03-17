'use client'

import { UseChatHelpers } from '@ai-sdk/react'
import { AlertCircle, Check, Monitor } from 'lucide-react'

import type { ToolPart, UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

import ProcessHeader from './process-header'

interface EagleTaskSectionProps {
  tool: ToolPart<'browserTask'>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  borderless?: boolean
  isFirst?: boolean
  isLast?: boolean
}

const skillLabels: Record<string, string> = {
  page_analyzer: 'Analyze',
  navigator: 'Navigate',
  form_filler: 'Fill Form',
  captcha_solver: 'Captcha'
}

const skillColors: Record<string, string> = {
  page_analyzer: 'bg-blue-500/10 text-blue-500',
  navigator: 'bg-amber-500/10 text-amber-500',
  form_filler: 'bg-green-500/10 text-green-500',
  captcha_solver: 'bg-red-500/10 text-red-500'
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function EagleTaskSection({
  tool,
  isOpen,
  onOpenChange,
  status,
  borderless = false,
  isFirst = false,
  isLast = false
}: EagleTaskSectionProps) {
  const isLoading = status === 'submitted' || status === 'streaming'
  const isToolLoading =
    tool.state === 'input-streaming' || tool.state === 'input-available'

  const output = tool.state === 'output-available' ? tool.output : undefined
  const isRunning = output?.state === 'running'
  const isComplete = output?.state === 'complete'
  const isError = tool.state === 'output-error'

  const task = tool.input?.task || output?.task || ''
  const skill = tool.input?.skill || output?.skill || 'page_analyzer'
  const success = isComplete ? output?.success : undefined
  const duration = isComplete ? output?.duration : undefined
  const toolsUsed: string[] = isComplete ? (output?.toolsUsed || []) : []

  const header = (
    <ProcessHeader
      isLoading={isLoading && (isToolLoading || isRunning)}
      label={
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Monitor className="h-4 w-4 shrink-0 text-cyan-500" />
          <span className="truncate block min-w-0 max-w-full">{task}</span>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded shrink-0',
              skillColors[skill] || 'bg-muted text-muted-foreground'
            )}
          >
            {skillLabels[skill] || skill}
          </span>
        </div>
      }
      meta={
        isComplete && success ? (
          <div className="flex items-center gap-2">
            <Check size={16} className="text-green-500" />
            {duration != null && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(duration)}
              </span>
            )}
            {toolsUsed.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {toolsUsed.length} tools
              </span>
            )}
          </div>
        ) : isComplete && !success ? (
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-destructive" />
            <span className="text-xs text-destructive">Failed</span>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-destructive" />
            <span className="text-xs text-destructive">
              {tool.errorText || 'Error'}
            </span>
          </div>
        ) : isToolLoading || isRunning ? (
          <span className="animate-pulse">Running...</span>
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
      <div
        className={cn(
          'rounded-lg',
          !borderless && 'bg-card border border-border'
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <div className="flex-1 min-w-0">{header}</div>
        </div>
      </div>
    </div>
  )
}

export default EagleTaskSection

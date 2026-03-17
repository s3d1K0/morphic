'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  Monitor,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

interface ResearchSubStep {
  type: string
  reasoning?: string
  searching?: string[]
  reading?: Array<{ url: string; title: string; content: string }>
}

interface EagleResearchStepsProps {
  subSteps: ResearchSubStep[]
  isActive?: boolean
  crawlerData?: any
  browserData?: any
}

export function EagleResearchSteps({
  subSteps,
  isActive = false,
  crawlerData,
  browserData
}: EagleResearchStepsProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <span className="font-medium">Research Steps</span>
        {isActive && (
          <span className="flex gap-1">
            <span className="animate-bounce size-1 rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
            <span className="animate-bounce size-1 rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
            <span className="animate-bounce size-1 rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <AnimatePresence mode="popLayout">
          <div className="mt-2 space-y-2 pl-6 border-l-2 border-muted">
            {subSteps.map((step, i) => (
              <motion.div
                key={`${step.type}-${i}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 text-sm"
              >
                {renderStep(step)}
              </motion.div>
            ))}
            {crawlerData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2 text-sm"
              >
                <Globe className="size-4 mt-0.5 text-blue-500 shrink-0" />
                <div>
                  <span className="text-muted-foreground">API Discovery</span>
                  {crawlerData.results?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {crawlerData.results.map((r: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {r.endpoint || r.url}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {browserData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2 text-sm"
              >
                <Monitor className="size-4 mt-0.5 text-purple-500 shrink-0" />
                <div>
                  <span className="text-muted-foreground">
                    Browser: {browserData.description || browserData.tool}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  )
}

function renderStep(step: ResearchSubStep) {
  switch (step.type) {
    case 'reasoning':
      return (
        <>
          <Brain className="size-4 mt-0.5 text-purple-500 shrink-0" />
          <span className="text-muted-foreground">{step.reasoning}</span>
        </>
      )
    case 'searching':
      return (
        <>
          <Search className="size-4 mt-0.5 text-blue-500 shrink-0" />
          <div>
            <span className="text-muted-foreground">
              Searching {step.searching?.length || 0} queries
            </span>
            {step.searching && (
              <div className="flex flex-wrap gap-1 mt-1">
                {step.searching.map((q, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {q}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </>
      )
    case 'search_results':
      return (
        <>
          <FileText className="size-4 mt-0.5 text-green-500 shrink-0" />
          <span className="text-muted-foreground">
            Found {step.reading?.length || 0} results
          </span>
        </>
      )
    case 'reading':
      return (
        <>
          <BookOpen className="size-4 mt-0.5 text-orange-500 shrink-0" />
          <span className="text-muted-foreground">
            Reading {step.reading?.length || 0} sources
          </span>
        </>
      )
    default:
      return <span className="text-muted-foreground">{step.type}</span>
  }
}

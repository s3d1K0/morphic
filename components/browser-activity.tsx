'use client'

import { motion } from 'framer-motion'
import { Camera, Globe, Monitor, MousePointer, Type } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BrowserAction {
  tool: string
  description: string
  result?: any
}

interface BrowserActivityProps {
  actions: BrowserAction[]
}

const toolIcons: Record<string, React.ReactNode> = {
  screenshot: <Camera className="size-4 text-blue-500" />,
  click: <MousePointer className="size-4 text-green-500" />,
  navigate: <Globe className="size-4 text-purple-500" />,
  type_text: <Type className="size-4 text-orange-500" />,
  default: <Monitor className="size-4 text-muted-foreground" />
}

export function BrowserActivity({ actions }: BrowserActivityProps) {
  if (!actions || actions.length === 0) return null

  return (
    <Card className="my-2">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Monitor className="size-4 text-purple-500" />
          <CardTitle className="text-sm font-medium">
            Browser Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        <div className="space-y-2">
          {actions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-2 text-sm"
            >
              <div className="mt-0.5 shrink-0">
                {toolIcons[action.tool] || toolIcons.default}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">
                  {action.description}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

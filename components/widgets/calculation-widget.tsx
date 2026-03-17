'use client'

import { Calculator } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CalculationWidgetProps {
  expression: string
  result: string | number
}

export function CalculationWidget({
  expression,
  result
}: CalculationWidgetProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calculator size={20} className="text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Calculation
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted/50 px-4 py-3">
          <div className="font-mono text-sm text-muted-foreground">
            {expression}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">
            {typeof result === 'number' ? result.toLocaleString() : result}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

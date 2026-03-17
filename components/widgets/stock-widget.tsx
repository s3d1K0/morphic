'use client'

import { useState } from 'react'

import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StockWidgetProps {
  ticker: string
  price?: number
  change?: number
  percentChange?: number
  marketState?: string
}

const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', '1Y'] as const

export function StockWidget({
  ticker,
  price,
  change,
  percentChange,
  marketState
}: StockWidgetProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1D')

  const isPositive = change !== undefined && change >= 0
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500'
  const ChangeIcon = isPositive ? ArrowUp : ArrowDown

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-muted-foreground" />
            <CardTitle className="text-xl font-bold">{ticker}</CardTitle>
          </div>
          {marketState && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                marketState === 'REGULAR'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-yellow-500/10 text-yellow-500'
              )}
            >
              {marketState === 'REGULAR' ? 'Market Open' : marketState}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {price !== undefined && (
          <div className="mb-4">
            <div className="text-3xl font-bold tracking-tight">
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {change !== undefined && percentChange !== undefined && (
              <div className={cn('mt-1 flex items-center gap-1 text-sm', changeColor)}>
                <ChangeIcon size={14} />
                <span>
                  {isPositive ? '+' : ''}
                  {change.toFixed(2)} ({isPositive ? '+' : ''}
                  {percentChange.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        )}

        {/* TODO: Integrate lightweight-charts for interactive stock chart rendering */}
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/20">
          <span className="text-sm text-muted-foreground">
            Chart placeholder
          </span>
        </div>

        <div className="mt-4 flex gap-1">
          {TIMEFRAMES.map(timeframe => (
            <button
              key={timeframe}
              onClick={() => setActiveTimeframe(timeframe)}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                activeTimeframe === timeframe
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

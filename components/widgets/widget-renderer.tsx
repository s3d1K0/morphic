'use client'

import { CalculationWidget } from './calculation-widget'
import { StockWidget } from './stock-widget'
import { WeatherWidget } from './weather-widget'

interface WidgetRendererProps {
  widgetType: string
  params: Record<string, any>
}

export function WidgetRenderer({ widgetType, params }: WidgetRendererProps) {
  switch (widgetType) {
    case 'weather':
      return <WeatherWidget {...(params as any)} />
    case 'stock':
      return <StockWidget {...(params as any)} />
    case 'calculation':
    case 'calculation_result':
      return <CalculationWidget {...(params as any)} />
    default:
      return null
  }
}

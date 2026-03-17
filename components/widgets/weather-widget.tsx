'use client'

import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Sun,
  Wind
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WeatherCurrent {
  temperature_2m: number
  relative_humidity_2m: number
  wind_speed_10m: number
  weather_code: number
}

interface WeatherDaily {
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  time: string[]
}

interface WeatherWidgetProps {
  location: string
  latitude: number
  longitude: number
  current: WeatherCurrent
  daily: WeatherDaily
}

interface WeatherCondition {
  label: string
  icon: React.ComponentType<any>
  gradient: string
}

function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) {
    return {
      label: 'Clear',
      icon: Sun,
      gradient: 'from-yellow-400 to-orange-500'
    }
  }
  if (code >= 1 && code <= 3) {
    return {
      label: 'Partly Cloudy',
      icon: Cloud,
      gradient: 'from-blue-300 to-gray-400'
    }
  }
  if (code >= 45 && code <= 48) {
    return {
      label: 'Fog',
      icon: Cloud,
      gradient: 'from-gray-300 to-gray-500'
    }
  }
  if (code >= 51 && code <= 55) {
    return {
      label: 'Drizzle',
      icon: CloudDrizzle,
      gradient: 'from-blue-400 to-blue-600'
    }
  }
  if (code >= 61 && code <= 65) {
    return {
      label: 'Rain',
      icon: CloudRain,
      gradient: 'from-blue-500 to-indigo-600'
    }
  }
  if (code >= 71 && code <= 75) {
    return {
      label: 'Snow',
      icon: CloudSnow,
      gradient: 'from-slate-200 to-blue-300'
    }
  }
  if (code >= 80 && code <= 82) {
    return {
      label: 'Showers',
      icon: CloudRain,
      gradient: 'from-blue-600 to-indigo-700'
    }
  }
  if (code >= 95 && code <= 99) {
    return {
      label: 'Thunderstorm',
      icon: CloudLightning,
      gradient: 'from-gray-700 to-purple-900'
    }
  }

  return {
    label: 'Unknown',
    icon: Cloud,
    gradient: 'from-gray-400 to-gray-600'
  }
}

function formatDayLabel(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffMs = date.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function WeatherWidget({
  location,
  current,
  daily
}: WeatherWidgetProps) {
  const condition = getWeatherCondition(current.weather_code)
  const ConditionIcon = condition.icon

  const forecastDays = daily.time.slice(0, 6)

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-br ${condition.gradient} p-6 text-white`}>
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-medium text-white/90">
            {location}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-bold tracking-tighter">
                {Math.round(current.temperature_2m)}°
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
                <ConditionIcon size={16} />
                <span>{condition.label}</span>
              </div>
            </div>
            <ConditionIcon size={64} className="text-white/70" />
          </div>

          <div className="mt-4 flex gap-4 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Droplets size={14} />
              <span>{current.relative_humidity_2m}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind size={14} />
              <span>{current.wind_speed_10m} km/h</span>
            </div>
          </div>
        </CardContent>
      </div>

      {forecastDays.length > 0 && (
        <div className="grid grid-cols-6 divide-x border-t">
          {forecastDays.map((time, index) => {
            const dayCondition = getWeatherCondition(daily.weather_code[index])
            const DayIcon = dayCondition.icon

            return (
              <div
                key={time}
                className="flex flex-col items-center gap-1 px-2 py-3 text-center"
              >
                <span className="text-xs text-muted-foreground">
                  {formatDayLabel(time)}
                </span>
                <DayIcon size={16} className="text-muted-foreground" />
                <div className="flex gap-1 text-xs">
                  <span className="font-medium">
                    {Math.round(daily.temperature_2m_max[index])}°
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(daily.temperature_2m_min[index])}°
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

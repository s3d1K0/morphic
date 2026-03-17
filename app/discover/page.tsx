import { Suspense } from 'react'
import { DiscoverContent } from '@/components/discover/discover-content'

export const metadata = {
  title: 'Discover - VISION',
  description: 'Explore trending topics and news'
}

export default function DiscoverPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Discover</h1>
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          <DiscoverContent />
        </Suspense>
      </div>
    </div>
  )
}

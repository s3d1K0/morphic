'use server'

import { db } from '@/lib/db'
import { feedback, generateId } from '@/lib/db/schema'

export async function submitFeedback(data: {
  sentiment: 'positive' | 'neutral' | 'negative'
  message: string
  pageUrl: string
}) {
  try {
    const userId = 'local-user'

    const { headers } = await import('next/headers')
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || undefined

    const id = generateId()
    await db.insert(feedback).values({
      id,
      userId,
      sentiment: data.sentiment,
      message: data.message,
      pageUrl: data.pageUrl,
      userAgent
    })

    return { success: true, id }
  } catch (error) {
    console.error('Failed to save feedback:', error)
    return { success: false, error: 'Failed to save feedback' }
  }
}

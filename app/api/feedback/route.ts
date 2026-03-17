import { updateMessageFeedback } from '@/lib/actions/feedback'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { score, messageId } = body

    if (score === undefined || (score !== 1 && score !== -1)) {
      return new Response('score must be 1 (good) or -1 (bad)', {
        status: 400,
        statusText: 'Bad Request'
      })
    }

    if (messageId) {
      const result = await updateMessageFeedback(
        messageId,
        score,
        'local-user'
      )

      if (!result.success) {
        console.error('Error updating message feedback:', result.error)
      }
    }

    return new Response('Feedback recorded successfully', {
      status: 200
    })
  } catch (error) {
    console.error('Error recording feedback:', error)
    return new Response('Error recording feedback', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}

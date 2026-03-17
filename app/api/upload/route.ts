import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { saveFile } from '@/lib/storage/r2-client'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const chatId = formData.get('chatId') as string
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    const sanitizedFileName = file.name
      .replace(/[^a-z0-9.\-_]/gi, '_')
      .toLowerCase()
    const filePath = `${userId}/chats/${chatId}/${Date.now()}-${sanitizedFileName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const publicUrl = await saveFile(buffer, filePath, file.type)

    return NextResponse.json(
      {
        success: true,
        file: {
          filename: file.name,
          url: publicUrl,
          mediaType: file.type,
          type: 'file'
        }
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Upload Error:', err)
    return NextResponse.json(
      { error: 'Upload failed', message: err.message },
      { status: 500 }
    )
  }
}

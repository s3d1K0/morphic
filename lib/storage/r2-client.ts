import * as fs from 'fs'
import * as path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'

export function getUploadDir(): string {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
  return UPLOAD_DIR
}

export async function saveFile(
  buffer: Buffer,
  filePath: string,
  _contentType: string
): Promise<string> {
  const fullPath = path.join(getUploadDir(), filePath)
  const dir = path.dirname(fullPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(fullPath, buffer)
  return `/uploads/${filePath}`
}

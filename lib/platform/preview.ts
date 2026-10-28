import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { WeddingContent } from '@/lib/content'
import { isRedisConfigured, pipeline } from '@/lib/redis'
import { isTemplateId, type TemplateId } from './templates'

export type PreviewDraft = {
  ownerId: string
  templateId: TemplateId
  content: WeddingContent
}

const DIR = join(process.cwd(), 'data', 'preview')
const keyOf = (id: string) => `platform:preview:${id}`

export async function writePreview(id: string, draft: PreviewDraft) {
  const body = JSON.stringify({ ...draft, at: Date.now() })
  if (isRedisConfigured) {
    await pipeline([['SET', keyOf(id), body, 'EX', '900']])
    return
  }
  await mkdir(DIR, { recursive: true })
  await writeFile(join(DIR, `${id}.json`), body, 'utf8')
}

export async function readPreview(id: string, ownerId: string): Promise<PreviewDraft | null> {
  const raw = await readRaw(id)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as PreviewDraft & { at?: number }
    if (data.ownerId !== ownerId || !isTemplateId(data.templateId) || !data.content) return null
    if (typeof data.at === 'number' && Date.now() - data.at > 15 * 60 * 1000) return null
    return { ownerId, templateId: data.templateId, content: data.content }
  } catch {
    return null
  }
}

async function readRaw(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  if (isRedisConfigured) {
    const [value] = await pipeline([['GET', keyOf(id)]])
    return typeof value === 'string' ? value : null
  }
  try {
    return await readFile(join(DIR, `${id}.json`), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

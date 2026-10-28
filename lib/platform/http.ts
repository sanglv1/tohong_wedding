import { NextResponse } from 'next/server'
import { logPlatformFailure, PlatformError } from './errors'

export function platformJson(error: unknown, fallback: string) {
  if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  logPlatformFailure(error)
  return NextResponse.json({ error: fallback }, { status: 502 })
}

import { NextResponse } from 'next/server'
import { publicOrigin } from '@/lib/platform/facebook'
import { logPlatformFailure } from '@/lib/platform/errors'
import { settleVnpay } from '@/lib/platform/ledger'
import { assessIpn, ipnBody, ipnWhitelistEnabled, readVnpayConfig, requestIp, vnpParamsFromEntries } from '@/lib/platform/vnpay'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function readParams(request: Request) {
  const query = vnpParamsFromEntries(new URL(request.url).searchParams.entries())
  if (request.method === 'GET') return query
  const type = request.headers.get('content-type') ?? ''
  if (!type.includes('application/x-www-form-urlencoded') && !type.includes('multipart/form-data')) return query
  const form = await request.formData()
  const body = vnpParamsFromEntries(
    [...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
  return body.vnp_SecureHash ? body : query
}

async function handle(request: Request) {
  try {
    const params = await readParams(request)
    const config = readVnpayConfig(`${publicOrigin(new URL(request.url))}/api/vnpay/return`)
    const assessed = assessIpn({
      params,
      secretKey: config?.secretKey ?? '',
      remoteIp: requestIp(request.headers),
      whitelist: ipnWhitelistEnabled(),
    })
    if (assessed.kind !== 'ready') return NextResponse.json(ipnBody(assessed.kind))
    const settled = await settleVnpay(assessed.notice)
    console.info(`VNPAY ipn ${assessed.notice.txnRef} ${settled.kind}`)
    return NextResponse.json(ipnBody(settled.kind))
  } catch (error) {
    logPlatformFailure(error)
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' })
  }
}

export const GET = handle
export const POST = handle

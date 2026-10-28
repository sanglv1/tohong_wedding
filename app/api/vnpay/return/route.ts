import { NextResponse } from 'next/server'
import { publicOrigin } from '@/lib/platform/facebook'
import { logPlatformFailure } from '@/lib/platform/errors'
import { settleVnpay } from '@/lib/platform/ledger'
import { isPaymentSuccess, minorAmount, readVnpayConfig, signatureValid, vnpParamsFromEntries } from '@/lib/platform/vnpay'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function back(requestUrl: URL, path: string) {
  return NextResponse.redirect(new URL(path, requestUrl))
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  try {
    const params = vnpParamsFromEntries(requestUrl.searchParams.entries())
    const config = readVnpayConfig(`${publicOrigin(requestUrl)}/api/vnpay/return`)
    if (!config || !signatureValid(params, config.secretKey)) return back(requestUrl, '/thanh-toan?vnpay=chu-ky')
    const txnRef = params.vnp_TxnRef ?? ''
    const amountMinor = minorAmount(params.vnp_Amount)
    if (!txnRef || amountMinor === null) return back(requestUrl, '/thanh-toan?vnpay=khong-thay')
    const settled = await settleVnpay({
      txnRef,
      amountMinor,
      success: isPaymentSuccess(params.vnp_ResponseCode, params.vnp_TransactionStatus),
      responseCode: params.vnp_ResponseCode || params.vnp_TransactionStatus || '99',
      transactionNo: params.vnp_TransactionNo || undefined,
      bankCode: params.vnp_BankCode || undefined,
      payDate: params.vnp_PayDate || undefined,
      cardType: params.vnp_CardType || undefined,
    })
    if (settled.kind === 'missing') return back(requestUrl, '/thanh-toan?vnpay=khong-thay')
    const flag = settled.kind === 'amount' ? 'lech' : settled.order.status === 'da-tra' ? 'xong' : 'chua'
    return back(requestUrl, `/don/${settled.order.id}?vnpay=${flag}`)
  } catch (error) {
    logPlatformFailure(error)
    return back(requestUrl, '/thanh-toan?vnpay=khong-thay')
  }
}

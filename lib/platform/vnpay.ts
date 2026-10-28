import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { VnpaySettlement } from './ledger'

/** Cổng thanh toán thường: Payment API 2.1.3, HMAC-SHA512. Không chọn ngân hàng trước. */
export const PAY_VERSION = '2.1.3'
export const PAY_ORDER_TYPE = 'billpayment'
const EXPIRE_MINUTES = 15
const DEFAULT_PAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'

/**
 * IP máy chủ VNPAY gọi IPN, lấy từ demo `VNPayUtils.TRUSTED_VNPAY_IPS`.
 * Sandbox rồi production.
 */
export const TRUSTED_VNPAY_IPS = [
  '113.160.92.202',
  '202.93.156.34',
  '203.205.17.226',
  '103.220.84.4',
  '113.52.45.78',
  '116.97.245.130',
  '42.118.107.252',
  '113.20.97.250',
  '203.171.19.146',
  '103.220.87.4',
  '103.220.86.4',
  '103.220.86.10',
  '103.220.87.10',
  '103.220.86.139',
  '103.220.87.139',
] as const

const RESPONSE_TEXT: Record<string, string> = {
  '00': 'Thanh toán thành công.',
  '07': 'Giao dịch bị nghi ngờ. Hãy liên hệ ngân hàng hoặc thử lại.',
  '09': 'Thẻ hoặc tài khoản chưa đăng ký Internet Banking.',
  '10': 'Xác thực thông tin thẻ chưa đúng quá số lần cho phép.',
  '11': 'Phiên thanh toán đã hết hạn. Hãy tạo phiên mới.',
  '12': 'Thẻ hoặc tài khoản bị khóa.',
  '13': 'Sai mật khẩu xác thực giao dịch.',
  '24': 'Bạn đã hủy thanh toán.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Tài khoản đã vượt hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng đang bảo trì.',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần.',
  '99': 'Lỗi từ cổng thanh toán. Hãy thử lại.',
}

export type VnpayConfig = {
  tmnCode: string
  secretKey: string
  payUrl: string
  returnUrl: string
}

type Env = Record<string, string | undefined>

export function vnpayKeysPresent(env: Env = process.env) {
  return Boolean(env.VNPAY_TMN_CODE?.trim() && env.VNPAY_SECRET_KEY?.trim())
}

export function readVnpayConfig(returnUrl: string, env: Env = process.env): VnpayConfig | null {
  const tmnCode = env.VNPAY_TMN_CODE?.trim() ?? ''
  const secretKey = env.VNPAY_SECRET_KEY?.trim() ?? ''
  const resolvedReturn = env.VNPAY_RETURN_URL?.trim() || returnUrl
  if (!tmnCode || !secretKey || !resolvedReturn) return null
  return {
    tmnCode,
    secretKey,
    payUrl: env.VNPAY_PAY_URL?.trim() || DEFAULT_PAY_URL,
    returnUrl: resolvedReturn,
  }
}

export function ipnWhitelistEnabled(env: Env = process.env) {
  const flag = env.VNPAY_IPN_WHITELIST?.trim().toLowerCase()
  if (flag === 'true' || flag === '1') return true
  if (flag === 'false' || flag === '0') return false
  return env.NODE_ENV === 'production'
}

/** Khớp `URLEncoder` của Java: dấu cách thành `+`, khác `encodeURIComponent` ở một số ký tự. */
export function javaUrlEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/~/g, '%7E')
}

export function formatGmt7(date: Date) {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const part = (value: number) => String(value).padStart(2, '0')
  return [
    shifted.getUTCFullYear(),
    part(shifted.getUTCMonth() + 1),
    part(shifted.getUTCDate()),
    part(shifted.getUTCHours()),
    part(shifted.getUTCMinutes()),
    part(shifted.getUTCSeconds()),
  ].join('')
}

export function newTxnRef(orderId: string, now = Date.now(), nonce = randomBytes(3).toString('hex')) {
  const head = orderId.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()
  const stamp = now.toString(36).toUpperCase()
  return `TH${head}${stamp}${nonce.toUpperCase()}`.replace(/[^A-Z0-9]/g, '').slice(0, 100)
}

export function orderInfoFor(code: string) {
  const clean = code.replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  return `Thanh toan To Hong ${clean}`.slice(0, 255)
}

export function requestIp(headerList: Headers) {
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim()
  const raw = forwarded || headerList.get('x-real-ip')?.trim() || '127.0.0.1'
  if (raw === '::1' || raw === '0:0:0:0:0:0:0:1') return '127.0.0.1'
  return raw.replace(/^::ffff:/, '')
}

export function isTrustedVnPayIp(ip: string) {
  return (TRUSTED_VNPAY_IPS as readonly string[]).includes(ip.trim())
}

function isHashField(name: string) {
  return name.toLowerCase() === 'vnp_securehash' || name.toLowerCase() === 'vnp_securehashtype'
}

/** Chuỗi ký: sắp xếp tên, bỏ trường rỗng và chữ ký, mã hóa giá trị theo Java. */
export function hashData(params: Record<string, string>) {
  return Object.keys(params)
    .filter((key) => !isHashField(key) && params[key])
    .sort()
    .map((key) => `${javaUrlEncode(key)}=${javaUrlEncode(params[key])}`)
    .join('&')
}

export function hmacSha512(secret: string, data: string) {
  return createHmac('sha512', secret).update(data, 'utf8').digest('hex')
}

function sameHash(left: string, right: string) {
  const a = Buffer.from(left.toLowerCase())
  const b = Buffer.from(right.toLowerCase())
  return a.length === b.length && timingSafeEqual(a, b)
}

export function signatureValid(params: Record<string, string>, secret: string) {
  const received = params.vnp_SecureHash || params.vnp_secure_hash || ''
  if (!received || !secret) return false
  return sameHash(received, hmacSha512(secret, hashData(params)))
}

export function buildPayUrl(config: VnpayConfig, input: { amountVnd: number; txnRef: string; orderInfo: string; clientIp: string; createAt?: Date }) {
  if (!Number.isInteger(input.amountVnd) || input.amountVnd < 10_000) {
    throw new Error('Số tiền không hợp lệ')
  }
  if (!/^[A-Za-z0-9]{1,100}$/.test(input.txnRef)) throw new Error('Mã giao dịch không hợp lệ')
  if (!input.orderInfo.trim()) throw new Error('Thiếu nội dung thanh toán')
  const created = input.createAt ?? new Date()
  const params: Record<string, string> = {
    vnp_Version: PAY_VERSION,
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(input.amountVnd * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: input.txnRef,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: PAY_ORDER_TYPE,
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: input.clientIp || '127.0.0.1',
    vnp_CreateDate: formatGmt7(created),
    vnp_ExpireDate: formatGmt7(new Date(created.getTime() + EXPIRE_MINUTES * 60 * 1000)),
  }
  const data = hashData(params)
  const hash = hmacSha512(config.secretKey, data)
  return `${config.payUrl}?${data}&vnp_SecureHash=${hash}`
}

export function vnpParamsFromEntries(entries: Iterable<[string, string]>) {
  const params: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (!key.startsWith('vnp_') || key in params) continue
    params[key] = value
  }
  return params
}

export function minorAmount(raw: string | undefined) {
  if (!raw || !/^\d+$/.test(raw)) return null
  const value = Number(raw)
  return Number.isSafeInteger(value) ? value : null
}

export function isPaymentSuccess(responseCode: string | undefined, transactionStatus: string | undefined) {
  return responseCode === '00' && (!transactionStatus || transactionStatus === '00')
}

export function vnpayResultText(code: string | undefined) {
  if (!code) return 'Thanh toán chưa hoàn tất.'
  return RESPONSE_TEXT[code] ?? `Thanh toán chưa hoàn tất (mã ${code}).`
}

export type IpnAssessment =
  | { kind: 'forbidden' | 'checksum' | 'amount' | 'missing' }
  | { kind: 'ready'; notice: VnpaySettlement }

function param(params: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (params[key]) return params[key]
  }
  const wanted = new Set(keys.map((key) => key.toLowerCase()))
  for (const [key, value] of Object.entries(params)) {
    if (value && wanted.has(key.toLowerCase())) return value
  }
  return ''
}

/**
 * Bước kiểm tra IPN trước khi ghi sổ, cùng thứ tự demo Java:
 * IP lạ, số tiền không đọc được, sai chữ ký, thiếu mã đơn.
 */
export function assessIpn(input: { params: Record<string, string>; secretKey: string; remoteIp: string; whitelist: boolean }): IpnAssessment {
  if (input.whitelist && !isTrustedVnPayIp(input.remoteIp)) return { kind: 'forbidden' }
  const amountMinor = minorAmount(param(input.params, 'vnp_Amount', 'vnp_amount'))
  if (amountMinor === null) return { kind: 'amount' }
  if (!signatureValid(input.params, input.secretKey)) return { kind: 'checksum' }
  const txnRef = param(input.params, 'vnp_TxnRef', 'vnp_txn_ref')
  if (!txnRef) return { kind: 'missing' }
  const responseCode = param(input.params, 'vnp_ResponseCode', 'vnp_response_code')
  const transactionStatus = param(input.params, 'vnp_TransactionStatus', 'vnp_transaction_status')
  return {
    kind: 'ready',
    notice: {
      txnRef,
      amountMinor,
      success: isPaymentSuccess(responseCode, transactionStatus),
      responseCode: responseCode || transactionStatus || '99',
      transactionNo: param(input.params, 'vnp_TransactionNo', 'vnp_transaction_no') || undefined,
      bankCode: param(input.params, 'vnp_BankCode', 'vnp_bank_code') || undefined,
      payDate: param(input.params, 'vnp_PayDate', 'vnp_pay_date') || undefined,
      cardType: param(input.params, 'vnp_CardType', 'vnp_card_type') || undefined,
    },
  }
}

export function ipnBody(kind: 'paid' | 'failed' | 'already' | 'missing' | 'amount' | 'checksum' | 'forbidden') {
  if (kind === 'paid' || kind === 'failed') return { RspCode: '00', Message: 'Confirm Success' }
  if (kind === 'already') return { RspCode: '02', Message: 'Order already confirmed' }
  if (kind === 'missing') return { RspCode: '01', Message: 'Order not Found' }
  if (kind === 'amount') return { RspCode: '04', Message: 'Invalid Amount' }
  if (kind === 'forbidden') return { RspCode: '97', Message: 'IP Address not allowed' }
  return { RspCode: '97', Message: 'Invalid Checksum' }
}

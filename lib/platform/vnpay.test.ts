import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { canPublishFor, type Order } from './commerce'
import { decideVnpaySettlement, type VnpaySettlement } from './ledger'
import {
  assessIpn,
  buildPayUrl,
  formatGmt7,
  hashData,
  hmacSha512,
  ipnBody,
  isPaymentSuccess,
  javaUrlEncode,
  newTxnRef,
  orderInfoFor,
  signatureValid,
  vnpParamsFromEntries,
} from './vnpay'

const secret = 'SECRETKEY'
const created = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))

test('mã hóa tham số giống URLEncoder của Java', () => {
  assert.equal(javaUrlEncode('Thanh toan To Hong'), 'Thanh+toan+To+Hong')
  assert.equal(javaUrlEncode("a!'()~"), 'a%21%27%28%29%7E')
})

test('giờ tạo đơn là GMT+7, phiên hết hạn sau 15 phút', () => {
  assert.equal(formatGmt7(created), '20260101070000')
  const url = new URL(
    buildPayUrl(
      {
        tmnCode: 'TOHONG01',
        secretKey: secret,
        payUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: 'http://localhost:3000/api/vnpay/return',
      },
      {
        amountVnd: 150_000,
        txnRef: 'THORDER01',
        orderInfo: orderInfoFor('TOHONG AAAAAAAA'),
        clientIp: '127.0.0.1',
        createAt: created,
      },
    ),
  )
  assert.equal(url.searchParams.get('vnp_Amount'), '15000000')
  assert.equal(url.searchParams.get('vnp_Command'), 'pay')
  assert.equal(url.searchParams.get('vnp_Version'), '2.1.3')
  assert.equal(url.searchParams.get('vnp_OrderType'), 'billpayment')
  assert.equal(url.searchParams.get('vnp_CreateDate'), '20260101070000')
  assert.equal(url.searchParams.get('vnp_ExpireDate'), '20260101071500')
  assert.equal(url.searchParams.get('vnp_BankCode'), null)
  const params = vnpParamsFromEntries(url.searchParams.entries())
  assert.equal(signatureValid(params, secret), true)
  const data = hashData(params)
  const expected = createHmac('sha512', secret).update(data, 'utf8').digest('hex')
  assert.equal(hmacSha512(secret, data), expected)
  assert.match(data, /vnp_OrderInfo=Thanh\+toan\+To\+Hong\+TOHONG\+AAAAAAAA/)
  params.vnp_Amount = '1'
  assert.equal(signatureValid(params, secret), false)
})

test('IPN đúng chữ ký thì sẵn sàng ghi sổ, sai tiền hoặc sai IP thì từ chối', () => {
  const params: Record<string, string> = {
    vnp_Amount: '15000000',
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TxnRef: 'THORDER01',
    vnp_TransactionNo: '123456',
  }
  params.vnp_SecureHash = hmacSha512(secret, hashData(params))
  const ready = assessIpn({ params, secretKey: secret, remoteIp: '113.160.92.202', whitelist: true })
  assert.equal(ready.kind, 'ready')
  if (ready.kind === 'ready') {
    assert.equal(ready.notice.success, true)
    assert.equal(ready.notice.amountMinor, 15_000_000)
    assert.equal(ready.notice.transactionNo, '123456')
  }
  assert.equal(assessIpn({ params, secretKey: secret, remoteIp: '1.2.3.4', whitelist: true }).kind, 'forbidden')
  assert.equal(assessIpn({ params: { ...params, vnp_SecureHash: '00' }, secretKey: secret, remoteIp: '127.0.0.1', whitelist: false }).kind, 'checksum')
  assert.equal(assessIpn({ params: { ...params, vnp_Amount: 'x' }, secretKey: secret, remoteIp: '127.0.0.1', whitelist: false }).kind, 'amount')
  assert.deepEqual(ipnBody('paid'), { RspCode: '00', Message: 'Confirm Success' })
  assert.deepEqual(ipnBody('already'), { RspCode: '02', Message: 'Order already confirmed' })
  assert.equal(isPaymentSuccess('00', '00'), true)
  assert.equal(isPaymentSuccess('00', '02'), false)
  assert.equal(isPaymentSuccess('24', ''), false)
})

test('IPN thành công thì được xuất bản, chưa trả hoặc sai tiền thì không', () => {
  const waiting: Order = {
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    userId: 'user-1',
    plan: 'mot-thiep',
    invitationId: 'thiep-1',
    amount: 150_000,
    code: 'TOHONG AAAAAAAA',
    status: 'cho',
    createdAt: '2026-10-01T00:00:00.000Z',
    payment: { provider: 'vnpay', txnRef: 'THORDER01', attempts: ['THORDER01'] },
  }
  const now = Date.parse('2026-10-27T00:00:00.000Z')
  const params: Record<string, string> = {
    vnp_Amount: '15000000',
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TxnRef: 'THORDER01',
    vnp_TransactionNo: '99',
  }
  params.vnp_SecureHash = hmacSha512(secret, hashData(params))
  const ready = assessIpn({ params, secretKey: secret, remoteIp: '113.160.92.202', whitelist: true })
  assert.equal(ready.kind, 'ready')
  if (ready.kind !== 'ready') return

  assert.equal(canPublishFor([waiting], 'member', 'user-1', 'thiep-1', false, now), false)
  const paid = decideVnpaySettlement(waiting, ready.notice, new Date(now))
  assert.equal(paid.kind, 'paid')
  if (paid.kind !== 'paid') return
  assert.equal(paid.order.status, 'da-tra')
  assert.equal(paid.order.payment?.transactionNo, '99')
  assert.equal(canPublishFor([paid.order], 'member', 'user-1', 'thiep-1', false, now), true)

  const wrongUnit = decideVnpaySettlement(waiting, { ...ready.notice, amountMinor: 150_000 })
  assert.equal(wrongUnit.kind, 'amount')
  if (wrongUnit.kind !== 'amount') return
  assert.equal(wrongUnit.order.status, 'cho')
  assert.equal(canPublishFor([wrongUnit.order], 'member', 'user-1', 'thiep-1', false, now), false)

  const failedNotice: VnpaySettlement = { ...ready.notice, success: false, responseCode: '24' }
  const failed = decideVnpaySettlement(waiting, failedNotice)
  assert.equal(failed.kind, 'failed')
  if (failed.kind !== 'failed') return
  assert.equal(failed.order.status, 'cho')
  assert.equal(failed.order.paidAt, undefined)

  const refunded = decideVnpaySettlement({ ...waiting, status: 'hoan' }, ready.notice, new Date(now))
  assert.equal(refunded.kind, 'already')
  if (refunded.kind !== 'already') return
  assert.equal(refunded.changed, false)
  assert.equal(refunded.order.status, 'hoan')
  assert.equal(canPublishFor([refunded.order], 'member', 'user-1', 'thiep-1', false, now), false)
})

test('mã giao dịch chỉ còn chữ và số', () => {
  const ref = newTxnRef('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 1_700_000_000_000, 'ab12cd')
  assert.match(ref, /^[A-Z0-9]+$/)
  assert.ok(ref.startsWith('THAAAAAAAA'))
})

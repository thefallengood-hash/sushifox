// netlify/functions/liqpay.js
import crypto from 'crypto';
const _getFetch = async () => (typeof fetch === 'undefined') ? (await import('node-fetch')).default : fetch;

export async function handler(event) {
  try {
    const LIQPAY_PUBLIC = process.env.LIQPAY_PUBLIC_KEY;
    const LIQPAY_PRIVATE = process.env.LIQPAY_PRIVATE_KEY;
    const SANDBOX = process.env.LIQPAY_SANDBOX === '0' || process.env.LIQPAY_SANDBOX === 'false' ? 0 : 1;
    const body = JSON.parse(event.body || '{}');
    const { orderId, amount, description } = body;

    if (!orderId || !amount) return { statusCode:400, body: 'Missing orderId or amount' };

    if (!LIQPAY_PUBLIC || !LIQPAY_PRIVATE) {
      const html = `
        <html><body style="font-family:system-ui;padding:24px">
          <h3>Тестова сторінка LiqPay</h3>
          <p>Order: ${orderId}</p>
          <p>Amount: ${amount} UAH</p>
          <p>LIQPAY keys not set. Це тестова сторінка.</p>
          <button onclick="history.back()">Повернутись</button>
        </body></html>`;
      return { statusCode:200, headers:{ 'Content-Type':'text/html' }, body: html };
    }

    const paramsObj = {
      public_key: LIQPAY_PUBLIC,
      version: "3",
      action: "pay",
      amount: amount,
      currency: "UAH",
      description: description || `Оплата замовлення #${orderId}`,
      order_id: String(orderId),
      language: "uk",
      sandbox: SANDBOX
    };

    const params = Buffer.from(JSON.stringify(paramsObj)).toString('base64');
    const signature = crypto.createHash('sha1').update(LIQPAY_PRIVATE + params + LIQPAY_PRIVATE).digest('base64');

    const html = `
      <!doctype html><html><head><meta charset="utf-8"><title>Оплата</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;">
        <form method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8" id="liqpay_form">
          <input type="hidden" name="data" value="${params}" />
          <input type="hidden" name="signature" value="${signature}" />
          <button type="submit" style="padding:12px 20px;font-size:16px;font-weight:700;background:linear-gradient(120deg,#ff9900,#ff9900);color:#fff;border:none;border-radius:12px;cursor:pointer;">
            Перейти до оплати
          </button>
        </form>
        <script>document.getElementById('liqpay_form').submit();</script>
      </body></html>`;

    return { statusCode: 200, headers: { 'Content-Type':'text/html' }, body: html };

  } catch (err) {
    console.error('liqpay.js error', err);
    return { statusCode:500, body: `Error: ${err.message}` };
  }
}

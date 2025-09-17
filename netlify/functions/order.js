// netlify/functions/order.js
const _getFetch = async () =>
  (typeof fetch === 'undefined') ? (await import('node-fetch')).default : fetch;

export async function handler(event) {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');

    // проверяем товары
    const items = (body.items || []).map(i => {
      const product_id = i.id; // должно быть настоящее product_id из Poster
      const qty = i.qty || 1;
      const priceUah = i.price || 0;

      return {
        product_id,
        count: qty,
        price: Math.round(priceUah * 100) // гривны -> копейки
      };
    });

    if (!POSTER_TOKEN) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          id: Math.floor(Math.random() * 900000) + 100000
        })
      };
    }

    const orderBody = {
      spot_id: 1, // твоя точка
      phone: body.customer?.phone || '',
      first_name: body.customer?.name || '',
      address: body.customer?.addr || '',
      comment: body.customer?.note || '',
      products: items
    };

    console.log('Отправляем заказ в Poster:', JSON.stringify(orderBody));

    const res = await fetch(
      `https://joinposter.com/api/incomingOrders.createIncomingOrder?token=${POSTER_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody)
      }
    );

    const result = await res.json();
    console.log('Ответ Poster:', result);

    if (!result?.response) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Poster returned error',
          detail: result
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        id: result.response.incoming_order_id
      })
    };

  } catch (err) {
    console.error('order.js error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
}

// netlify/functions/order.js
const _getFetch = async () =>
  typeof fetch === 'undefined' ? (await import('node-fetch')).default : fetch;

export async function handler(event) {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const items = (body.items || []).map(i => ({
      product_id: i.id,       // Poster product_id
      count: i.qty || 1,
      // Poster требует цену в минимальной единице (копейки)
      price: Math.round(i.price * 100)
    }));

    // Локальный тест без Poster
    if (!POSTER_TOKEN) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          id: Math.floor(Math.random() * 900000) + 100000
        })
      };
    }

    // Формируем тело заказа
    const orderBody = {
      phone: body.customer?.phone || '',
      first_name: body.customer?.name || '',
      address: body.customer?.addr || '',
      comment: body.customer?.note || '',
      products: items
    };

    const res = await fetch(
      `https://joinposter.com/api/incomingOrders.createIncomingOrder?token=${POSTER_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody)
      }
    );

    const result = await res.json();

    if (!result?.response) {
      console.error('Poster error', result);
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

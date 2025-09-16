// netlify/functions/menu.js
const _getFetch = async () => (typeof fetch === 'undefined') ? (await import('node-fetch')).default : fetch;

export async function handler() {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;

    if (!POSTER_TOKEN) {
      return { statusCode:500, body: JSON.stringify({ error: 'POSTER_API_KEY not set' }) };
    }

    const res = await fetch(`https://joinposter.com/api/product.getAll?token=${POSTER_TOKEN}`);
    const data = await res.json();

    if (!data?.response?.products) {
      return { statusCode:500, body: JSON.stringify({ error: 'Poster returned invalid data', detail: data }) };
    }

    // Форматуємо продукти для фронтенду
    const products = data.response.products.map(p => ({
      id: p.product_id,
      name: p.name,
      price: Number(p.price) || 0,
      category: p.category_name || 'Інше',
      img: p.image || '/images/noimage.png',
      desc: p.description || ''
    }));

    return { statusCode:200, body: JSON.stringify(products) };

  } catch(err) {
    console.error('menu.js error', err);
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}

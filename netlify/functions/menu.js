// netlify/functions/menu.js
const _getFetch = async () =>
  typeof fetch === 'undefined' ? (await import('node-fetch')).default : fetch;

export async function handler(event) {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;

    if (!POSTER_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'POSTER_API_KEY not set' }),
      };
    }

    // Отримуємо товари з Poster
    const res = await fetch(
      `https://joinposter.com/api/menu.getProducts?token=${POSTER_TOKEN}`
    );
    const data = await res.json();

    if (!data?.response) {
      return { statusCode: 500, body: JSON.stringify(data) };
    }

    const products = (data.response.products || []).map((p) => ({
      id: p.product_id,       // реальний ID з Poster
      name: p.name,
      desc: p.description || '',
      price: Number(p.price),
      category: p.category_name || 'Інше',
      img: p.images?.[0]?.url || '/images/noimage.png',
    }));

    // Отримуємо категорії
    const categories =
      data.response.categories?.map((c) => c.name) ||
      Array.from(new Set(products.map((p) => p.category)));

    return {
      statusCode: 200,
      body: JSON.stringify({ products, categories }),
    };
  } catch (err) {
    console.error('menu.js error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

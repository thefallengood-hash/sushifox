// netlify/functions/menu.js
const _getFetch = async () =>
  typeof fetch === 'undefined' ? (await import('node-fetch')).default : fetch;

export async function handler() {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;
    if (!POSTER_TOKEN) {
      return { statusCode: 200, body: JSON.stringify({ products: [], categories: [] }) };
    }

    // Получаем категории
    const catRes = await fetch(`https://joinposter.com/api/menu.getCategories?token=${POSTER_TOKEN}`);
    const catData = await catRes.json();
    const categories = (catData?.response || []).map(c => c.name);

    // Получаем товары
    const prodRes = await fetch(`https://joinposter.com/api/menu.getProducts?token=${POSTER_TOKEN}`);
    const prodData = await prodRes.json();
    const products = (prodData?.response || []).map(p => ({
      id: p.product_id,
      name: p.name,
      price: p.price,
      category: p.category_name || 'Інше',
      img: p.image_url || '/images/noimage.png',
      desc: p.description || ''
    }));

    return { statusCode: 200, body: JSON.stringify({ products, categories }) };
  } catch (err) {
    console.error('menu.js error', err);
    return { statusCode: 500, body: JSON.stringify({ products: [], categories: [] }) };
  }
}

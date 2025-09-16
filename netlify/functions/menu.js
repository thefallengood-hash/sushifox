// netlify/functions/menu.js
const _getFetch = async () =>
  typeof fetch === 'undefined' ? (await import('node-fetch')).default : fetch;

export async function handler() {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;

    if (!POSTER_TOKEN) {
      console.error('Нет POSTER_API_KEY в environment variables!');
      return { statusCode: 200, body: JSON.stringify({ products: [], categories: [] }) };
    }

    // Получаем все меню (категории + продукты) через один запрос
    const res = await fetch(`https://joinposter.com/api/menu.getMenu?token=${POSTER_TOKEN}`);
    const data = await res.json();

    if (!data?.response) {
      console.error('Poster API вернул ошибку:', data);
      return { statusCode: 500, body: JSON.stringify({ products: [], categories: [] }) };
    }

    // Категории
    const categories = (data.response.categories || []).map(c => c.name);

    // Продукты
    const products = (data.response.products || []).map(p => ({
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

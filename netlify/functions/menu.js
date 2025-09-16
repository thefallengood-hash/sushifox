// netlify/functions/menu.js
const _getFetch = async () => (typeof fetch === 'undefined') ? (await import('node-fetch')).default : fetch;

export async function handler() {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;
    if (!POSTER_TOKEN) {
      return {
        statusCode:200,
        body: JSON.stringify({ categories:['Демо'], products:[
          { id:'demo1', name:'Суші Каліфорнія', desc:'Рис, лосось, авокадо', price:120, category:'Суші', img:'/images/sushi1.jpg'}
        ]})
      };
    }

    // 1) Отримати всі товари
    const res = await fetch(`https://joinposter.com/api/products.getProducts?token=${POSTER_TOKEN}`);
    const data = await res.json();
    if(!data?.response?.products) return { statusCode:500, body:'Poster returned empty' };

    const products = data.response.products.map(p=>({
      id: p.product_id,
      name: p.product_name,
      desc: p.description || '',
      price: Number(p.price),
      category: p.category_name || 'Інше',
      img: p.image_url || '/images/noimage.png'
    }));

    const categories = Array.from(new Set(products.map(p=>p.category)));

    return { statusCode:200, body: JSON.stringify({ categories, products }) };

  } catch(err) {
    console.error('menu.js error', err);
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}

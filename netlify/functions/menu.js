// netlify/functions/menu.js
const _getFetch = async () => (typeof fetch === 'undefined') ? (await import('node-fetch')).default : fetch;

export async function handler() {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;

    if (!POSTER_TOKEN) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          products: [],
          categories: []
        }) 
      };
    }

    // 1) отримати список категорій
    const catRes = await fetch('https://joinposter.com/api/productcategory.getAll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: POSTER_TOKEN })
    });
    const catData = await catRes.json();
    const categories = (catData.categories || []).map(c => c.name);

    // 2) отримати список продуктів
    const prodRes = await fetch('https://joinposter.com/api/product.getAll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: POSTER_TOKEN })
    });
    const prodData = await prodRes.json();
    const products = (prodData.products || []).map(p => ({
      id: p.id,
      name: p.name,
      desc: p.description || '',
      price: Number(p.price) || 0,
      category: categories.find(c => c === p.product_category_name) || 'Інше',
      img: p.image_url || ''
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ products, categories })
    };

  } catch(err) {
    console.error('menu.js error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

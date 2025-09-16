const _getFetch = async () =>
  typeof fetch === 'undefined' ? (await import('node-fetch')).default : fetch;

export async function handler() {
  try {
    const fetch = await _getFetch();
    const POSTER_TOKEN = process.env.POSTER_API_KEY;
    if (!POSTER_TOKEN) {
      return { statusCode: 200, body: JSON.stringify({ products: [], categories: [] }) };
    }

    // --- Отримуємо категорії ---
    const catRes = await fetch(`https://joinposter.com/api/menu.getCategories?token=${POSTER_TOKEN}`);
    const catData = await catRes.json();
    const categoriesRaw = catData?.response || [];

    // Створюємо масив категорій для select
    const categories = categoriesRaw.map(c => ({
      id: c.category_id,
      category_name: c.category_name
    }));

    // --- Отримуємо продукти ---
    const prodRes = await fetch(`https://joinposter.com/api/menu.getProducts?token=${POSTER_TOKEN}`);
    const prodData = await prodRes.json();
    const productsRaw = prodData?.response || [];

    // Прив'язуємо продукти до категорій
    const products = productsRaw.map(p => {
      const cat = categories.find(c => c.id === p.menu_category_id);
      const price = Number(Object.values(p.price || {})[0]) || 0;
      return {
        id: p.product_id,
        name: p.product_name,
        price: price,
        category: cat ? cat.category_name : 'Інше',
        img: p.photo ? `https://joinposter.com${p.photo}` : '/images/noimage.png',
        desc: p.product_production_description || ''
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ products, categories: categories.map(c => c.category_name) })
    };
  } catch (err) {
    console.error('menu.js error', err);
    return { statusCode: 500, body: JSON.stringify({ products: [], categories: [] }) };
  }
}

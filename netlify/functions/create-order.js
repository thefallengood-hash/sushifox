import crypto from "crypto";

export async function handler(event, context) {
  const MERCHANT_ACCOUNT = "sushi_fox_netlify_app";
  const MERCHANT_PASSWORD = "f898a66a913cf08ce0e51cc9c14b987b2ddb304b"; 
  const MERCHANT_DOMAIN_NAME = "sushi-fox.netlify.app";

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Нет данных в запросе" }) };
  }

  try {
    const { products } = JSON.parse(event.body);

    if (!products || !products.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Нет товаров в заказе" }) };
    }

    // Генерируем уникальный номер заказа
    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);

    // Преобразуем товары
    const productName = products.map(p => p.name.replace(/;/g, ",")).join(";");
    const productPrice = products
      .map(p => Math.round(Number(p.price) * 100)) // в копейках
      .join(";");
    const productCount = products.map(p => p.qty.toString()).join(";");

    // Общая сумма заказа
    const amount = products.reduce((sum, p) => sum + Math.round(Number(p.price) * 100) * p.qty, 0);

    // Формируем сигнатуру
    const signatureString = [
      MERCHANT_ACCOUNT,
      MERCHANT_DOMAIN_NAME,
      orderReference,
      orderDate,
      (amount / 100).toFixed(2), // WayForPay ожидает в гривнах
      "UAH",
      productName,
      productCount,
      productPrice
    ].join(";");

    const merchantSignature = crypto
      .createHmac("md5", MERCHANT_PASSWORD)
      .update(signatureString)
      .digest("hex");

    return {
      statusCode: 200,
      body: JSON.stringify({
        merchantAccount: MERCHANT_ACCOUNT,
        merchantDomainName: MERCHANT_DOMAIN_NAME,
        merchantAuthType: "SimpleSignature",
        orderReference,
        orderDate,
        amount: (amount / 100).toFixed(2),
        currency: "UAH",
        productName,
        productPrice,
        productCount,
        merchantSignature
      })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Ошибка при обработке заказа" }) };
  }
}

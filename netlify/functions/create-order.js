import crypto from "crypto";

export async function handler(event, context) {
  const MERCHANT_ACCOUNT = "sushi_fox_netlify_app";
  const MERCHANT_PASSWORD = "f898a66a913cf08ce0e51cc9c14b987b2ddb304b"; 
  const MERCHANT_DOMAIN_NAME = "sushi-fox.netlify.app";

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Нет данных в запросе" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { amount, products } = body;

    if (!products || products.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Нет товаров в заказе" })
      };
    }

    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);

    // Собираем строки
    const productName = products.map(p => p.name).join(";");
    const productPrice = products.map(p => p.price).join(";");
    const productCount = products.map(p => p.qty).join(";");

    // Строка для подписи
    const signatureString = [
      MERCHANT_ACCOUNT,
      MERCHANT_DOMAIN_NAME,
      orderReference,
      orderDate,
      amount,
      "UAH",
      productName,
      productCount,
      productPrice
    ].join(";");

// Вместо md5 + hex делаем sha1 + base64
const merchantSignature = crypto
  .createHmac("sha1", MERCHANT_PASSWORD)
  .update(signatureString)
  .digest("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
        merchantAccount: MERCHANT_ACCOUNT,
        merchantDomainName: MERCHANT_DOMAIN_NAME,
        orderReference,
        orderDate,
        amount,
        currency: "UAH",
        productName,
        productPrice,
        productCount,
        merchantSignature
      })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Ошибка при обработке заказа" })
    };
  }
}
